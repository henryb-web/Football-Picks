"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { isLeague } from "@/lib/leagues";
import { requiredEntries, seedFieldName } from "@/lib/bracket/format";
import { buildBracketGames } from "@/lib/bracket/build";
import { setBracketWinner } from "@/lib/bracket/scoring";
import type { AdminState } from "@/lib/admin-types";
import type { BracketStatus, League } from "@/generated/prisma/client";

const STATUSES = ["SETUP", "OPEN", "LOCKED", "COMPLETE"] as const;

export async function createBracketAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const leagueRaw = String(formData.get("league") ?? "");
  if (!isLeague(leagueRaw) || leagueRaw === "HS6A") {
    return { error: "Brackets are only for NFL or College." };
  }
  const season = Number(formData.get("season"));
  if (!Number.isInteger(season)) return { error: "Enter a season year." };
  const title = String(formData.get("title") ?? "").trim() || `${leagueRaw} ${season}`;

  const existing = await db.bracket.findUnique({
    where: { league_season: { league: leagueRaw as League, season } },
  });
  if (existing) return { error: "A bracket for that league and season already exists." };

  const bracket = await db.bracket.create({
    data: { league: leagueRaw as League, season, title },
  });
  redirect(`/admin/brackets/${bracket.id}`);
}

export async function saveSeedsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const bracketId = String(formData.get("bracketId") ?? "");
  const bracket = await db.bracket.findUnique({ where: { id: bracketId } });
  if (!bracket) return { error: "Bracket not found." };

  for (const e of requiredEntries(bracket.league)) {
    const name = String(formData.get(seedFieldName(e.group, e.seed)) ?? "").trim();
    if (!name) continue;
    // The unique index includes a nullable group (null for CFP), so find-then-write
    // rather than upsert.
    const existing = await db.bracketEntry.findFirst({
      where: { bracketId, group: e.group, seed: e.seed },
    });
    if (existing) {
      await db.bracketEntry.update({
        where: { id: existing.id },
        data: { displayName: name },
      });
    } else {
      await db.bracketEntry.create({
        data: { bracketId, group: e.group, seed: e.seed, displayName: name },
      });
    }
  }
  revalidatePath(`/admin/brackets/${bracketId}`);
  return { ok: "Seeds saved." };
}

export async function generateBracketAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const bracketId = String(formData.get("bracketId") ?? "");
  try {
    const count = await buildBracketGames(bracketId);
    revalidatePath(`/admin/brackets/${bracketId}`);
    return { ok: `Generated ${count} matchups.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not generate." };
  }
}

export async function setBracketStatusAction(formData: FormData) {
  await requireAdmin();
  const bracketId = String(formData.get("bracketId") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  if (!(STATUSES as readonly string[]).includes(statusRaw)) return;
  await db.bracket.update({
    where: { id: bracketId },
    data: { status: statusRaw as BracketStatus },
  });
  revalidatePath(`/admin/brackets/${bracketId}`);
  revalidatePath(`/brackets/${bracketId}`);
  revalidatePath("/brackets");
}

export async function setWinnerAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  const seed = Number(formData.get("seed"));
  const groupRaw = String(formData.get("group") ?? "");
  const group = groupRaw === "" ? null : groupRaw;
  const game = await db.bracketGame.findUnique({ where: { id: gameId } });
  if (!game) return;
  await setBracketWinner(gameId, Number.isInteger(seed) ? { seed, group } : null);
  revalidatePath(`/admin/brackets/${game.bracketId}`);
  revalidatePath(`/brackets/${game.bracketId}`);
}

export async function deleteBracketAction(formData: FormData) {
  await requireAdmin();
  const bracketId = String(formData.get("bracketId") ?? "");
  if (bracketId) await db.bracket.delete({ where: { id: bracketId } });
  revalidatePath("/admin/brackets");
  redirect("/admin/brackets");
}

export async function renameBracketAction(formData: FormData) {
  await requireAdmin();
  const bracketId = String(formData.get("bracketId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!bracketId || !title) return;
  await db.bracket.update({ where: { id: bracketId }, data: { title } });
  revalidatePath(`/admin/brackets/${bracketId}`);
  revalidatePath(`/brackets/${bracketId}`);
  revalidatePath("/brackets");
}
