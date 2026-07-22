import { db } from "@/lib/db";
import { gradeSurvivorForGame } from "@/lib/survivor";
import type { PickResult, PickSide } from "@/generated/prisma/client";

// Straight-up grading: 1 point per correct winner; a tie is a push worth 0.
// All leagues are scored this way — pick the winner, no spreads.
function gradeStraightUp(
  side: PickSide,
  homeScore: number,
  awayScore: number,
): { result: PickResult; points: number } {
  if (homeScore === awayScore) return { result: "PUSH", points: 0 };
  const homeWon = homeScore > awayScore;
  const correct = side === "HOME" ? homeWon : !homeWon;
  return correct ? { result: "WIN", points: 1 } : { result: "LOSS", points: 0 };
}

// Grade (or reset) every pick on a game. Safe to call repeatedly: if the game
// isn't final (e.g. a score was cleared), picks revert to pending/0.
export async function settleGame(gameId: string): Promise<void> {
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { status: true, homeScore: true, awayScore: true },
  });
  if (!game) return;

  const final =
    game.status === "FINAL" && game.homeScore != null && game.awayScore != null;
  const picks = await db.pick.findMany({
    where: { gameId },
    select: { id: true, side: true, result: true, pointsAwarded: true },
  });

  for (const p of picks) {
    if (!final) {
      if (p.result !== "PENDING" || p.pointsAwarded !== 0) {
        await db.pick.update({
          where: { id: p.id },
          data: { result: "PENDING", pointsAwarded: 0 },
        });
      }
      continue;
    }
    const { result, points } = gradeStraightUp(
      p.side,
      game.homeScore as number,
      game.awayScore as number,
    );
    if (p.result !== result || p.pointsAwarded !== points) {
      await db.pick.update({
        where: { id: p.id },
        data: { result, pointsAwarded: points },
      });
    }
  }

  // Survivor picks on this game are graded the same way (team must win SU).
  await gradeSurvivorForGame(gameId);
}

export type FormResult = "W" | "L" | "P";
export type LeaderboardRow = {
  userId: string;
  name: string;
  image: string | null;
  avatarColor: string | null;
  avatarEmoji: string | null;
  points: number;
  wins: number;
  losses: number;
  pushes: number;
  total: number;
  form: FormResult[]; // last up-to-5, oldest -> newest
  movement: number | null; // rank change vs before the latest week (+up/-down)
};

// Global standings across all settled picks.
// Pass `memberIds` to scope the board to a group's members; omit for global.
export async function getLeaderboard(memberIds?: string[]): Promise<LeaderboardRow[]> {
  const scope = memberIds ? { userId: { in: memberIds } } : {};
  const rows = await db.pick.groupBy({
    by: ["userId", "result"],
    where: { result: { in: ["WIN", "LOSS", "PUSH"] }, ...scope },
    _count: { _all: true },
    _sum: { pointsAwarded: true },
  });

  const byUser = new Map<
    string,
    { points: number; wins: number; losses: number; pushes: number; total: number }
  >();
  for (const r of rows) {
    const e =
      byUser.get(r.userId) ??
      { points: 0, wins: 0, losses: 0, pushes: 0, total: 0 };
    const count = r._count._all;
    e.total += count;
    e.points += r._sum.pointsAwarded ?? 0;
    if (r.result === "WIN") e.wins += count;
    else if (r.result === "LOSS") e.losses += count;
    else if (r.result === "PUSH") e.pushes += count;
    byUser.set(r.userId, e);
  }

  // Each player's last-5 form (most recent settled picks).
  const recent = await db.pick.findMany({
    where: { result: { in: ["WIN", "LOSS", "PUSH"] }, ...scope },
    select: { userId: true, result: true },
    orderBy: { game: { kickoff: "desc" } },
  });
  const formByUser = new Map<string, FormResult[]>();
  for (const p of recent) {
    const arr = formByUser.get(p.userId) ?? [];
    if (arr.length < 5) {
      arr.push(p.result === "WIN" ? "W" : p.result === "LOSS" ? "L" : "P");
      formByUser.set(p.userId, arr);
    }
  }

  const users = await db.user.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: {
      id: true, username: true, name: true,
      image: true, avatarColor: true, avatarEmoji: true,
    },
  });
  const userOf = new Map(users.map((u) => [u.id, u]));

  const base = [...byUser.entries()]
    .map(([userId, s]) => {
      const u = userOf.get(userId);
      return {
        userId,
        name: u?.username ?? u?.name ?? "Player",
        image: u?.image ?? null,
        avatarColor: u?.avatarColor ?? null,
        avatarEmoji: u?.avatarEmoji ?? null,
        ...s,
        form: (formByUser.get(userId) ?? []).slice().reverse(),
      };
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses);

  const currentRank = new Map(base.map((r, i) => [r.userId, i]));

  // Rank movement vs the standings *before* the latest settled week — derived,
  // so we don't need stored snapshots.
  const movement = new Map<string, number | null>();
  const settled = await db.pick.findMany({
    where: { result: { in: ["WIN", "LOSS", "PUSH"] }, ...scope },
    select: { userId: true, pointsAwarded: true, game: { select: { week: true } } },
  });
  const weeks = settled.map((p) => p.game.week).filter((w): w is number => w != null);
  if (weeks.length > 0) {
    const latest = Math.max(...weeks);
    if (weeks.some((w) => w < latest)) {
      const priorPts = new Map<string, number>();
      for (const p of settled) {
        if (p.game.week != null && p.game.week < latest) {
          priorPts.set(p.userId, (priorPts.get(p.userId) ?? 0) + p.pointsAwarded);
        }
      }
      const priorRank = new Map(
        base
          .map((r) => ({ userId: r.userId, pts: priorPts.get(r.userId) ?? 0 }))
          .sort((a, b) => b.pts - a.pts)
          .map((r, i) => [r.userId, i] as const),
      );
      for (const r of base) {
        const pr = priorRank.get(r.userId);
        movement.set(r.userId, pr == null ? null : pr - (currentRank.get(r.userId) ?? 0));
      }
    }
  }

  return base.map((r) => ({ ...r, movement: movement.get(r.userId) ?? null }));
}
