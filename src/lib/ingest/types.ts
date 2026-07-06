import type { GameStatus, League } from "@/generated/prisma/client";

// Source-agnostic shapes that every game provider (ESPN, CFBD, manual) maps into,
// so the persistence layer never depends on a specific feed.

export type NormalizedTeam = {
  externalId: string;
  name: string;
  displayName: string;
  abbreviation?: string | null;
  location?: string | null;
  color?: string | null;
  altColor?: string | null;
  logo?: string | null;
  record?: string | null; // overall W-L summary, e.g. "7-2"
};

export type NormalizedGame = {
  source: string; // e.g. "espn"
  externalId: string;
  league: League;
  season: number;
  week: number | null;
  kickoff: Date;
  status: GameStatus;
  home: NormalizedTeam;
  away: NormalizedTeam;
  homeScore: number | null;
  awayScore: number | null;
  spread?: string | null; // pregame line, e.g. "TCU -6.5"
  overUnder?: number | null;
};

export interface GameProvider {
  source: string;
  league: League;
  fetchWeek(season: number, week: number): Promise<NormalizedGame[]>;
}
