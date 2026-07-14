import { db } from "@/lib/db";
import type {
  GameCardData,
  GameCardTeam,
  LastGameSummary,
} from "@/components/games/GameCard";
import type { GameStatus, League } from "@/generated/prisma/client";

export type LastGameFor = (
  teamId: string,
  beforeISO: string,
) => LastGameSummary | null;

type TeamRow = {
  name: string;
  displayName: string;
  abbreviation: string | null;
  location: string | null;
  venue: string | null;
  grouping: string | null;
  color: string | null;
  altColor: string | null;
  logo: string | null;
  record: string | null;
};

type GameRow = {
  id: string;
  league: League;
  season: number;
  week: number | null;
  kickoff: Date;
  pickLockAt: Date;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  spread: string | null;
  overUnder: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: TeamRow;
  awayTeam: TeamRow;
};

// Stadium label for a game's metadata line. A per-game venue override wins;
// otherwise HS6A/NFL show the home team's stadium + city, and CFB shows just
// the stadium (its `location` is the school name).
export function venueLabel(g: {
  league: League;
  venue: string | null;
  homeTeam: { venue: string | null; location: string | null };
}): string | null {
  if (g.venue) return g.venue;
  if (g.league === "CFB") return g.homeTeam.venue;
  if (g.league === "HS6A" || g.league === "NFL") {
    const parts = [g.homeTeam.venue, g.homeTeam.location].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  return null;
}

// Pool consensus (home/away pick counts) for the given games.
export async function getConsensus(gameIds: string[]) {
  const consensus = new Map<string, { home: number; away: number }>();
  if (!gameIds.length) return consensus;
  const rows = await db.pick.groupBy({
    by: ["gameId", "side"],
    where: { gameId: { in: gameIds } },
    _count: { _all: true },
  });
  for (const r of rows) {
    const c = consensus.get(r.gameId) ?? { home: 0, away: 0 };
    if (r.side === "HOME") c.home = r._count._all;
    else c.away = r._count._all;
    consensus.set(r.gameId, c);
  }
  return consensus;
}

// Build a record resolver from our own finished games (fallback when a team has
// no feed-provided record). Returns recordFor(teamId, season, feedRecord).
export async function makeRecordResolver(
  games: { homeTeamId: string; awayTeamId: string; season: number }[],
) {
  const derived = new Map<string, { w: number; l: number; t: number }>();
  const teamIds = new Set<string>();
  const seasons = new Set<number>();
  for (const g of games) {
    teamIds.add(g.homeTeamId);
    teamIds.add(g.awayTeamId);
    seasons.add(g.season);
  }
  if (teamIds.size) {
    const finals = await db.game.findMany({
      where: {
        status: "FINAL",
        season: { in: [...seasons] },
        OR: [
          { homeTeamId: { in: [...teamIds] } },
          { awayTeamId: { in: [...teamIds] } },
        ],
      },
      select: {
        season: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });
    const bump = (teamId: string, season: number, k: "w" | "l" | "t") => {
      if (!teamIds.has(teamId)) return;
      const key = `${teamId}:${season}`;
      const r = derived.get(key) ?? { w: 0, l: 0, t: 0 };
      r[k] += 1;
      derived.set(key, r);
    };
    for (const f of finals) {
      if (f.homeScore == null || f.awayScore == null) continue;
      const tie = f.homeScore === f.awayScore;
      const homeWon = f.homeScore > f.awayScore;
      bump(f.homeTeamId, f.season, tie ? "t" : homeWon ? "w" : "l");
      bump(f.awayTeamId, f.season, tie ? "t" : homeWon ? "l" : "w");
    }
  }
  return (teamId: string, season: number, feed: string | null) => {
    if (feed) return feed;
    const r = derived.get(`${teamId}:${season}`);
    if (!r || r.w + r.l + r.t === 0) return null;
    return r.t > 0 ? `${r.w}-${r.l}-${r.t}` : `${r.w}-${r.l}`;
  };
}

// Resolve each team's most recent FINAL game *before* a reference kickoff.
// Batches one query over all involved teams; returns a per-team lookup.
export async function makeLastGameResolver(
  games: { homeTeamId: string; awayTeamId: string }[],
): Promise<LastGameFor> {
  const teamIds = new Set<string>();
  for (const g of games) {
    teamIds.add(g.homeTeamId);
    teamIds.add(g.awayTeamId);
  }
  if (!teamIds.size) return () => null;

  const finals = await db.game.findMany({
    where: {
      status: "FINAL",
      homeScore: { not: null },
      awayScore: { not: null },
      OR: [
        { homeTeamId: { in: [...teamIds] } },
        { awayTeamId: { in: [...teamIds] } },
      ],
    },
    select: {
      kickoff: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { displayName: true } },
      awayTeam: { select: { displayName: true } },
    },
    orderBy: { kickoff: "desc" },
  });

  // Group each team's finals, newest first.
  const byTeam = new Map<string, typeof finals>();
  for (const f of finals) {
    for (const tid of [f.homeTeamId, f.awayTeamId]) {
      if (!teamIds.has(tid)) continue;
      const arr = byTeam.get(tid) ?? [];
      arr.push(f);
      byTeam.set(tid, arr);
    }
  }

  return (teamId, beforeISO) => {
    const arr = byTeam.get(teamId);
    if (!arr) return null;
    const before = new Date(beforeISO).getTime();
    const f = arr.find((x) => x.kickoff.getTime() < before);
    if (!f || f.homeScore == null || f.awayScore == null) return null;
    const home = f.homeTeamId === teamId;
    const teamScore = home ? f.homeScore : f.awayScore;
    const oppScore = home ? f.awayScore : f.homeScore;
    return {
      result: teamScore === oppScore ? "T" : teamScore > oppScore ? "W" : "L",
      teamScore,
      oppScore,
      opponent: (home ? f.awayTeam : f.homeTeam).displayName,
      home,
      kickoffISO: f.kickoff.toISOString(),
    };
  };
}

// Map a DB game (with its teams) to the serializable shape the card + modal use.
export function toGameCardData(
  g: GameRow,
  recordFor: (teamId: string, season: number, feed: string | null) => string | null,
  lastGameFor: LastGameFor = () => null,
): GameCardData {
  const team = (t: TeamRow, teamId: string): GameCardTeam => ({
    name: t.name,
    displayName: t.displayName,
    abbreviation: t.abbreviation,
    location: t.location,
    venue: t.venue,
    grouping: t.grouping,
    color: t.color,
    altColor: t.altColor,
    logo: t.logo,
    record: recordFor(teamId, g.season, t.record),
    lastGame: lastGameFor(teamId, g.kickoff.toISOString()),
  });
  return {
    id: g.id,
    league: g.league,
    season: g.season,
    week: g.week,
    kickoffISO: g.kickoff.toISOString(),
    pickLockISO: g.pickLockAt.toISOString(),
    status: g.status,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    venueLabel: venueLabel(g),
    spread: g.spread,
    overUnder: g.overUnder,
    homeTeam: team(g.homeTeam, g.homeTeamId),
    awayTeam: team(g.awayTeam, g.awayTeamId),
  };
}
