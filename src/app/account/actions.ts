"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import type { League } from "@/generated/prisma/client";

async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  return user;
}

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username must be 20 characters or fewer.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores.");

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  const name = String(formData.get("name") ?? "").trim();
  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username." };
  }
  const username = parsed.data;

  const taken = await db.user.findFirst({
    where: { username, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken) return { error: "That username is taken." };

  await db.user.update({
    where: { id: user.id },
    data: { username, name: name || username },
  });
  revalidatePath("/account");
  return { ok: "Profile saved." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "Passwords don't match." };

  // Accounts with an existing password must confirm the current one.
  if (user.passwordHash) {
    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: user.passwordHash ? "Password changed." : "Password set." };
}

export async function updateAvatarAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  const color = String(formData.get("color") ?? "").replace(/^#/, "") || null;
  const emojiRaw = String(formData.get("emoji") ?? "").trim();
  const emoji = emojiRaw || null;
  const removePhoto = formData.get("removePhoto") === "1";

  await db.user.update({
    where: { id: user.id },
    data: {
      avatarColor: color,
      avatarEmoji: emoji,
      ...(removePhoto ? { image: null } : {}),
    },
  });
  revalidatePath("/account");
  revalidatePath("/leaderboard");
  return { ok: "Avatar updated." };
}

export async function uploadAvatarPhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (file.size > 5 * 1024 * 1024) return { error: "Photo must be under 5 MB." };
  if (!file.type.startsWith("image/")) return { error: "That file isn't an image." };

  try {
    const blob = await put(`avatars/${user.id}-${Date.now()}`, file, {
      access: "public",
      contentType: file.type,
    });
    await db.user.update({ where: { id: user.id }, data: { image: blob.url } });
  } catch (e) {
    console.error("avatar upload failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (/token|BLOB_READ_WRITE_TOKEN|store/i.test(msg)) {
      return {
        error:
          "Photo upload isn't configured (Vercel Blob token missing) — connect a Blob store to the project and redeploy.",
      };
    }
    return { error: `Upload failed: ${msg}` };
  }
  revalidatePath("/account");
  revalidatePath("/leaderboard");
  return { ok: "Photo uploaded." };
}

export async function updatePreferencesAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  const themeRaw = String(formData.get("theme") ?? "");
  const themePref = themeRaw === "light" || themeRaw === "dark" ? themeRaw : null;
  const timezone = String(formData.get("timezone") ?? "").trim() || null;

  await db.user.update({
    where: { id: user.id },
    data: { themePref, timezone },
  });
  revalidatePath("/account");
  return { ok: "Preferences saved." };
}

// Set/clear the favorite team for a specific league (dashboard pickers). Only
// touches that league's favorite, leaving theme/timezone/other favorites alone.
export async function setFavoriteTeamAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await currentUser();
  const league = String(formData.get("league") ?? "");
  if (league !== "NFL" && league !== "CFB" && league !== "HS6A") {
    return { error: "Invalid league." };
  }
  const favName = String(formData.get("favoriteTeam") ?? "").trim();
  let favoriteId: string | null = null;
  if (favName) {
    const team = await db.team.findFirst({
      where: { league: league as League, displayName: favName },
      select: { id: true },
    });
    if (!team) return { error: `No ${league} team named "${favName}".` };
    favoriteId = team.id;
  }
  const data =
    league === "NFL"
      ? { favoriteNflId: favoriteId }
      : league === "CFB"
        ? { favoriteCfbId: favoriteId }
        : { favoriteHs6aId: favoriteId };
  await db.user.update({ where: { id: user.id }, data });
  revalidatePath("/dashboard");
  return { ok: favoriteId ? "Favorite saved." : "Favorite cleared." };
}

// Persist the chosen visual skin to the account so it follows the user across
// devices. The SkinToggle also flips the class + cookie client-side for an
// instant, logged-out-friendly preview; this is the durable store.
export async function setSkinAction(skin: string): Promise<void> {
  const user = await currentUser();
  const value = ["booth", "rip", "post"].includes(skin) ? skin : "booth";
  await db.user.update({
    where: { id: user.id },
    data: { skin: value },
  });
  revalidatePath("/", "layout");
}

export async function deleteAccountAction(): Promise<void> {
  const user = await currentUser();
  await db.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
}
