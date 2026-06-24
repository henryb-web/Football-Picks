// Dev helper: create/refresh a test account for verifying auth locally.
// Run with: npx tsx scripts/create-test-user.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const email = "tester@example.com";
  const username = "tester";
  const password = "password123";

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, username },
    create: { email, username, passwordHash, name: username },
  });

  console.log("user ready:", {
    id: user.id,
    email: user.email,
    username: user.username,
  });
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
