import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isLeague, LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import { isLocked } from "@/lib/picks";
import { getConsensus, makeRecordResolver, toGameCardData } from "@/lib/game-card";
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

  const consensus = await getConsensus(games.map((g) => g.id));
  const recordFor = await makeRecordResolver(games);

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
              game={toGameCardData(g, recordFor)}
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
