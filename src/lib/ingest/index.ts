import { fetchEspnWeek } from "./espn";
import { persistGames } from "./persist";
import type { League } from "@/generated/prisma/client";

export type SyncResult = {
  league: League;
  fetched: number;
  created: number;
  updated: number;
};

// Sync one week of a league's games from ESPN into the database. Shared by the
// admin UI action and the programmatic API route (so a scheduler can call it).
export async function syncLeagueWeek(
  league: League,
  season: number,
  week: number,
  seasonType = 2,
): Promise<SyncResult> {
  const games = await fetchEspnWeek(league, season, week, seasonType);
  const { created, updated } = await persistGames(games);
  return { league, fetched: games.length, created, updated };
}
