"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setBracketPick } from "@/lib/bracket/picks";

export type BracketPickActionResult = { ok: true } | { error: string };

export async function setBracketPickAction(
  bracketId: string,
  bracketGameId: string,
  seed: number,
  group: string | null,
): Promise<BracketPickActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to fill out the bracket." };

  const res = await setBracketPick(session.user.id, bracketGameId, { seed, group });
  if ("error" in res) return res;

  revalidatePath(`/brackets/${bracketId}`);
  return { ok: true };
}
