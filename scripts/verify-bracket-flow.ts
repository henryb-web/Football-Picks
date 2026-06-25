// End-to-end check: seed -> generate -> user picks -> prune -> results -> score.
import "dotenv/config";
import { db } from "@/lib/db";
import { buildBracketGames } from "@/lib/bracket/build";
import { setBracketPick } from "@/lib/bracket/picks";
import { setBracketWinner, getBracketStandings } from "@/lib/bracket/scoring";

async function main() {
  const user = await db.user.findFirst({ where: { passwordHash: { not: null } } });
  if (!user) throw new Error("need a user");

  // Fresh CFP bracket
  await db.bracket.deleteMany({ where: { season: 2097 } });
  const bracket = await db.bracket.create({
    data: { league: "CFB", season: 2097, title: "Flow test" },
  });
  for (let s = 1; s <= 12; s++) {
    await db.bracketEntry.create({
      data: { bracketId: bracket.id, seed: s, group: null, displayName: `Team ${s}` },
    });
  }
  await buildBracketGames(bracket.id);
  await db.bracket.update({ where: { id: bracket.id }, data: { status: "OPEN" } });

  const games = await db.bracketGame.findMany({ where: { bracketId: bracket.id } });
  const gameBySlot = new Map(games.map((g) => [g.slot, g]));
  const pick = (slot: number, seed: number) =>
    setBracketPick(user.id, gameBySlot.get(slot)!.id, { seed, group: null });

  // Fill the bracket: advance the higher seed everywhere.
  for (const [slot, seed] of [
    [1, 8], [2, 5], [3, 6], [4, 7], // first round
    [5, 1], [6, 4], [7, 3], [8, 2], // quarterfinals
    [9, 1], [10, 2],                // semifinals
    [11, 1],                        // championship
  ] as [number, number][]) {
    const r = await pick(slot, seed);
    if ("error" in r) throw new Error(`pick slot ${slot}: ${r.error}`);
  }
  const count = await db.bracketPick.count({ where: { userId: user.id, bracketGame: { bracketId: bracket.id } } });
  console.log("picks after full fill:", count, count === 11 ? "OK" : "FAIL");

  // Validation: picking a team not in a slot should be rejected.
  const bad = await pick(11, 7); // 7 is nowhere near the final in this path
  console.log("invalid pick rejected:", "error" in bad ? "OK" : "FAIL");

  // Prune: change QF slot 5 winner from 1 to 8 (its other participant).
  // That should invalidate the semifinal (9) and championship (11) picks of 1.
  const r5 = await pick(5, 8);
  if ("error" in r5) throw new Error(r5.error);
  const slot9 = await db.bracketPick.findFirst({ where: { userId: user.id, bracketGameId: gameBySlot.get(9)!.id } });
  const slot11 = await db.bracketPick.findFirst({ where: { userId: user.id, bracketGameId: gameBySlot.get(11)!.id } });
  console.log("downstream picks pruned:", !slot9 && !slot11 ? "OK" : "FAIL");

  // Results + scoring: slot1 winner = 8 (round1, +1), slot5 winner = 8 (round2, +2).
  await setBracketWinner(gameBySlot.get(1)!.id, { seed: 8, group: null });
  await setBracketWinner(gameBySlot.get(5)!.id, { seed: 8, group: null });
  const standings = await getBracketStandings(bracket.id);
  const me = standings.find((s) => s.userId === user.id);
  console.log("scoring (expect 3 pts, 2 correct):", me?.points, me?.correct,
    me?.points === 3 && me?.correct === 2 ? "OK" : "FAIL");

  await db.bracket.delete({ where: { id: bracket.id } });
  console.log("cleaned up");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
