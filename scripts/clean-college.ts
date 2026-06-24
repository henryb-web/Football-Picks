// Remove college games that aren't between the allowed conferences, and flag
// any roster entries that don't match a real team (typo check).
import "dotenv/config";
import { db } from "@/lib/db";
import {
  ALLOWED_COLLEGE_SCHOOLS,
  isAllowedCollegeGame,
} from "@/lib/college-conferences";

async function main() {
  const teams = await db.team.findMany({
    where: { league: "CFB" },
    select: { location: true },
  });
  const present = new Set(teams.map((t) => (t.location ?? "").trim()));
  const missing = [...ALLOWED_COLLEGE_SCHOOLS]
    .filter((s) => !present.has(s))
    .sort();
  console.log(
    "Allowed schools not seen among ingested teams (typo, bye week, or week 0):",
  );
  console.log("  " + (missing.length ? missing.join(", ") : "(none)"));

  const games = await db.game.findMany({
    where: { league: "CFB" },
    include: {
      homeTeam: { select: { location: true } },
      awayTeam: { select: { location: true } },
    },
  });
  const toDelete = games
    .filter((g) => !isAllowedCollegeGame(g.homeTeam.location, g.awayTeam.location))
    .map((g) => g.id);

  await db.game.deleteMany({ where: { id: { in: toDelete } } });
  console.log(
    `Deleted ${toDelete.length} non-power CFB games; ${games.length - toDelete.length} remain.`,
  );

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
