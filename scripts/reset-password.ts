// Reset a user's password by email.
// Usage: npx tsx scripts/reset-password.ts <email> <newPassword>
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <newPassword>");
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const user = await db.user.update({
    where: { email },
    data: { passwordHash },
  });
  console.log(`Password reset for ${user.username ?? user.email}.`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
