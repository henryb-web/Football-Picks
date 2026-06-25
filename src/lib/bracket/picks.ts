import { db } from "@/lib/db";
import { indexEntries, resolveSide, sameRef, type SeedRef } from "./resolve";

export type SetPickResult = { ok: true } | { error: string };

// After a pick changes, remove any of the user's later-round picks that are no
// longer valid (the team they'd advanced is no longer in that slot). Slots are
// processed in ascending order, so feeders are settled before dependents.
export async function pruneUserBracket(userId: string, bracketId: string) {
  const [games, entries] = await Promise.all([
    db.bracketGame.findMany({ where: { bracketId }, orderBy: { slot: "asc" } }),
    db.bracketEntry.findMany({ where: { bracketId } }),
  ]);
  const idx = indexEntries(entries);
  const gameIds = games.map((g) => g.id);
  const picks = await db.bracketPick.findMany({
    where: { userId, bracketGameId: { in: gameIds } },
  });

  const slotByGameId = new Map(games.map((g) => [g.id, g.slot]));
  const pickBySlot = new Map<number, SeedRef>();
  const pickIdBySlot = new Map<number, string>();
  for (const p of picks) {
    const slot = slotByGameId.get(p.bracketGameId)!;
    pickBySlot.set(slot, { seed: p.predSeed, group: p.predGroup });
    pickIdBySlot.set(slot, p.id);
  }
  const winnerOf = (slot: number) => pickBySlot.get(slot) ?? null;

  for (const g of games) {
    const pk = pickBySlot.get(g.slot);
    if (!pk) continue;
    const top = resolveSide(g.topSeed, g.topGroup, g.topFromSlot, idx, winnerOf);
    const bottom = resolveSide(g.bottomSeed, g.bottomGroup, g.bottomFromSlot, idx, winnerOf);
    if (!sameRef(pk, top) && !sameRef(pk, bottom)) {
      await db.bracketPick.delete({ where: { id: pickIdBySlot.get(g.slot)! } });
      pickBySlot.delete(g.slot);
    }
  }
}

export async function setBracketPick(
  userId: string,
  bracketGameId: string,
  ref: SeedRef,
): Promise<SetPickResult> {
  const game = await db.bracketGame.findUnique({
    where: { id: bracketGameId },
    include: { bracket: { select: { id: true, status: true } } },
  });
  if (!game) return { error: "Game not found." };
  if (game.bracket.status !== "OPEN") return { error: "This bracket is locked." };

  // Validate the chosen team is actually a participant of this slot, given the
  // user's current picks for the feeder slots.
  const [games, entries] = await Promise.all([
    db.bracketGame.findMany({
      where: { bracketId: game.bracketId },
      orderBy: { slot: "asc" },
    }),
    db.bracketEntry.findMany({ where: { bracketId: game.bracketId } }),
  ]);
  const idx = indexEntries(entries);
  const gameIds = games.map((g) => g.id);
  const picks = await db.bracketPick.findMany({
    where: { userId, bracketGameId: { in: gameIds } },
  });
  const slotByGameId = new Map(games.map((g) => [g.id, g.slot]));
  const pickBySlot = new Map<number, SeedRef>();
  for (const p of picks) {
    pickBySlot.set(slotByGameId.get(p.bracketGameId)!, {
      seed: p.predSeed,
      group: p.predGroup,
    });
  }
  const winnerOf = (slot: number) => pickBySlot.get(slot) ?? null;
  const top = resolveSide(game.topSeed, game.topGroup, game.topFromSlot, idx, winnerOf);
  const bottom = resolveSide(game.bottomSeed, game.bottomGroup, game.bottomFromSlot, idx, winnerOf);
  if (!sameRef(ref, top) && !sameRef(ref, bottom)) {
    return { error: "That team isn't in this matchup yet — pick the earlier rounds first." };
  }

  await db.bracketPick.upsert({
    where: { userId_bracketGameId: { userId, bracketGameId } },
    create: { userId, bracketGameId, predSeed: ref.seed, predGroup: ref.group },
    update: { predSeed: ref.seed, predGroup: ref.group },
  });

  await pruneUserBracket(userId, game.bracketId);
  return { ok: true };
}
