"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { syncNflWeek } from "@/lib/ingest";
import { createManualGame } from "@/lib/ingest/manual";
import { db } from "@/lib/db";
import { isLeague } from "@/lib/leagues";
import type { AdminState } from "@/lib/admin-types";

function revalidate() {
  revalidatePath("/admin");
  revalidatePath("/games");
}

export async function syncNflAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const season = Number(formData.get("season"));
  const week = Number(formData.get("week"));
  const seasonType = Number(formData.get("seasonType")) || 2;
  if (!Number.isInteger(season) || !Number.isInteger(week)) {
    return { error: "Season and week must be whole numbers." };
  }

  try {
    const result = await syncNflWeek(season, week, seasonType);
    revalidate();
    return {
      ok: `Synced NFL ${season} week ${week}: ${result.fetched} games (${result.created} new, ${result.updated} updated).`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sync failed." };
  }
}

export async function createGameAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const leagueRaw = String(formData.get("league") ?? "");
  if (!isLeague(leagueRaw)) return { error: "Pick a valid league." };

  const homeName = String(formData.get("homeName") ?? "").trim();
  const awayName = String(formData.get("awayName") ?? "").trim();
  if (!homeName || !awayName) return { error: "Enter both team names." };

  const kickoff = new Date(String(formData.get("kickoff") ?? ""));
  if (Number.isNaN(kickoff.getTime())) {
    return { error: "Enter a valid kickoff date and time." };
  }

  const season = Number(formData.get("season"));
  if (!Number.isInteger(season)) return { error: "Enter a season year." };

  const weekRaw = String(formData.get("week") ?? "").trim();
  const week = weekRaw === "" ? null : Number(weekRaw);
  if (week !== null && !Number.isInteger(week)) {
    return { error: "Week must be a whole number (or left blank)." };
  }

  await createManualGame({
    league: leagueRaw,
    season,
    week,
    kickoff,
    homeName,
    awayName,
  });
  revalidate();
  return { ok: `Added ${awayName} @ ${homeName}.` };
}

export async function setScoreAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) return { error: "Missing game." };

  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return { error: "Scores must be whole numbers." };
  }

  await db.game.update({
    where: { id: gameId },
    data: { homeScore, awayScore, status: "FINAL" },
  });
  revalidate();
  return { ok: "Final score saved." };
}
