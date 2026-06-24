import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isLeague, LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { isLocked } from "@/lib/picks";
import { PickButtons } from "@/components/games/PickButtons";
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
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Games</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick a winner for each game. Picks lock at kickoff.
      </p>

      {!userId ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
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
                ? "bg-emerald-600 text-white"
                : "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
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
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              }`}
            >
              {w}
            </Link>
          ))}
          <Link
            href={gamesHref(active, "all")}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
              activeWeek == null
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            }`}
          >
            All
          </Link>
        </div>
      ) : null}

      <div className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {games.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">
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

            return (
              <div
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {g.awayTeam.displayName}{" "}
                    <span className="text-neutral-400">@</span>{" "}
                    {g.homeTeam.displayName}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    <span className="font-semibold text-emerald-600">
                      {LEAGUE_LABELS[g.league]}
                    </span>
                    {g.week ? ` · Wk ${g.week}` : ""} · {formatKickoff(g.kickoff)}
                  </div>
                </div>

                <div className="shrink-0">
                  {userId && !locked ? (
                    <PickButtons
                      gameId={g.id}
                      awayLabel={g.awayTeam.name}
                      homeLabel={g.homeTeam.name}
                      initialSide={pick}
                    />
                  ) : (
                    <div className="flex flex-col items-end gap-1 text-right">
                      {isFinal ? (
                        <span className="text-sm font-bold tabular-nums">
                          {g.awayScore} – {g.homeScore}
                        </span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800">
                          {g.status === "IN_PROGRESS"
                            ? "Live"
                            : locked
                              ? "Locked"
                              : "Scheduled"}
                        </span>
                      )}
                      {pickLabel ? (
                        <span className="text-xs text-neutral-500">
                          Your pick:{" "}
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                            {pickLabel}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
