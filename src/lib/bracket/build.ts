import { db } from "@/lib/db";
import { bracketTemplate, type BracketSide } from "./format";

function sideColumns(side: BracketSide) {
  if (side.kind === "seed") {
    return { seed: side.seed, group: side.group, fromSlot: null };
  }
  return { seed: null, group: null, fromSlot: side.fromSlot };
}

// (Re)generate the matchup tree for a bracket from its seeded entries.
// Idempotent: wipes and rebuilds the games. Throws if any required seed is
// missing from the field.
export async function buildBracketGames(bracketId: string): Promise<number> {
  const bracket = await db.bracket.findUnique({
    where: { id: bracketId },
    include: { entries: true },
  });
  if (!bracket) throw new Error("Bracket not found.");

  const template = bracketTemplate(bracket.league);
  const have = new Set(
    bracket.entries.map((e) => `${e.group ?? ""}:${e.seed}`),
  );

  const missing = new Set<string>();
  for (const g of template) {
    for (const side of [g.top, g.bottom]) {
      if (side.kind === "seed") {
        const key = `${side.group ?? ""}:${side.seed}`;
        if (!have.has(key)) {
          missing.add(`${side.group ? `${side.group} ` : ""}#${side.seed}`);
        }
      }
    }
  }
  if (missing.size > 0) {
    throw new Error(`Field is incomplete — missing: ${[...missing].join(", ")}.`);
  }

  await db.bracketGame.deleteMany({ where: { bracketId } });
  for (const g of template) {
    const top = sideColumns(g.top);
    const bottom = sideColumns(g.bottom);
    await db.bracketGame.create({
      data: {
        bracketId,
        round: g.round,
        slot: g.slot,
        group: g.group,
        label: g.label,
        topSeed: top.seed,
        topGroup: top.group,
        topFromSlot: top.fromSlot,
        bottomSeed: bottom.seed,
        bottomGroup: bottom.group,
        bottomFromSlot: bottom.fromSlot,
      },
    });
  }
  return template.length;
}
