// Dev check for bracket generation (cleans up after itself).
import "dotenv/config";
import { db } from "@/lib/db";
import { buildBracketGames } from "@/lib/bracket/build";
import { requiredEntries } from "@/lib/bracket/format";
import type { League } from "@/generated/prisma/client";

async function setup(league: League, season: number) {
  const bracket = await db.bracket.create({
    data: { league, season, title: `${league} test` },
  });
  for (const e of requiredEntries(league)) {
    await db.bracketEntry.create({
      data: {
        bracketId: bracket.id,
        seed: e.seed,
        group: e.group,
        displayName: `${e.group ?? ""}#${e.seed}`,
      },
    });
  }
  return bracket.id;
}

async function gamesFor(bracketId: string) {
  return db.bracketGame.findMany({ where: { bracketId }, orderBy: { slot: "asc" } });
}

async function main() {
  // CFP
  const cfp = await setup("CFB", 2099);
  const cfpCount = await buildBracketGames(cfp);
  const cfpGames = await gamesFor(cfp);
  const champ = cfpGames.find((g) => g.slot === 11)!;
  console.log("CFP games:", cfpCount, cfpCount === 11 ? "OK" : "FAIL");
  console.log(
    "CFP final feeders (9,10):",
    champ.topFromSlot === 9 && champ.bottomFromSlot === 10 ? "OK" : "FAIL",
  );
  console.log(
    "CFP QF slot5 top is seed 1:",
    cfpGames.find((g) => g.slot === 5)!.topSeed === 1 ? "OK" : "FAIL",
  );

  // NFL
  const nfl = await setup("NFL", 2099);
  const nflCount = await buildBracketGames(nfl);
  const nflGames = await gamesFor(nfl);
  const sb = nflGames.find((g) => g.slot === 13)!;
  console.log("NFL games:", nflCount, nflCount === 13 ? "OK" : "FAIL");
  console.log(
    "Super Bowl feeders (6,12):",
    sb.topFromSlot === 6 && sb.bottomFromSlot === 12 ? "OK" : "FAIL",
  );
  console.log(
    "AFC divisional slot4 top is AFC #1:",
    (() => {
      const g = nflGames.find((x) => x.slot === 4)!;
      return g.topSeed === 1 && g.topGroup === "AFC" ? "OK" : "FAIL";
    })(),
  );

  // Incomplete-field guard
  const partial = await db.bracket.create({
    data: { league: "CFB", season: 2098, title: "partial" },
  });
  await db.bracketEntry.create({
    data: { bracketId: partial.id, seed: 1, group: null, displayName: "#1" },
  });
  let threw = false;
  try {
    await buildBracketGames(partial.id);
  } catch {
    threw = true;
  }
  console.log("Incomplete field rejected:", threw ? "OK" : "FAIL");

  // cleanup
  await db.bracket.deleteMany({ where: { season: { in: [2098, 2099] } } });
  console.log("cleaned up");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
