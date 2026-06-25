// Create a temporary OPEN CFP bracket for verifying the UI; prints its id.
import "dotenv/config";
import { db } from "@/lib/db";
import { buildBracketGames } from "@/lib/bracket/build";

async function main() {
  await db.bracket.deleteMany({ where: { season: 2096 } });
  const b = await db.bracket.create({
    data: { league: "CFB", season: 2096, title: "UI test bracket" },
  });
  for (let s = 1; s <= 12; s++) {
    await db.bracketEntry.create({
      data: { bracketId: b.id, seed: s, group: null, displayName: `Team ${s}` },
    });
  }
  await buildBracketGames(b.id);
  await db.bracket.update({ where: { id: b.id }, data: { status: "OPEN" } });
  console.log(b.id);
  await db.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
