"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
} from "@/lib/password-reset";
import type { FormState } from "@/lib/form-state";

async function baseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// Always reports the same success message so we never reveal which emails exist.
export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const genericOk = {
    ok: "If an account exists for that email, a reset link is on its way.",
  };
  if (!email) return { error: "Enter your email address." };

  const user = await db.user.findUnique({ where: { email } });
  // Only send to real accounts that use a password (not Google-only accounts).
  if (user?.passwordHash) {
    const token = await createPasswordResetToken(user.id);
    const url = `${await baseUrl()}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(user.email, url);
    } catch {
      return { error: "Couldn't send the email right now. Please try again." };
    }
  }

  return genericOk;
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "This reset link is invalid." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) return { error: "Passwords don't match." };

  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  redirect("/login?reset=1");
}
