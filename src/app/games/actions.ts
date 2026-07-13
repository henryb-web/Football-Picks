"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isLocked } from "@/lib/picks";
import type { PickSide } from "@/generated/prisma/client";

export type PickActionResult = { ok: true } | { error: string };

export async function setPickAction(
  gameId: string,
  side: PickSide,
): Promise<PickActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to make picks." };

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { id: true, status: true, pickLockAt: true },
  });
  if (!game) return { error: "Game not found." };
  if (isLocked(game)) return { error: "Picks are locked for this game." };

  await db.pick.upsert({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    create: { userId: session.user.id, gameId, side },
    update: { side },
  });

  revalidatePath("/games");
  revalidatePath("/my-picks");
  return { ok: true };
}

// Remove a pick (clicking your already-picked team toggles it off).
export async function clearPickAction(gameId: string): Promise<PickActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to make picks." };

  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { status: true, pickLockAt: true },
  });
  if (!game) return { error: "Game not found." };
  if (isLocked(game)) return { error: "Picks are locked for this game." };

  await db.pick.deleteMany({ where: { userId: session.user.id, gameId } });
  revalidatePath("/games");
  revalidatePath("/my-picks");
  return { ok: true };
}
