"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setSurvivorPick } from "@/lib/survivor";

export type SurvivorPickActionResult = { ok: true } | { error: string };

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
