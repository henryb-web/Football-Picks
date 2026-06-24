import Link from "next/link";
import { db } from "@/lib/db";
import { isLeague, LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import type { League } from "@/generated/prisma/client";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league } = await searchParams;
  const active: League | null = league && isLeague(league) ? league : null;

  const games = await db.game.findMany({
    where: active ? { league: active } : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    take: 100,
  });

  const tabs: { key: string; label: string; href: string }[] = [
    { key: "all", label: "All", href: "/games" },
    ...LEAGUES.map((l) => ({
      key: l,
      label: LEAGUE_LABELS[l],
      href: `/games?league=${l}`,
    })),
  ];
  const activeKey = active ?? "all";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Games</h1>

      <div className="mt-5 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              activeKey === t.key
                ? "bg-emerald-600 text-white"
                : "border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {games.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">
            No games here yet. An admin can add them from the Admin page.
          </p>
        ) : (
          games.map((g) => {
            const isFinal = g.status === "FINAL";
            return (
              <div key={g.id} className="flex items-center justify-between gap-3 p-4">
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
                <div className="shrink-0 text-right">
                  {isFinal ? (
                    <span className="text-sm font-bold tabular-nums">
                      {g.awayScore} – {g.homeScore}
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800">
                      {g.status === "IN_PROGRESS" ? "Live" : "Scheduled"}
                    </span>
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
