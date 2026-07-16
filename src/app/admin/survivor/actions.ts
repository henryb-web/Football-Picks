"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { isLeague } from "@/lib/leagues";
import { createSurvivorPool } from "@/lib/survivor";
import type { AdminState } from "@/lib/admin-types";
import type { League } from "@/generated/prisma/client";

export async function createSurvivorPoolAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return { error: "Not signed in." };
  const leagueRaw = String(formData.get("league") ?? "");
  if (!isLeague(leagueRaw)) return { error: "Pick a league." };
  const season = Number(formData.get("season"));
  if (!Number.isInteger(season)) return { error: "Enter a season year." };
  const title =
    String(formData.get("title") ?? "").trim() || `${leagueRaw} ${season} Survivor`;

  const res = await createSurvivorPool({
    ownerId,
    league: leagueRaw as League,
    season,
    title,
    isPrivate: false,
  });
  if ("error" in res) return { error: res.error };

  revalidatePath("/admin/survivor");
  revalidatePath("/survivor");
  return { ok: "Survivor pool created." };
}

export async function toggleSurvivorPoolAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("poolId") ?? "");
  const pool = await db.survivorPool.findUnique({ where: { id } });
  if (pool) {
    await db.survivorPool.update({ where: { id }, data: { active: !pool.active } });
  }
  revalidatePath("/admin/survivor");
  revalidatePath("/survivor");
}
