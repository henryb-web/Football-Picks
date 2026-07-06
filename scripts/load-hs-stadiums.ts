// Apply home-stadium names to HS6A teams from scripts/data/hs-stadiums.ts.
// Usage: npx tsx scripts/load-hs-stadiums.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { HS_STADIUMS } from "./data/hs-stadiums";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  let ok = 0;
  for (const [displayName, venue] of Object.entries(HS_STADIUMS)) {
    const team = await db.team.findFirst({
      where: { league: "HS6A", displayName },
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
  console.log(`\nSet ${ok}/${Object.keys(HS_STADIUMS).length} stadiums.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
