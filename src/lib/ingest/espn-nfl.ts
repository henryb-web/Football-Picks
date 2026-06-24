import type { GameStatus } from "@/generated/prisma/client";
import type { GameProvider, NormalizedGame, NormalizedTeam } from "./types";

const ESPN_NFL_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

// Minimal shapes for the bits of the ESPN scoreboard payload we consume.
type EspnTeam = {
  id: string;
  displayName?: string;
  shortDisplayName?: string;
  name?: string;
  abbreviation?: string;
  location?: string;
};
type EspnCompetitor = {
  homeAway: "home" | "away";
  team: EspnTeam;
  score?: string;
};
type EspnStatus = {
  type?: { state?: string; completed?: boolean };
};
type EspnEvent = {
  id: string;
  date: string;
  status?: EspnStatus;
  competitions?: { competitors?: EspnCompetitor[]; status?: EspnStatus }[];
};

function mapStatus(status: EspnStatus | undefined): GameStatus {
  const state = status?.type?.state;
  if (status?.type?.completed || state === "post") return "FINAL";
  if (state === "in") return "IN_PROGRESS";
  return "SCHEDULED";
}

function mapTeam(t: EspnTeam): NormalizedTeam {
  return {
    externalId: t.id,
    name: t.name ?? t.shortDisplayName ?? t.displayName ?? t.abbreviation ?? t.id,
    displayName: t.displayName ?? t.shortDisplayName ?? t.name ?? t.id,
    abbreviation: t.abbreviation ?? null,
    location: t.location ?? null,
  };
}

function mapEvent(event: EspnEvent, season: number, week: number): NormalizedGame | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const parseScore = (s?: string) => {
    if (s == null || s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return {
    source: "espn",
    externalId: event.id,
    league: "NFL",
    season,
    week,
    kickoff: new Date(event.date),
    status: mapStatus(competition?.status ?? event.status),
    home: mapTeam(home.team),
    away: mapTeam(away.team),
    homeScore: parseScore(home.score),
    awayScore: parseScore(away.score),
  };
}

// seasonType: 1 = preseason, 2 = regular season, 3 = postseason.
export async function fetchNflWeek(
  season: number,
  week: number,
  seasonType = 2,
): Promise<NormalizedGame[]> {
  const url = `${ESPN_NFL_SCOREBOARD}?dates=${season}&seasontype=${seasonType}&week=${week}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "PickSix/0.1 (+local-dev)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN NFL fetch failed (${res.status} ${res.statusText})`);
  }
  const data = (await res.json()) as { events?: EspnEvent[] };
  return (data.events ?? [])
    .map((e) => mapEvent(e, season, week))
    .filter((g): g is NormalizedGame => g !== null);
}

export const espnNflProvider: GameProvider = {
  source: "espn",
  league: "NFL",
  fetchWeek: (season, week) => fetchNflWeek(season, week),
};
