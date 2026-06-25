import { db } from "@/lib/db";
import type { SeedRef } from "./resolve";

// Later rounds are worth more: round 1 = 1pt, 2 = 2, 3 = 4, 4 = 8.
export function roundWeight(round: number): number {
  return 2 ** (round - 1);
}

// Record (or clear) the actual winner of a bracket game and (re)grade every
// pick on it. Pass null to clear the result.
export async function setBracketWinner(gameId: string, winner: SeedRef | null) {
  const game = await db.bracketGame.findUnique({ where: { id: gameId } });
  if (!game) return;

  await db.bracketGame.update({
    where: { id: gameId },
    data: { winnerSeed: winner?.seed ?? null, winnerGroup: winner?.group ?? null },
  });

  const picks = await db.bracketPick.findMany({ where: { bracketGameId: gameId } });
  const weight = roundWeight(game.round);
  for (const p of picks) {
    const correct = winner
      ? p.predSeed === winner.seed && (p.predGroup ?? null) === (winner.group ?? null)
      : null;
    const points = correct ? weight : 0;
    if (p.correct !== correct || p.points !== points) {
      await db.bracketPick.update({
        where: { id: p.id },
        data: { correct, points },
      });
    }
  }
}

export type BracketStanding = {
  userId: string;
  name: string;
  points: number;
  correct: number;
};

export async function getBracketStandings(
  bracketId: string,
): Promise<BracketStanding[]> {
  const games = await db.bracketGame.findMany({
    where: { bracketId },
    select: { id: true },
  });
  const gameIds = games.map((g) => g.id);
  if (gameIds.length === 0) return [];

  const [pointsRows, correctRows] = await Promise.all([
    db.bracketPick.groupBy({
      by: ["userId"],
      where: { bracketGameId: { in: gameIds } },
      _sum: { points: true },
    }),
    db.bracketPick.groupBy({
      by: ["userId"],
      where: { bracketGameId: { in: gameIds }, correct: true },
      _count: { _all: true },
    }),
  ]);

  const correctByUser = new Map(correctRows.map((r) => [r.userId, r._count._all]));
  const users = await db.user.findMany({
    where: { id: { in: pointsRows.map((r) => r.userId) } },
    select: { id: true, username: true, name: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.username ?? u.name ?? "Player"]));

  return pointsRows
    .map((r) => ({
      userId: r.userId,
      name: nameOf.get(r.userId) ?? "Player",
      points: r._sum.points ?? 0,
      correct: correctByUser.get(r.userId) ?? 0,
    }))
    .sort((a, b) => b.points - a.points || b.correct - a.correct);
}
