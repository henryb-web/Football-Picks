// Set a team's location directly in the database.
// Usage: npx tsx scripts/set-team-location.ts "<team>" "<location>" [league]
//   <team>     display name, e.g. "Lake Travis" (exact match preferred,
//              falls back to a case-insensitive partial match)
//   <location> the new location, e.g. "Austin"
//   [league]   optional: NFL | CFB | HS6A  (defaults to HS6A)
//
// Example: npx tsx scripts/set-team-location.ts "Lake Travis" "Austin"
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type League } from "../src/generated/prisma/client";

const LEAGUES = ["NFL", "CFB", "HS6A"] as const;

async function main() {
  const team = process.argv[2];
  const location = process.argv[3];
  const league = (process.argv[4] ?? "HS6A").toUpperCase() as League;

  if (!team || !location) {
    console.error(
      'Usage: npx tsx scripts/set-team-location.ts "<team>" "<location>" [league]',
    );
    process.exit(1);
  }
  if (!LEAGUES.includes(league as (typeof LEAGUES)[number])) {
    console.error(`Invalid league "${league}". Use one of: ${LEAGUES.join(", ")}`);
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  // Exact display-name match first, then a forgiving partial match.
  let found = await db.team.findFirst({
    where: { league, displayName: team },
    select: { id: true, displayName: true, location: true },
  });
  if (!found) {
    found = await db.team.findFirst({
      where: { league, displayName: { contains: team, mode: "insensitive" } },
      select: { id: true, displayName: true, location: true },
    });
  }

  if (!found) {
    console.error(`No ${league} team matching "${team}".`);
    await db.$disconnect();
    process.exit(1);
  }

  await db.team.update({ where: { id: found.id }, data: { location } });

  console.log(
    `${found.displayName} (${league}): ${found.location ?? "—"} → ${location}`,
  );
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
