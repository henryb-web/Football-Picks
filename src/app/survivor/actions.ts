"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isLeague } from "@/lib/leagues";
import {
  setSurvivorPick,
  createSurvivorPool,
  joinPool,
  joinPoolByCode,
} from "@/lib/survivor";
import type { FormState } from "@/lib/form-state";
import type { League } from "@/generated/prisma/client";

export type SurvivorPickActionResult = { ok: true } | { error: string };

// Football season year new pools default to.
const CURRENT_SEASON = new Date().getFullYear();

export async function setSurvivorPickAction(
  poolId: string,
  gameId: string,
  teamId: string,
): Promise<SurvivorPickActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to play survivor." };

  const res = await setSurvivorPick(session.user.id, poolId, gameId, teamId);
  if ("error" in res) return res;

  revalidatePath(`/survivor/${poolId}`);
  return { ok: true };
}

// Any signed-in user can create a pool and choose public/private.
export async function createPoolAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to create a pool." };

  const leagueRaw = String(formData.get("league") ?? "");
  if (!isLeague(leagueRaw)) return { error: "Pick a league." };
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) return { error: "Give your pool a name (3+ characters)." };
  const isPrivate = String(formData.get("visibility") ?? "public") === "private";

  const res = await createSurvivorPool({
    ownerId: session.user.id,
    league: leagueRaw as League,
    season: CURRENT_SEASON,
    title,
    isPrivate,
  });
  if ("error" in res) return { error: res.error };

  revalidatePath("/survivor");
  redirect(`/survivor/${res.id}`);
}

export async function joinByCodeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to join a pool." };
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter a join code." };

  const res = await joinPoolByCode(session.user.id, code);
  if ("error" in res) return { error: res.error };

  revalidatePath("/survivor");
  redirect(`/survivor/${res.poolId}`);
}

// Join a public pool (form on the pool page).
export async function joinPoolAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const poolId = String(formData.get("poolId") ?? "");
  if (!poolId) return;
  await joinPool(session.user.id, poolId);
  revalidatePath(`/survivor/${poolId}`);
}
