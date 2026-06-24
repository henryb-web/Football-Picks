import { fetchNflWeek } from "./espn-nfl";
import { persistGames } from "./persist";

export type SyncResult = {
  league: string;
  fetched: number;
  created: number;
  updated: number;
};

// Sync one NFL week from ESPN into the database. Shared by the admin UI action
// and the programmatic API route (so a scheduler can call it later too).
export async function syncNflWeek(
  season: number,
  week: number,
  seasonType = 2,
): Promise<SyncResult> {
  const games = await fetchNflWeek(season, week, seasonType);
  const { created, updated } = await persistGames(games);
  return { league: "NFL", fetched: games.length, created, updated };
}
