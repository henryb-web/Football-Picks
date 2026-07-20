import { db } from "@/lib/db";
import { isLocked } from "@/lib/picks";
import type { League } from "@/generated/prisma/client";

export type SurvivorActionResult = { ok: true } | { error: string };

// Short, unambiguous join code (no 0/O/1/I/L).
function generateJoinCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export async function createSurvivorPool(input: {
  ownerId: string;
  league: League;
  season: number;
  title: string;
  isPrivate: boolean;
}): Promise<{ id: string; joinCode: string } | { error: string }> {
  let joinCode = generateJoinCode();
  for (let i = 0; i < 6; i++) {
    const clash = await db.survivorPool.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode();
  }
  const pool = await db.survivorPool.create({
    data: {
      league: input.league,
      season: input.season,
      title: input.title,
      isPrivate: input.isPrivate,
      joinCode,
      ownerId: input.ownerId,
      members: { create: { userId: input.ownerId } }, // owner is auto-joined
    },
    select: { id: true, joinCode: true },
  });
  return pool;
}

export async function isPoolMember(poolId: string, userId: string): Promise<boolean> {
  const entry = await db.survivorEntry.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });
  return Boolean(entry);
}

export async function joinPool(userId: string, poolId: string): Promise<SurvivorActionResult> {
  const pool = await db.survivorPool.findUnique({ where: { id: poolId } });
  if (!pool || !pool.active) return { error: "This pool isn't active." };
  await db.survivorEntry.upsert({
    where: { poolId_userId: { poolId, userId } },
    create: { poolId, userId },
    update: {},
  });
  return { ok: true };
}

export async function joinPoolByCode(
  userId: string,
  code: string,
): Promise<{ ok: true; poolId: string } | { error: string }> {
  const pool = await db.survivorPool.findUnique({
    where: { joinCode: code.trim().toUpperCase() },
  });
  if (!pool || !pool.active) return { error: "No active pool with that code." };
  await db.survivorEntry.upsert({
    where: { poolId_userId: { poolId: pool.id, userId } },
    create: { poolId: pool.id, userId },
    update: {},
  });
  return { ok: true, poolId: pool.id };
}

// Delete a pool the caller owns. Cascades (via the schema) to every member's
// SurvivorEntry and SurvivorPick rows, so this removes the pool for everyone.
export async function deleteSurvivorPool(
  userId: string,
  poolId: string,
): Promise<SurvivorActionResult> {
  const pool = await db.survivorPool.findUnique({
    where: { id: poolId },
    select: { ownerId: true },
  });
  if (!pool) return { error: "Pool not found." };
  if (pool.ownerId !== userId) {
    return { error: "Only the pool's host can delete it." };
  }
  await db.survivorPool.delete({ where: { id: poolId } });
  return { ok: true };
}

// Earliest week that still has an open (unlocked, scheduled) game; falls back to
// the lowest week present so the page always has something to show.
export async function currentSurvivorWeek(
  league: League,
  season: number,
): Promise<number | null> {
  const games = await db.game.findMany({
    where: { league, season },
    select: { week: true, status: true, pickLockAt: true },
    orderBy: { kickoff: "asc" },
  });
  const open = games.find((g) => g.week != null && !isLocked(g));
  if (open?.week != null) return open.week;
  const weeks = games.map((g) => g.week).filter((w): w is number => w != null);
  return weeks.length ? Math.min(...weeks) : null;
}

export async function setSurvivorPick(
  userId: string,
  poolId: string,
  gameId: string,
  teamId: string,
): Promise<SurvivorActionResult> {
  const pool = await db.survivorPool.findUnique({ where: { id: poolId } });
  if (!pool || !pool.active) return { error: "This pool isn't active." };

  // Must be a member to pick. Public pools auto-join on first pick; private
  // pools require joining with the code first.
  const member = await db.survivorEntry.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });
  if (!member) {
    if (pool.isPrivate) return { error: "Join this private pool with its code first." };
    await db.survivorEntry.create({ data: { poolId, userId } });
  }

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) return { error: "Game not found." };
  if (game.league !== pool.league || game.season !== pool.season) {
    return { error: "That game isn't in this pool." };
  }
  if (game.week == null) return { error: "That game has no week." };
  if (isLocked(game)) return { error: "That game is already locked." };
  if (teamId !== game.homeTeamId && teamId !== game.awayTeamId) {
    return { error: "That team isn't in that game." };
  }

  const eliminated = await db.survivorPick.findFirst({
    where: { poolId, userId, result: "LOSS" },
  });
  if (eliminated) return { error: "You've been eliminated from this pool." };

  const reused = await db.survivorPick.findFirst({
    where: { poolId, userId, teamId, week: { not: game.week } },
  });
  if (reused) return { error: "You've already used that team in an earlier week." };

  await db.survivorPick.upsert({
    where: { poolId_userId_week: { poolId, userId, week: game.week } },
    create: { poolId, userId, week: game.week, gameId, teamId },
    update: { gameId, teamId },
  });
  return { ok: true };
}

// Grade survivor picks on a game when it finals (picked team must win outright).
export async function gradeSurvivorForGame(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
  if (!game) return;

  const picks = await db.survivorPick.findMany({ where: { gameId } });
  const final =
    game.status === "FINAL" && game.homeScore != null && game.awayScore != null;

  for (const p of picks) {
    let result: "PENDING" | "WIN" | "LOSS" = "PENDING";
    if (final) {
      const home = game.homeScore as number;
      const away = game.awayScore as number;
      const winnerTeamId =
        home > away ? game.homeTeamId : away > home ? game.awayTeamId : null;
      result = winnerTeamId && p.teamId === winnerTeamId ? "WIN" : "LOSS";
    }
    if (p.result !== result) {
      await db.survivorPick.update({ where: { id: p.id }, data: { result } });
    }
  }
}

export type SurvivorStanding = {
  userId: string;
  name: string;
  survived: number;
  alive: boolean;
  eliminatedWeek: number | null;
};

export async function getSurvivorStandings(
  poolId: string,
): Promise<SurvivorStanding[]> {
  const [entries, picks] = await Promise.all([
    db.survivorEntry.findMany({
      where: { poolId },
      include: { user: { select: { id: true, username: true, name: true } } },
    }),
    db.survivorPick.findMany({
      where: { poolId },
      include: { user: { select: { id: true, username: true, name: true } } },
    }),
  ]);

  const byUser = new Map<string, SurvivorStanding>();
  // Seed every member so those who haven't picked yet still appear.
  for (const e of entries) {
    byUser.set(e.userId, {
      userId: e.userId,
      name: e.user.username ?? e.user.name ?? "Player",
      survived: 0,
      alive: true,
      eliminatedWeek: null,
    });
  }
  for (const p of picks) {
    const e =
      byUser.get(p.userId) ??
      {
        userId: p.userId,
        name: p.user.username ?? p.user.name ?? "Player",
        survived: 0,
        alive: true,
        eliminatedWeek: null as number | null,
      };
    if (p.result === "WIN") e.survived += 1;
    if (p.result === "LOSS") {
      e.alive = false;
      e.eliminatedWeek =
        e.eliminatedWeek == null ? p.week : Math.min(e.eliminatedWeek, p.week);
    }
    byUser.set(p.userId, e);
  }

  return [...byUser.values()].sort(
    (a, b) => Number(b.alive) - Number(a.alive) || b.survived - a.survived,
  );
}

export async function getUserSurvivorView(poolId: string, userId: string) {
  const picks = await db.survivorPick.findMany({
    where: { poolId, userId },
    include: {
      team: { select: { displayName: true, logo: true, color: true } },
    },
    orderBy: { week: "asc" },
  });
  return {
    picks,
    usedTeamIds: new Set(picks.map((p) => p.teamId)),
    alive: !picks.some((p) => p.result === "LOSS"),
    eliminatedWeek: picks.find((p) => p.result === "LOSS")?.week ?? null,
  };
}
