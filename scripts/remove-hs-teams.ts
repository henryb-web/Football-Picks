// Remove games for un-tracked HS teams, but keep a game if the opponent is a
// still-tracked team (it stays as part of that team's schedule).
import "dotenv/config";
import { db } from "@/lib/db";

const REMOVE = new Set(["North Shore", "Rouse", "Duncanville", "DeSoto"]);
const KEEP_TRACKED = new Set([
  "Austin High",
  "Dripping Springs",
  "Bowie",
  "Lake Travis",
  "Anderson",
  "Regents",
  "Hyde Park",
  "North Crowley",
  "Westlake",
]);

async function main() {
  const games = await db.game.findMany({
    where: { league: "HS6A" },
    include: {
      homeTeam: { select: { displayName: true } },
      awayTeam: { select: { displayName: true } },
    },
  });

  const toDelete: string[] = [];
  const kept: string[] = [];
  for (const g of games) {
    const home = g.homeTeam.displayName;
    const away = g.awayTeam.displayName;
    if (!REMOVE.has(home) && !REMOVE.has(away)) continue; // untouched

    // The opponent that is NOT a removed team (null if both removed).
    let other: string | null = null;
    if (REMOVE.has(home) && !REMOVE.has(away)) other = away;
    else if (REMOVE.has(away) && !REMOVE.has(home)) other = home;

    if (other && KEEP_TRACKED.has(other)) {
      kept.push(`${away} @ ${home}`);
    } else {
      toDelete.push(g.id);
    }
  }

  await db.game.deleteMany({ where: { id: { in: toDelete } } });
  console.log(`Deleted ${toDelete.length} games for removed teams.`);
  console.log(`Kept (opponent still tracked): ${kept.length ? kept.join(", ") : "none"}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
