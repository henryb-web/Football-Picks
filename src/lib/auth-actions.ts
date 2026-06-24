"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { signupSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-types";

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) {
    return { error: "Enter your email/username and password." };
  }

  try {
    await signIn("credentials", { identifier, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email/username or password." };
    }
    throw error;
  }

  redirect("/");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const email = parsed.data.email.toLowerCase();
  const { username, password } = parsed.data;

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return {
      error:
        existing.email === email
          ? "An account with that email already exists."
          : "That username is taken.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { email, username, passwordHash, name: username },
  });

  try {
    await signIn("credentials", { identifier: email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created but auto-login failed; let them log in manually.
      redirect("/login");
    }
    throw error;
  }

  redirect("/");
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
