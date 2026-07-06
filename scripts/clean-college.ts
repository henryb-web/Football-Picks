// Remove college games that aren't between the allowed conferences, and flag
// any roster entries that don't match a real team (typo check).
import "dotenv/config";
import { db } from "@/lib/db";
import {
  ALLOWED_COLLEGE_SCHOOLS,
  isAllowedCollegeGame,
  isKeptCollegeGame,
} from "@/lib/college-conferences";
import { fetchFbsTeamIds } from "@/lib/ingest/espn";

const SEASON = 2026;

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
      homeTeam: { select: { location: true, externalId: true } },
      awayTeam: { select: { location: true, externalId: true } },
    },
  });
  // Match the ingest policy: keep power-vs-FBS games, drop FCS. Fall back to the
  // strict both-power rule if the FBS list can't be fetched.
  let fbsTeamIds: Set<string> | null = null;
  try {
    fbsTeamIds = await fetchFbsTeamIds(SEASON);
  } catch {
    fbsTeamIds = null;
  }
  const toDelete = games
    .filter((g) =>
      !(fbsTeamIds
        ? isKeptCollegeGame(g.homeTeam, g.awayTeam, fbsTeamIds)
        : isAllowedCollegeGame(g.homeTeam.location, g.awayTeam.location)),
    )
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
