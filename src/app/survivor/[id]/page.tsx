import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Users } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { isLocked } from "@/lib/picks";
import { getUserTimeZone } from "@/lib/user-prefs";
import {
  currentSurvivorWeek,
  getSurvivorStandings,
  getUserSurvivorView,
  isPoolMember,
} from "@/lib/survivor";
import { SurvivorPicker } from "@/components/survivor/SurvivorPicker";
import { Page } from "@/components/ui/Page";
import { Avatar } from "@/components/Avatar";
import { joinPoolAction } from "../actions";
import { JoinByCodeForm } from "../JoinByCodeForm";
import { ShareCode } from "../ShareCode";

const RESULT = {
  WIN: { label: "Survived", cls: "text-accent-500" },
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

  const pool = await db.survivorPool.findUnique({
    where: { id },
    include: {
      owner: { select: { username: true, name: true } },
      _count: { select: { members: true } },
    },
  });
  if (!pool) notFound();

  const member = userId ? await isPoolMember(pool.id, userId) : false;
  const ownerName = pool.owner.username ?? pool.owner.name ?? "Someone";

  const header = (
    <>
      <Link href="/survivor" className="text-sm text-accent-500 hover:underline">
        ← All pools
      </Link>
      <h1 className="headline mt-2 flex items-center gap-2 text-4xl">
        {pool.isPrivate ? <Lock className="size-6 text-muted" aria-label="Private" /> : null}
        {pool.title}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <span className="font-semibold text-accent-500">{LEAGUE_LABELS[pool.league]}</span> ·{" "}
        {pool.season}
        <span className="inline-flex items-center gap-1">
          · <Users className="size-3.5" /> {pool._count.members}
        </span>
        · Hosted by {ownerName}
      </p>
    </>
  );

  // Private pools are hidden from non-members: only a join-by-code prompt.
  if (pool.isPrivate && !member) {
    return (
      <Page>
        {header}
        <div className="mt-6 max-w-md space-y-3">
          <p className="rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
            This is a private pool. Enter its invite code to join.
          </p>
          {userId ? (
            <JoinByCodeForm compact />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login" className="font-semibold text-accent-500 underline">
                Log in
              </Link>{" "}
              to join.
            </p>
          )}
        </div>
      </Page>
    );
  }

  const [week, standings] = await Promise.all([
    currentSurvivorWeek(pool.league, pool.season),
    getSurvivorStandings(pool.id),
  ]);
  const view = member && userId ? await getUserSurvivorView(pool.id, userId) : null;

  const weekGames =
    week != null && member
      ? await db.game.findMany({
          where: { league: pool.league, season: pool.season, week },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { kickoff: "asc" },
        })
      : [];
  const weekPick = view?.picks.find((p) => p.week === week) ?? null;
  const tz = await getUserTimeZone();

  const pickerGames = weekGames.map((g) => ({
    id: g.id,
    locked: isLocked(g),
    kickoffLabel: `${g.awayTeam.name} @ ${g.homeTeam.name} · ${formatKickoff(g.kickoff, tz)}`,
    away: { teamId: g.awayTeamId, name: g.awayTeam.name, displayName: g.awayTeam.displayName, logo: g.awayTeam.logo, color: g.awayTeam.color },
    home: { teamId: g.homeTeamId, name: g.homeTeam.name, displayName: g.homeTeam.displayName, logo: g.homeTeam.logo, color: g.homeTeam.color },
  }));

  return (
    <Page>
      {header}

      {week != null ? (
        <p className="mt-1 text-sm text-muted">Currently on Week {week}.</p>
      ) : null}

      {/* Membership state */}
      {!userId ? (
        <p className="mt-4 rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold text-accent-500 underline">
            Log in
          </Link>{" "}
          to play survivor.
        </p>
      ) : !member ? (
        <form action={joinPoolAction} className="mt-4">
          <input type="hidden" name="poolId" value={pool.id} />
          <button
            type="submit"
            className="rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500"
          >
            Join this pool
          </button>
        </form>
      ) : (
        <>
          <p
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
              view?.alive ? "bg-accent-500/10 text-accent-500" : "bg-red-500/10 text-red-500"
            }`}
          >
            {view?.alive
              ? `You're still alive — ${view.picks.filter((p) => p.result === "WIN").length} week(s) survived.`
              : `Eliminated in Week ${view?.eliminatedWeek}.`}
          </p>
          <div className="mt-3 max-w-sm">
            <ShareCode code={pool.joinCode} />
          </div>
        </>
      )}

      {/* This week's pick (members only) */}
      {member && view?.alive && week != null && pickerGames.length > 0 ? (
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
            No players yet — be the first to join.
          </p>
        ) : (
          <div className="divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
            {standings.map((s) => (
              <div
                key={s.userId}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  s.userId === userId ? "bg-accent-500/10" : ""
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Avatar name={s.name} size={22} />
                  {s.name}
                </span>
                <span className="text-xs">
                  {s.alive ? (
                    <span className="font-semibold text-accent-500">Alive · {s.survived} wk</span>
                  ) : (
                    <span className="text-muted">Out (wk {s.eliminatedWeek})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
