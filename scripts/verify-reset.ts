// Dev check for the password-reset token lifecycle (does not change any password).
import "dotenv/config";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { db } from "@/lib/db";

async function main() {
  const user = await db.user.findFirst({ where: { passwordHash: { not: null } } });
  if (!user) throw new Error("no password user found");

  const token = await createPasswordResetToken(user.id);
  await sendPasswordResetEmail(
    user.email,
    `http://localhost:3000/reset-password?token=${token}`,
  );

  const first = await consumePasswordResetToken(token);
  console.log("consume valid token ->", first === user.id ? "OK" : "FAIL");

  const second = await consumePasswordResetToken(token);
  console.log("reuse same token ->", second === null ? "OK (rejected)" : "FAIL");

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
