import type { League } from "@/generated/prisma/client";

// A side of a matchup is either a seeded entry, or the winner of an earlier slot.
export type BracketSide =
  | { kind: "seed"; seed: number; group: string | null }
  | { kind: "from"; fromSlot: number };

export type BracketGameSpec = {
  round: number;
  slot: number;
  group: string | null;
  label: string;
  top: BracketSide;
  bottom: BracketSide;
};

const seed = (n: number, group: string | null = null): BracketSide => ({
  kind: "seed",
  seed: n,
  group,
});
const from = (slot: number): BracketSide => ({ kind: "from", fromSlot: slot });

// 12-team College Football Playoff: seeds 1-4 bye to the quarterfinals.
// Fixed bracket (no reseeding).
function cfpTemplate(): BracketGameSpec[] {
  return [
    { round: 1, slot: 1, group: null, label: "First Round", top: seed(8), bottom: seed(9) },
    { round: 1, slot: 2, group: null, label: "First Round", top: seed(5), bottom: seed(12) },
    { round: 1, slot: 3, group: null, label: "First Round", top: seed(6), bottom: seed(11) },
    { round: 1, slot: 4, group: null, label: "First Round", top: seed(7), bottom: seed(10) },
    { round: 2, slot: 5, group: null, label: "Quarterfinal", top: seed(1), bottom: from(1) },
    { round: 2, slot: 6, group: null, label: "Quarterfinal", top: seed(4), bottom: from(2) },
    { round: 2, slot: 7, group: null, label: "Quarterfinal", top: seed(3), bottom: from(3) },
    { round: 2, slot: 8, group: null, label: "Quarterfinal", top: seed(2), bottom: from(4) },
    { round: 3, slot: 9, group: null, label: "Semifinal", top: from(5), bottom: from(6) },
    { round: 3, slot: 10, group: null, label: "Semifinal", top: from(7), bottom: from(8) },
    { round: 4, slot: 11, group: null, label: "National Championship", top: from(9), bottom: from(10) },
  ];
}

// One NFL conference (7 seeds): #1 byes to the divisional round. Fixed slots
// (no reseeding): #1 plays the 4/5 winner; the 2/7 winner plays the 3/6 winner.
function nflConference(group: string, base: number): BracketGameSpec[] {
  const s = (n: number) => base + n;
  return [
    { round: 1, slot: s(1), group, label: "Wild Card", top: seed(4, group), bottom: seed(5, group) },
    { round: 1, slot: s(2), group, label: "Wild Card", top: seed(3, group), bottom: seed(6, group) },
    { round: 1, slot: s(3), group, label: "Wild Card", top: seed(2, group), bottom: seed(7, group) },
    { round: 2, slot: s(4), group, label: "Divisional", top: seed(1, group), bottom: from(s(1)) },
    { round: 2, slot: s(5), group, label: "Divisional", top: from(s(3)), bottom: from(s(2)) },
    { round: 3, slot: s(6), group, label: "Conference Championship", top: from(s(4)), bottom: from(s(5)) },
  ];
}

// 14-team NFL playoffs: two conference sub-brackets feeding the Super Bowl.
function nflTemplate(): BracketGameSpec[] {
  return [
    ...nflConference("AFC", 0), // slots 1-6
    ...nflConference("NFC", 6), // slots 7-12
    { round: 4, slot: 13, group: null, label: "Super Bowl", top: from(6), bottom: from(12) },
  ];
}

// Form field name for a seed's team-name input in the admin seed editor.
export function seedFieldName(group: string | null, seed: number) {
  return `seed__${group ?? "-"}__${seed}`;
}

export function bracketTemplate(league: League): BracketGameSpec[] {
  if (league === "NFL") return nflTemplate();
  if (league === "CFB") return cfpTemplate();
  throw new Error(`Brackets aren't supported for ${league}.`);
}

// The seeds an admin must fill to complete the field.
export function requiredEntries(
  league: League,
): { seed: number; group: string | null }[] {
  if (league === "NFL") {
    return ["AFC", "NFC"].flatMap((g) =>
      [1, 2, 3, 4, 5, 6, 7].map((s) => ({ seed: s, group: g })),
    );
  }
  if (league === "CFB") {
    return Array.from({ length: 12 }, (_, i) => ({ seed: i + 1, group: null }));
  }
  throw new Error(`Brackets aren't supported for ${league}.`);
}
