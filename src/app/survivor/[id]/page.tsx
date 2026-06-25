import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { isLocked } from "@/lib/picks";
import {
  currentSurvivorWeek,
  getSurvivorStandings,
  getUserSurvivorView,
} from "@/lib/survivor";
import { SurvivorPicker } from "@/components/survivor/SurvivorPicker";

const RESULT = {
  WIN: { label: "Survived", cls: "text-emerald-500" },
  LOSS: { label: "Eliminated", cls: "text-red-500" },
  PENDING: { label: "Pending", cls: "text-muted" },
} as const;

export default async function SurvivorPoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const pool = await db.survivorPool.findUnique({ where: { id } });
  if (!pool) notFound();

  const [week, standings] = await Promise.all([
    currentSurvivorWeek(pool.league, pool.season),
    getSurvivorStandings(pool.id),
  ]);
  const view = userId ? await getUserSurvivorView(pool.id, userId) : null;

  const weekGames =
    week != null
      ? await db.game.findMany({
          where: { league: pool.league, season: pool.season, week },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { kickoff: "asc" },
        })
      : [];
  const weekPick = view?.picks.find((p) => p.week === week) ?? null;

  const pickerGames = weekGames.map((g) => ({
    id: g.id,
    locked: isLocked(g),
    kickoffLabel: `${g.awayTeam.name} @ ${g.homeTeam.name} · ${formatKickoff(g.kickoff)}`,
    away: { teamId: g.awayTeamId, name: g.awayTeam.name, logo: g.awayTeam.logo, color: g.awayTeam.color },
    home: { teamId: g.homeTeamId, name: g.homeTeam.name, logo: g.homeTeam.logo, color: g.homeTeam.color },
  }));

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/survivor" className="text-sm text-emerald-500 hover:underline">
        ← All pools
      </Link>
      <h1 className="mt-2 text-3xl font-black tracking-tight">{pool.title}</h1>
      <p className="mt-1 text-sm text-muted">
        <span className="font-semibold text-emerald-500">{LEAGUE_LABELS[pool.league]}</span>{" "}
        · {pool.season} {week != null ? `· Week ${week}` : ""}
      </p>

      {!userId ? (
        <p className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold text-emerald-500 underline">
            Log in
          </Link>{" "}
          to play survivor.
        </p>
      ) : view ? (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
            view.alive
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {view.alive
            ? `You're still alive — ${view.picks.filter((p) => p.result === "WIN").length} week(s) survived.`
            : `Eliminated in Week ${view.eliminatedWeek}.`}
        </p>
      ) : null}

      {/* This week's pick */}
      {userId && view?.alive && week != null && pickerGames.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">
            Week {week} pick
            {weekPick ? (
              <span className="ml-2 text-sm font-normal text-muted">
                (current: <span className="font-semibold text-foreground">{
                  weekGames.find((g) => g.id === weekPick.gameId)
                    ? weekPick.teamId === weekGames.find((g) => g.id === weekPick.gameId)!.homeTeamId
                      ? weekGames.find((g) => g.id === weekPick.gameId)!.homeTeam.name
                      : weekGames.find((g) => g.id === weekPick.gameId)!.awayTeam.name
                    : "—"
                }</span>)
              </span>
            ) : null}
          </h2>
          <SurvivorPicker
            poolId={pool.id}
            games={pickerGames}
            usedTeamIds={view ? [...view.usedTeamIds] : []}
            pickedTeamId={weekPick?.teamId ?? null}
          />
        </section>
      ) : null}

      {/* Your picks */}
      {view && view.picks.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-bold">Your picks</h2>
          <div className="divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
            {view.picks.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted">Week {p.week}</span>
                <span className="font-semibold">{p.team.displayName}</span>
                <span className={`text-xs font-semibold ${RESULT[p.result].cls}`}>
                  {RESULT[p.result].label}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Standings */}
      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">Standings</h2>
        {standings.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No entries yet — make a pick to join.
          </p>
        ) : (
          <div className="divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
            {standings.map((s) => (
              <div
                key={s.userId}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  s.userId === userId ? "bg-emerald-500/10" : ""
                }`}
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-xs">
                  {s.alive ? (
                    <span className="font-semibold text-emerald-500">
                      Alive · {s.survived} wk
                    </span>
                  ) : (
                    <span className="text-muted">Out (wk {s.eliminatedWeek})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
