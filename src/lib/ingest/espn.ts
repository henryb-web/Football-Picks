import type { GameStatus, League } from "@/generated/prisma/client";
import type { NormalizedGame, NormalizedTeam } from "./types";

// ESPN's keyless scoreboard covers both the NFL and FBS college football.
const SPORT_PATH: Partial<Record<League, string>> = {
  NFL: "nfl",
  CFB: "college-football",
};

// Minimal shapes for the bits of the ESPN scoreboard payload we consume.
type EspnTeam = {
  id: string;
  displayName?: string;
  shortDisplayName?: string;
  name?: string;
  abbreviation?: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
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
    color: t.color ?? null,
    altColor: t.alternateColor ?? null,
    logo: t.logo ?? null,
  };
}

function mapEvent(
  league: League,
  event: EspnEvent,
  season: number,
  week: number,
): NormalizedGame | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = mapStatus(competition?.status ?? event.status);

  // ESPN reports "0" for games that haven't been played, so only trust scores
  // once a game is live or final.
  const parseScore = (s?: string) => {
    if (status === "SCHEDULED") return null;
    if (s == null || s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return {
    source: "espn",
    externalId: event.id,
    league,
    season,
    week,
    kickoff: new Date(event.date),
    status,
    home: mapTeam(home.team),
    away: mapTeam(away.team),
    homeScore: parseScore(home.score),
    awayScore: parseScore(away.score),
  };
}

// Fetch one week of games for a league from ESPN. seasonType: 1 = preseason,
// 2 = regular season, 3 = postseason.
export async function fetchEspnWeek(
  league: League,
  season: number,
  week: number,
  seasonType = 2,
): Promise<NormalizedGame[]> {
  const path = SPORT_PATH[league];
  if (!path) throw new Error(`No ESPN feed for ${league}.`);

  const params = new URLSearchParams({
    dates: String(season),
    seasontype: String(seasonType),
    week: String(week),
  });
  // FBS only (and lift the default result cap — a college week has ~60+ games).
  if (league === "CFB") {
    params.set("groups", "80");
    params.set("limit", "300");
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/football/${path}/scoreboard?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "PickSix/0.1 (+local-dev)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN ${league} fetch failed (${res.status} ${res.statusText})`);
  }
  const data = (await res.json()) as { events?: EspnEvent[] };
  return (data.events ?? [])
    .map((e) => mapEvent(league, e, season, week))
    .filter((g): g is NormalizedGame => g !== null);
}
