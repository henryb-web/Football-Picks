// Set a single game's venue (overrides the home team's stadium — for
// neutral-site / relocated games).
// Usage: npx tsx scripts/set-game-venue.ts "<team>" "<opponent>" "<venue>" [league] [week]
//   <team>, <opponent>  either order; matched by partial, case-insensitive name
//   <venue>             the stadium to show for this game
//   [league]            optional: NFL | CFB | HS6A (narrows the team match)
//   [week]              optional: week number, to disambiguate a repeat matchup
//
// Example:
//   npx tsx scripts/set-game-venue.ts "Jaguars" "Patriots" "Wembley Stadium" NFL
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type League } from "../src/generated/prisma/client";

const LEAGUES = ["NFL", "CFB", "HS6A"] as const;

async function main() {
  const teamA = process.argv[2];
  const teamB = process.argv[3];
  const venue = process.argv[4];
  const leagueArg = process.argv[5]?.toUpperCase();
  const weekArg = process.argv[6];

  if (!teamA || !teamB || !venue) {
    console.error(
      'Usage: npx tsx scripts/set-game-venue.ts "<team>" "<opponent>" "<venue>" [league] [week]',
    );
    process.exit(1);
  }
  const league =
    leagueArg && LEAGUES.includes(leagueArg as (typeof LEAGUES)[number])
      ? (leagueArg as League)
      : undefined;
  if (leagueArg && !league) {
    console.error(`Invalid league "${leagueArg}". Use one of: ${LEAGUES.join(", ")}`);
    process.exit(1);
  }
  const week = weekArg != null ? Number(weekArg) : undefined;
  if (weekArg != null && Number.isNaN(week)) {
    console.error(`Invalid week "${weekArg}".`);
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const findTeams = (name: string) =>
    db.team.findMany({
      where: { displayName: { contains: name, mode: "insensitive" }, ...(league ? { league } : {}) },
      select: { id: true, displayName: true },
    });
  const [as, bs] = await Promise.all([findTeams(teamA), findTeams(teamB)]);
  if (!as.length) { console.error(`No team matching "${teamA}".`); await db.$disconnect(); process.exit(1); }
  if (!bs.length) { console.error(`No team matching "${teamB}".`); await db.$disconnect(); process.exit(1); }

  const aIds = as.map((t) => t.id);
  const bIds = bs.map((t) => t.id);
  const games = await db.game.findMany({
    where: {
      ...(week != null ? { week } : {}),
      OR: [
        { homeTeamId: { in: aIds }, awayTeamId: { in: bIds } },
        { homeTeamId: { in: bIds }, awayTeamId: { in: aIds } },
      ],
    },
    select: {
      id: true, week: true, kickoff: true, venue: true,
      homeTeam: { select: { displayName: true } },
      awayTeam: { select: { displayName: true } },
    },
    orderBy: { kickoff: "asc" },
  });

  if (!games.length) {
    console.error(`No game found between "${teamA}" and "${teamB}"${week != null ? ` in week ${week}` : ""}.`);
    await db.$disconnect();
    process.exit(1);
  }
  if (games.length > 1) {
    console.error(`Multiple games match — re-run with a week number to disambiguate:`);
    for (const g of games) {
      console.error(`  wk${g.week ?? "?"} ${g.kickoff.toISOString().slice(0, 10)}  ${g.awayTeam.displayName} @ ${g.homeTeam.displayName}`);
    }
    await db.$disconnect();
    process.exit(1);
  }

  const g = games[0];
  await db.game.update({ where: { id: g.id }, data: { venue } });
  console.log(
    `wk${g.week ?? "?"}  ${g.awayTeam.displayName} @ ${g.homeTeam.displayName}: ${g.venue ?? "—"} → ${venue}`,
  );
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
