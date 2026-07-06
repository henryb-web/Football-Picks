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
type EspnRecord = { type?: string; summary?: string };
type EspnCompetitor = {
  homeAway: "home" | "away";
  team: EspnTeam;
  score?: string;
  records?: EspnRecord[];
};
type EspnStatus = {
  type?: { state?: string; completed?: boolean };
};
type EspnOdds = { details?: string; overUnder?: number };
type EspnEvent = {
  id: string;
  date: string;
  status?: EspnStatus;
  competitions?: {
    competitors?: EspnCompetitor[];
    status?: EspnStatus;
    odds?: EspnOdds[];
  }[];
};

function mapStatus(status: EspnStatus | undefined): GameStatus {
  const state = status?.type?.state;
  if (status?.type?.completed || state === "post") return "FINAL";
  if (state === "in") return "IN_PROGRESS";
  return "SCHEDULED";
}

// ESPN gives a few record splits per competitor; the overall one is type
// "total" (e.g. "7-2"). Fall back to the first summary if the type is absent.
function overallRecord(records: EspnRecord[] | undefined): string | null {
  if (!records?.length) return null;
  const total = records.find((r) => r.type === "total") ?? records[0];
  return total.summary ?? null;
}

function mapTeam(t: EspnTeam, record: string | null): NormalizedTeam {
  return {
    externalId: t.id,
    name: t.name ?? t.shortDisplayName ?? t.displayName ?? t.abbreviation ?? t.id,
    displayName: t.displayName ?? t.shortDisplayName ?? t.name ?? t.id,
    abbreviation: t.abbreviation ?? null,
    location: t.location ?? null,
    color: t.color ?? null,
    altColor: t.alternateColor ?? null,
    logo: t.logo ?? null,
    record,
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

  // ESPN carries a pregame line (top-priority provider first) for upcoming games.
  const odds = competition?.odds?.[0];

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
    home: mapTeam(home.team, overallRecord(home.records)),
    away: mapTeam(away.team, overallRecord(away.records)),
    homeScore: parseScore(home.score),
    awayScore: parseScore(away.score),
    spread: odds?.details ?? null,
    overUnder: odds?.overUnder ?? null,
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

// The set of FBS (top-division) team ids for a season, from ESPN's core API
// group 80. Used to keep the college slate to FBS matchups (power-vs-G5 is fine,
// power-vs-FCS is dropped). Ids are parsed out of each item's $ref URL, so we
// don't have to dereference every team.
export async function fetchFbsTeamIds(season: number): Promise<Set<string>> {
  const url =
    `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/` +
    `seasons/${season}/types/2/groups/80/teams?limit=300`;
  const res = await fetch(url, {
    headers: { "User-Agent": "PickSix/0.1 (+local-dev)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `ESPN FBS teams fetch failed (${res.status} ${res.statusText})`,
    );
  }
  const data = (await res.json()) as { items?: { $ref?: string }[] };
  const ids = new Set<string>();
  for (const item of data.items ?? []) {
    const match = /teams\/(\d+)/.exec(item.$ref ?? "");
    if (match) ids.add(match[1]);
  }
  return ids;
}
