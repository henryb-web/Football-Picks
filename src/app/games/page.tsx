import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isLeague, LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import { isLocked } from "@/lib/picks";
import { GameCard } from "@/components/games/GameCard";
import { Page } from "@/components/ui/Page";
import type { League, PickSide } from "@/generated/prisma/client";

function gamesHref(league: string | null, week: string | number | null) {
  const params = new URLSearchParams();
  if (league) params.set("league", league);
  if (week != null) params.set("week", String(week));
  const qs = params.toString();
  return qs ? `/games?${qs}` : "/games";
}

// Where the game is played, for the metadata line. A per-game venue override
// always wins; otherwise fall back to the home team's stadium. HS6A/NFL append
// the city; CFB shows just the stadium (its `location` is the school name).
function venueLabel(g: {
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


export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; week?: string }>;
}) {
  const { league, week } = await searchParams;
  const active: League | null = league && isLeague(league) ? league : null;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const leagueWhere = active ? { league: active } : {};

  // Week tabs come from a distinct query so they're never truncated by the
  // game fetch below (a full CFB season is ~460 games).
  const weekRows = await db.game.findMany({
    where: { ...leagueWhere, week: { not: null } },
    select: { week: true },
    distinct: ["week"],
    orderBy: { week: "asc" },
  });
  const weeks = weekRows
    .map((r) => r.week)
    .filter((w): w is number => w != null)
    .sort((a, b) => a - b);

  // Active week: explicit ?week=, else the earliest week with an open game.
  let activeWeek: number | null = null;
  if (week === "all") {
    activeWeek = null;
  } else if (week && /^\d+$/.test(week) && weeks.includes(Number(week))) {
    activeWeek = Number(week);
  } else {
    // Earliest-kickoff game that's still open for picks (mirrors isLocked).
    const upcoming = await db.game.findFirst({
      where: {
        ...leagueWhere,
        week: { not: null },
        status: "SCHEDULED",
        pickLockAt: { gt: new Date() },
      },
      orderBy: { kickoff: "asc" },
      select: { week: true },
    });
    activeWeek = upcoming?.week ?? weeks[0] ?? null;
  }

  // Fetch only the games we'll actually render: a single week, or everything
  // (capped) when the "All" week tab is selected.
  const games = await db.game.findMany({
    where: activeWeek == null ? leagueWhere : { ...leagueWhere, week: activeWeek },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    take: 300,
  });

  const pickMap = new Map<string, PickSide>();
  if (userId && games.length) {
    const picks = await db.pick.findMany({
      where: { userId, gameId: { in: games.map((g) => g.id) } },
    });
    for (const p of picks) pickMap.set(p.gameId, p.side);
  }

  // Pool consensus: how many picks landed on each side of each game.
  const consensus = new Map<string, { home: number; away: number }>();
  if (games.length) {
    const rows = await db.pick.groupBy({
      by: ["gameId", "side"],
      where: { gameId: { in: games.map((g) => g.id) } },
      _count: { _all: true },
    });
    for (const r of rows) {
      const c = consensus.get(r.gameId) ?? { home: 0, away: 0 };
      if (r.side === "HOME") c.home = r._count._all;
      else c.away = r._count._all;
      consensus.set(r.gameId, c);
    }
  }

  // Records derived from our own finished games, keyed by `${teamId}:${season}`.
  // Used as a fallback when a team has no feed-provided record yet.
  const derivedRecord = new Map<string, { w: number; l: number; t: number }>();
  if (games.length) {
    const teamIds = new Set<string>();
    const seasons = new Set<number>();
    for (const g of games) {
      teamIds.add(g.homeTeamId);
      teamIds.add(g.awayTeamId);
      seasons.add(g.season);
    }
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
      const r = derivedRecord.get(key) ?? { w: 0, l: 0, t: 0 };
      r[k] += 1;
      derivedRecord.set(key, r);
    };
    for (const f of finals) {
      if (f.homeScore == null || f.awayScore == null) continue;
      const tie = f.homeScore === f.awayScore;
      const homeWon = f.homeScore > f.awayScore;
      bump(f.homeTeamId, f.season, tie ? "t" : homeWon ? "w" : "l");
      bump(f.awayTeamId, f.season, tie ? "t" : homeWon ? "l" : "w");
    }
  }
  // Feed record wins; else our derived one (omitted entirely if no games played).
  const recordFor = (teamId: string, season: number, feed: string | null) => {
    if (feed) return feed;
    const r = derivedRecord.get(`${teamId}:${season}`);
    if (!r || r.w + r.l + r.t === 0) return null;
    return r.t > 0 ? `${r.w}-${r.l}-${r.t}` : `${r.w}-${r.l}`;
  };

  const leagueTabs = [
    { key: "all", label: "All", href: gamesHref(null, null) },
    ...LEAGUES.map((l) => ({
      key: l,
      label: LEAGUE_LABELS[l],
      href: gamesHref(l, null),
    })),
  ];
  const activeLeagueKey = active ?? "all";

  return (
    <Page>
      <h1 className="headline text-4xl sm:text-5xl">Games</h1>

      {!userId ? (
        <p className="mt-4 rounded-lg bg-cyan-50 px-4 py-3 text-sm text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to make your picks.
        </p>
      ) : null}

      {/* League tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {leagueTabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              activeLeagueKey === t.key
                ? "bg-cyan-600 text-white"
                : "border border-cardborder hover:bg-card"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Week tabs */}
      {weeks.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Week
          </span>
          {weeks.map((w) => (
            <Link
              key={w}
              href={gamesHref(active, w)}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
                activeWeek === w
                  ? "bg-cyan-600 text-white"
                  : "border border-cardborder hover:bg-card"
              }`}
            >
              {w}
            </Link>
          ))}
          <Link
            href={gamesHref(active, "all")}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
              activeWeek == null
                ? "bg-cyan-600 text-white"
                : "border border-cardborder hover:bg-card"
            }`}
          >
            All
          </Link>
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {games.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No games here yet. An admin can add them from the Admin page.
          </p>
        ) : (
          games.map((g) => (
            <GameCard
              key={g.id}
              game={{
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
                homeTeam: {
                  name: g.homeTeam.name,
                  displayName: g.homeTeam.displayName,
                  abbreviation: g.homeTeam.abbreviation,
                  location: g.homeTeam.location,
                  venue: g.homeTeam.venue,
                  grouping: g.homeTeam.grouping,
                  color: g.homeTeam.color,
                  altColor: g.homeTeam.altColor,
                  logo: g.homeTeam.logo,
                  record: recordFor(g.homeTeamId, g.season, g.homeTeam.record),
                },
                awayTeam: {
                  name: g.awayTeam.name,
                  displayName: g.awayTeam.displayName,
                  abbreviation: g.awayTeam.abbreviation,
                  location: g.awayTeam.location,
                  venue: g.awayTeam.venue,
                  grouping: g.awayTeam.grouping,
                  color: g.awayTeam.color,
                  altColor: g.awayTeam.altColor,
                  logo: g.awayTeam.logo,
                  record: recordFor(g.awayTeamId, g.season, g.awayTeam.record),
                },
              }}
              pick={pickMap.get(g.id) ?? null}
              consensus={consensus.get(g.id) ?? { home: 0, away: 0 }}
              loggedIn={Boolean(userId)}
              locked={isLocked(g)}
            />
          ))
        )}
      </div>
    </Page>
  );
}
