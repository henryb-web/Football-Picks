// Apply home-stadium names to NFL teams from scripts/data/nfl-stadiums.ts.
// Usage: npx tsx scripts/load-nfl-stadiums.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { NFL_STADIUMS } from "./data/nfl-stadiums";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  let ok = 0;
  for (const [displayName, venue] of Object.entries(NFL_STADIUMS)) {
    const team = await db.team.findFirst({
      where: { league: "NFL", displayName },
      select: { id: true },
    });
    if (!team) {
      console.log(`SKIP  "${displayName}" -> not found`);
      continue;
    }
    await db.team.update({ where: { id: team.id }, data: { venue } });
    ok++;
    console.log(`OK    ${displayName} -> ${venue}`);
  }
  console.log(`\nSet ${ok}/${Object.keys(NFL_STADIUMS).length} stadiums.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
