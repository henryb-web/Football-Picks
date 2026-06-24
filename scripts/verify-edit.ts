// Dev check for editing a manual game's week (cleans up after itself).
import "dotenv/config";
import { db } from "@/lib/db";
import { createManualGame, updateGame } from "@/lib/ingest/manual";

async function main() {
  const created = await createManualGame({
    league: "HS6A",
    season: 2025,
    week: 8,
    kickoff: new Date("2025-10-24T19:30:00"),
    homeName: "Westlake",
    awayName: "Lake Travis",
  });
  console.log("created at week", created.week);

  const updated = await updateGame(created.id, {
    league: "HS6A",
    season: 2025,
    week: 9, // fix the bye-week mistake
    kickoff: new Date("2025-10-31T19:30:00"),
    homeName: "Westlake",
    awayName: "Lake Travis",
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
  });
  console.log("updated to week", updated.week, "->", updated.week === 9 ? "OK" : "FAIL");

  await db.game.delete({ where: { id: created.id } });
  console.log("cleaned up");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
