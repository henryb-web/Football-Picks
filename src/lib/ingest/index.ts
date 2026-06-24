import { fetchEspnWeek } from "./espn";
import { persistGames } from "./persist";
import { isAllowedCollegeGame } from "@/lib/college-conferences";
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
  let games = await fetchEspnWeek(league, season, week, seasonType);
  // For college, keep only matchups between the power conferences + Notre Dame.
  if (league === "CFB") {
    games = games.filter((g) =>
      isAllowedCollegeGame(g.home.location, g.away.location),
    );
  }
  const { created, updated } = await persistGames(games);
  return { league, fetched: games.length, created, updated };
}
