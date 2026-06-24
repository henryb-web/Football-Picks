"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { syncLeagueWeek } from "@/lib/ingest";
import { createManualGame, updateGame } from "@/lib/ingest/manual";
import { settleGame } from "@/lib/scoring";
import { db } from "@/lib/db";
import { isLeague } from "@/lib/leagues";
import type { AdminState } from "@/lib/admin-types";
import type { GameStatus } from "@/generated/prisma/client";

const GAME_STATUSES = ["SCHEDULED", "IN_PROGRESS", "FINAL", "CANCELED"] as const;

function parseScore(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

function revalidate() {
  revalidatePath("/admin");
  revalidatePath("/games");
  revalidatePath("/leaderboard");
  revalidatePath("/my-picks");
}

export async function syncGamesAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const leagueRaw = String(formData.get("league") ?? "");
  if (!isLeague(leagueRaw) || leagueRaw === "HS6A") {
    return { error: "Pick NFL or College (high school has no feed)." };
  }
  const season = Number(formData.get("season"));
  const week = Number(formData.get("week"));
  const seasonType = Number(formData.get("seasonType")) || 2;
  if (!Number.isInteger(season) || !Number.isInteger(week)) {
    return { error: "Season and week must be whole numbers." };
  }

  try {
    const result = await syncLeagueWeek(leagueRaw, season, week, seasonType);
    revalidate();
    return {
      ok: `Synced ${leagueRaw} ${season} week ${week}: ${result.fetched} games (${result.created} new, ${result.updated} updated).`,
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
  await settleGame(gameId);
  revalidate();
  return { ok: "Final score saved." };
}

export async function updateGameAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) return { error: "Missing game." };

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

  const statusRaw = String(formData.get("status") ?? "SCHEDULED");
  if (!(GAME_STATUSES as readonly string[]).includes(statusRaw)) {
    return { error: "Invalid status." };
  }

  await updateGame(gameId, {
    league: leagueRaw,
    season,
    week,
    kickoff,
    homeName,
    awayName,
    status: statusRaw as GameStatus,
    homeScore: parseScore(formData.get("homeScore")),
    awayScore: parseScore(formData.get("awayScore")),
  });
  await settleGame(gameId);
  revalidate();
  return { ok: "Game updated." };
}

export async function deleteGameAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  if (gameId) {
    await db.game.delete({ where: { id: gameId } });
  }
  revalidate();
  redirect("/admin");
}
