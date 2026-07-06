import Link from "next/link";
import { MapPin } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isLeague, LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { isLocked } from "@/lib/picks";
import { PickButtons } from "@/components/games/PickButtons";
import { TeamLogo } from "@/components/games/TeamLogo";
import { LockCountdown } from "@/components/games/LockCountdown";
import { ConsensusBar } from "@/components/games/ConsensusBar";
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

  const allGames = await db.game.findMany({
    where: active ? { league: active } : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    take: 300,
  });

  const weeks = [
    ...new Set(allGames.map((g) => g.week).filter((w): w is number => w != null)),
  ].sort((a, b) => a - b);

  // Active week: explicit ?week=, else the earliest week with an open game.
  let activeWeek: number | null = null;
  if (week === "all") {
    activeWeek = null;
  } else if (week && /^\d+$/.test(week) && weeks.includes(Number(week))) {
    activeWeek = Number(week);
  } else {
    const upcoming = allGames.find((g) => g.week != null && !isLocked(g));
    activeWeek = upcoming?.week ?? weeks[0] ?? null;
  }

  const games =
    activeWeek == null ? allGames : allGames.filter((g) => g.week === activeWeek);

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
      <p className="mt-1.5 text-sm text-muted">
        Pick a winner for each game. Picks lock at kickoff.
      </p>

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
          games.map((g) => {
            const locked = isLocked(g);
            const isFinal = g.status === "FINAL";
            const pick = pickMap.get(g.id) ?? null;
            const pickLabel =
              pick === "HOME"
                ? g.homeTeam.name
                : pick === "AWAY"
                  ? g.awayTeam.name
                  : null;

            const c = consensus.get(g.id) ?? { home: 0, away: 0 };
            const awayC = g.awayTeam.color ?? "3b4252";
            const homeC = g.homeTeam.color ?? "3b4252";

            return (
              <div
                key={g.id}
                className="lift relative overflow-hidden rounded-xl border border-cardborder bg-card p-4 pl-5"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{
                    background: `linear-gradient(to bottom, #${awayC} 0 50%, #${homeC} 50% 100%)`,
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    background: `linear-gradient(110deg, #${awayC}, transparent 42%, transparent 58%, #${homeC})`,
                  }}
                />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TeamLogo logo={g.awayTeam.logo} color={g.awayTeam.color} />
                      {g.awayTeam.displayName}
                      <span className="text-muted">@</span>
                      <TeamLogo logo={g.homeTeam.logo} color={g.homeTeam.color} />
                      {g.homeTeam.displayName}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      <span className="font-semibold text-cyan-500">
                        {LEAGUE_LABELS[g.league]}
                      </span>
                      {g.week ? ` · Wk ${g.week}` : ""} ·{" "}
                      {formatKickoff(g.kickoff)}
                      {venueLabel(g) ? (
                        <span className="ml-1 inline-flex items-center gap-0.5">
                          <MapPin className="inline size-3 -translate-y-px" aria-hidden />
                          {venueLabel(g)}
                        </span>
                      ) : null}
                      {!locked ? (
                        <>
                          {" · "}
                          <LockCountdown lockAt={g.pickLockAt.toISOString()} />
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {userId && !locked ? (
                      <PickButtons
                        gameId={g.id}
                        awayLabel={g.awayTeam.name}
                        homeLabel={g.homeTeam.name}
                        awayColor={g.awayTeam.color}
                        homeColor={g.homeTeam.color}
                        initialSide={pick}
                      />
                    ) : (
                      <div className="flex flex-col items-end gap-1 text-right">
                        {isFinal ? (
                          <span className="font-display text-2xl font-semibold tabular-nums">
                            {g.awayScore}
                            <span className="mx-1 text-muted">–</span>
                            {g.homeScore}
                          </span>
                        ) : (
                          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
                            {g.status === "IN_PROGRESS"
                              ? "Live"
                              : locked
                                ? "Locked"
                                : "Scheduled"}
                          </span>
                        )}
                        {pickLabel ? (
                          <span className="text-xs text-muted">
                            Your pick:{" "}
                            <span className="font-semibold text-foreground">
                              {pickLabel}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <ConsensusBar
                  awayCount={c.away}
                  homeCount={c.home}
                  awayColor={g.awayTeam.color}
                  homeColor={g.homeTeam.color}
                />
              </div>
            );
          })
        )}
      </div>
    </Page>
  );
}
