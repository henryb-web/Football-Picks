import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import type { League, PickResult } from "@/generated/prisma/client";

export type Badge = { emoji: string; label: string };
export type UserStats = {
  wins: number;
  losses: number;
  pushes: number;
  accuracy: number; // 0..1 over decided (win/loss) picks
  currentStreak: number; // consecutive recent wins
  longestStreak: number;
  badges: Badge[];
};

type StatPick = { result: PickResult; week: number | null; league: League };

// Core stats/badges from one user's settled picks (chronological, oldest first).
// `weeklyWinner` is pool-wide context (top of the pool in any settled week) — it
// can't be derived from a single player's picks alone, so callers pass it in.
function computeStats(picks: StatPick[], weeklyWinner: boolean): UserStats {
  const wins = picks.filter((p) => p.result === "WIN").length;
  const losses = picks.filter((p) => p.result === "LOSS").length;
  const pushes = picks.filter((p) => p.result === "PUSH").length;
  const decided = wins + losses;
  const accuracy = decided > 0 ? wins / decided : 0;

  // Streaks over the chronological win/loss sequence (pushes skipped).
  let longestStreak = 0;
  let run = 0;
  for (const p of picks) {
    if (p.result === "WIN") {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else if (p.result === "LOSS") {
      run = 0;
    }
  }
  // Current streak: trailing wins (pushes skipped, loss stops it).
  let currentStreak = 0;
  for (let i = picks.length - 1; i >= 0; i--) {
    if (picks[i].result === "PUSH") continue;
    if (picks[i].result === "WIN") currentStreak += 1;
    else break;
  }

  // Per-week tallies: perfect week + iron-man participation.
  const byWeek = new Map<number, { w: number; total: number }>();
  for (const p of picks) {
    const wk = p.week ?? 0;
    const e = byWeek.get(wk) ?? { w: 0, total: 0 };
    e.total += 1;
    if (p.result === "WIN") e.w += 1;
    byWeek.set(wk, e);
  }
  const perfectWeek = [...byWeek.values()].some((e) => e.total >= 3 && e.w === e.total);
  const weeksPlayed = byWeek.size;

  // Comeback: a stretch of >= 2 straight losses immediately followed by >= 3
  // straight wins (pushes ignored so they don't break the run).
  let comeback = false;
  let lossRun = 0;
  let winRunAfterLoss = 0;
  for (const p of picks) {
    if (p.result === "PUSH") continue;
    if (p.result === "LOSS") {
      lossRun += 1;
      winRunAfterLoss = 0;
    } else {
      if (lossRun >= 2) {
        winRunAfterLoss += 1;
        if (winRunAfterLoss >= 3) comeback = true;
      }
    }
  }

  // League specialist: >= 70% accuracy over >= 6 decided picks in one league.
  const byLeague = new Map<League, { w: number; decided: number }>();
  for (const p of picks) {
    if (p.result === "PUSH") continue;
    const e = byLeague.get(p.league) ?? { w: 0, decided: 0 };
    e.decided += 1;
    if (p.result === "WIN") e.w += 1;
    byLeague.set(p.league, e);
  }
  let specialist: League | null = null;
  let specialistAcc = 0;
  for (const [lg, e] of byLeague) {
    if (e.decided >= 6) {
      const acc = e.w / e.decided;
      if (acc >= 0.7 && acc > specialistAcc) {
        specialist = lg;
        specialistAcc = acc;
      }
    }
  }

  // Ordered by prestige — leaderboard rows show only the first couple.
  const badges: Badge[] = [];
  if (weeklyWinner) badges.push({ emoji: "🏆", label: "Weekly winner" });
  if (perfectWeek) badges.push({ emoji: "💯", label: "Perfect week" });
  if (currentStreak >= 3)
    badges.push({ emoji: "🔥", label: `${currentStreak}-pick win streak` });
  if (decided >= 10 && accuracy >= 0.65)
    badges.push({ emoji: "🎯", label: `${Math.round(accuracy * 100)}% accuracy` });
  if (specialist)
    badges.push({
      emoji: "🎓",
      label: `${LEAGUE_LABELS[specialist]} specialist (${Math.round(specialistAcc * 100)}%)`,
    });
  if (comeback) badges.push({ emoji: "🔄", label: "Comeback" });
  if (wins >= 25) badges.push({ emoji: "🏈", label: `${wins} correct picks` });
  if (weeksPlayed >= 5) badges.push({ emoji: "🧱", label: `Iron man · ${weeksPlayed} weeks` });

  return { wins, losses, pushes, accuracy, currentStreak, longestStreak, badges };
}

// Pool-wide: userIds who were top scorer (ties included) in any settled week.
// Weekly-winner is a global achievement, so it's the same on every board.
async function getWeeklyWinnerIds(): Promise<Set<string>> {
  const picks = await db.pick.findMany({
    where: { result: { in: ["WIN", "LOSS", "PUSH"] } },
    select: { userId: true, pointsAwarded: true, game: { select: { week: true } } },
  });
  const byWeek = new Map<number, Map<string, number>>();
  for (const p of picks) {
    const wk = p.game.week ?? 0;
    const users = byWeek.get(wk) ?? new Map<string, number>();
    users.set(p.userId, (users.get(p.userId) ?? 0) + p.pointsAwarded);
    byWeek.set(wk, users);
  }
  const winners = new Set<string>();
  for (const users of byWeek.values()) {
    let max = 0;
    for (const pts of users.values()) max = Math.max(max, pts);
    if (max <= 0) continue;
    for (const [uid, pts] of users) if (pts === max) winners.add(uid);
  }
  return winners;
}

// Streaks + badges for many users at once — one picks query + one weekly-winner
// query, so leaderboards don't fan out into an N+1. Missing users get zeroed stats.
export async function getStatsForUsers(
  userIds: string[],
): Promise<Map<string, UserStats>> {
  const out = new Map<string, UserStats>();
  if (userIds.length === 0) return out;

  const [picks, weeklyWinners] = await Promise.all([
    db.pick.findMany({
      where: { userId: { in: userIds }, result: { in: ["WIN", "LOSS", "PUSH"] } },
      select: { userId: true, result: true, game: { select: { week: true, league: true } } },
      orderBy: { game: { kickoff: "asc" } },
    }),
    getWeeklyWinnerIds(),
  ]);

  const byUser = new Map<string, StatPick[]>();
  for (const p of picks) {
    const arr = byUser.get(p.userId) ?? [];
    arr.push({ result: p.result, week: p.game.week, league: p.game.league });
    byUser.set(p.userId, arr);
  }

  for (const id of userIds) {
    out.set(id, computeStats(byUser.get(id) ?? [], weeklyWinners.has(id)));
  }
  return out;
}

// Streaks + badges for one user, from their settled picks.
export async function getUserStats(userId: string): Promise<UserStats> {
  const stats = await getStatsForUsers([userId]);
  return stats.get(userId)!;
}

export type WeeklyRecap = {
  week: number;
  winners: string[]; // tied winners
  winnerPoints: number;
  standings: { name: string; points: number }[];
};

// Per-week scoreboard across the pool, most recent (settled) week first.
export async function getWeeklyRecaps(): Promise<WeeklyRecap[]> {
  const picks = await db.pick.findMany({
    where: { result: { in: ["WIN", "LOSS", "PUSH"] } },
    select: { userId: true, pointsAwarded: true, game: { select: { week: true } } },
  });
  if (picks.length === 0) return [];

  const byWeek = new Map<number, Map<string, number>>();
  for (const p of picks) {
    const wk = p.game.week ?? 0;
    const users = byWeek.get(wk) ?? new Map<string, number>();
    users.set(p.userId, (users.get(p.userId) ?? 0) + p.pointsAwarded);
    byWeek.set(wk, users);
  }

  const userIds = [...new Set(picks.map((p) => p.userId))];
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, name: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.username ?? u.name ?? "Player"]));

  return [...byWeek.entries()]
    .map(([week, users]) => {
      const standings = [...users.entries()]
        .map(([uid, points]) => ({ name: nameOf.get(uid) ?? "Player", points }))
        .sort((a, b) => b.points - a.points);
      const top = standings[0]?.points ?? 0;
      const winners = standings.filter((s) => s.points === top && top > 0).map((s) => s.name);
      return { week, winners, winnerPoints: top, standings };
    })
    .sort((a, b) => b.week - a.week);
}
