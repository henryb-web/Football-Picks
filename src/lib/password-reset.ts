import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Create a single-use reset token for a user. Returns the raw token (which only
// ever appears in the emailed link); only its hash is persisted.
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

// Validate a raw token; returns the userId if valid (unexpired), else null.
export async function consumePasswordResetToken(
  token: string,
): Promise<string | null> {
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record) return null;

  // Single-use: remove it regardless of outcome.
  await db.passwordResetToken.delete({ where: { id: record.id } });

  if (record.expires.getTime() < Date.now()) return null;
  return record.userId;
}
