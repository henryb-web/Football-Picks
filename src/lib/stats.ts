import { db } from "@/lib/db";

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

// Streaks + badges for one user, from their settled picks.
export async function getUserStats(userId: string): Promise<UserStats> {
  const picks = await db.pick.findMany({
    where: { userId, result: { in: ["WIN", "LOSS", "PUSH"] } },
    select: { result: true, game: { select: { week: true } } },
    orderBy: { game: { kickoff: "asc" } },
  });

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

  // Perfect week: a week with >= 3 picks, all wins.
  const byWeek = new Map<number, { w: number; total: number }>();
  for (const p of picks) {
    const wk = p.game.week ?? 0;
    const e = byWeek.get(wk) ?? { w: 0, total: 0 };
    e.total += 1;
    if (p.result === "WIN") e.w += 1;
    byWeek.set(wk, e);
  }
  const perfectWeek = [...byWeek.values()].some((e) => e.total >= 3 && e.w === e.total);

  const badges: Badge[] = [];
  if (currentStreak >= 3) badges.push({ emoji: "🔥", label: `${currentStreak}-pick win streak` });
  if (decided >= 10 && accuracy >= 0.65)
    badges.push({ emoji: "🎯", label: `${Math.round(accuracy * 100)}% accuracy` });
  if (perfectWeek) badges.push({ emoji: "💯", label: "Perfect week" });
  if (wins >= 25) badges.push({ emoji: "🏈", label: `${wins} correct picks` });

  return { wins, losses, pushes, accuracy, currentStreak, longestStreak, badges };
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
