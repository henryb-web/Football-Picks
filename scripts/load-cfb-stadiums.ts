// Apply home-stadium names to CFB teams from scripts/data/cfb-stadiums.ts.
// Usage: npx tsx scripts/load-cfb-stadiums.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CFB_STADIUMS } from "./data/cfb-stadiums";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  let ok = 0;
  const misses: string[] = [];
  for (const [displayName, venue] of Object.entries(CFB_STADIUMS)) {
    const team = await db.team.findFirst({
      where: { league: "CFB", displayName },
      select: { id: true },
    });
    if (!team) {
      misses.push(displayName);
      continue;
    }
    await db.team.update({ where: { id: team.id }, data: { venue } });
    ok++;
  }
  console.log(`Set ${ok}/${Object.keys(CFB_STADIUMS).length} stadiums.`);
  if (misses.length) console.log(`Not matched: ${misses.join(", ")}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
