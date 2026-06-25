export type SeedRef = { seed: number; group: string | null };
export type ResolvedEntry = { seed: number; group: string | null; displayName: string };

const key = (group: string | null, seed: number) => `${group ?? ""}:${seed}`;

export function sameRef(
  a: { seed: number; group: string | null } | null | undefined,
  b: { seed: number; group: string | null } | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.seed === b.seed && (a.group ?? null) === (b.group ?? null);
}

export function indexEntries(
  entries: { seed: number; group: string | null; displayName: string }[],
): Map<string, ResolvedEntry> {
  const m = new Map<string, ResolvedEntry>();
  for (const e of entries) {
    m.set(key(e.group, e.seed), {
      seed: e.seed,
      group: e.group,
      displayName: e.displayName,
    });
  }
  return m;
}

export type SlotSides = { top: ResolvedEntry | null; bottom: ResolvedEntry | null };

type GameLike = {
  slot: number;
  topSeed: number | null;
  topGroup: string | null;
  topFromSlot: number | null;
  bottomSeed: number | null;
  bottomGroup: string | null;
  bottomFromSlot: number | null;
};

// Resolve one side: a seeded entry, or the winner of a feeder slot.
export function resolveSide(
  seed: number | null,
  group: string | null,
  fromSlot: number | null,
  idx: Map<string, ResolvedEntry>,
  winnerOf: (slot: number) => SeedRef | null,
): ResolvedEntry | null {
  if (seed != null) return idx.get(key(group, seed)) ?? null;
  if (fromSlot != null) {
    const w = winnerOf(fromSlot);
    return w ? (idx.get(key(w.group, w.seed)) ?? null) : null;
  }
  return null;
}

// Resolve both participants for every game. `winnerOf` supplies the winner of a
// feeder slot — pass actual winners for the real bracket, or a user's picks to
// render their predicted bracket.
export function resolveSides(
  games: GameLike[],
  idx: Map<string, ResolvedEntry>,
  winnerOf: (slot: number) => SeedRef | null,
): Map<number, SlotSides> {
  const out = new Map<number, SlotSides>();
  for (const g of games) {
    out.set(g.slot, {
      top: resolveSide(g.topSeed, g.topGroup, g.topFromSlot, idx, winnerOf),
      bottom: resolveSide(g.bottomSeed, g.bottomGroup, g.bottomFromSlot, idx, winnerOf),
    });
  }
  return out;
}
