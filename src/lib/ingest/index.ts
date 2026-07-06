import { fetchEspnWeek, fetchFbsTeamIds } from "./espn";
import { persistGames } from "./persist";
import {
  isAllowedCollegeGame,
  isKeptCollegeGame,
} from "@/lib/college-conferences";
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
  // For college, keep games with at least one power-conference team, as long as
  // both teams are FBS (drops FCS tune-ups, keeps power-vs-G5). If the FBS list
  // can't be fetched, fall back to the strict both-power rule.
  if (league === "CFB") {
    let fbsTeamIds: Set<string> | null = null;
    try {
      fbsTeamIds = await fetchFbsTeamIds(season);
    } catch {
      fbsTeamIds = null;
    }
    games = games.filter((g) =>
      fbsTeamIds
        ? isKeptCollegeGame(g.home, g.away, fbsTeamIds)
        : isAllowedCollegeGame(g.home.location, g.away.location),
    );
  }
  const { created, updated } = await persistGames(games);
  return { league, fetched: games.length, created, updated };
}
