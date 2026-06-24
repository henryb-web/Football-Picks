import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLeaderboard } from "@/lib/scoring";

const LEAGUES = [
  { tag: "NFL", title: "Pro", blurb: "Every NFL matchup.", href: "/games?league=NFL" },
  { tag: "CFB", title: "College", blurb: "Power-conference & CFP teams.", href: "/games?league=CFB" },
  { tag: "6A", title: "Texas High School", blurb: "UIL Class 6A games.", href: "/games?league=HS6A" },
];

function Splash() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
          Weekly pick&apos;em &middot; one global leaderboard
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">PickSix</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Make your picks before kickoff. Pro, college, and Texas 6A — compete
          on one leaderboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-cardborder px-5 py-2.5 text-sm font-semibold transition hover:bg-card"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {LEAGUES.map((l) => (
          <Link
            key={l.tag}
            href={l.href}
            className="group rounded-2xl border border-cardborder bg-card p-5 transition hover:border-emerald-500 hover:shadow-md hover:ring-2 hover:ring-emerald-500/40"
          >
            <span className="inline-block rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              {l.tag}
            </span>
            <h2 className="mt-3 text-lg font-bold group-hover:text-emerald-500">{l.title}</h2>
            <p className="mt-1 text-sm text-muted">{l.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cardborder bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-3xl font-black tabular-nums">{value}</div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return <Splash />;

  const board = await getLeaderboard();
  const idx = board.findIndex((r) => r.userId === userId);
  const me = idx >= 0 ? board[idx] : null;
  const rank = idx >= 0 ? idx + 1 : null;

  // Games still open for picking that this user hasn't picked yet.
  const upcoming = await db.game.findMany({
    where: { status: "SCHEDULED", pickLockAt: { gt: new Date() } },
    select: { id: true },
  });
  const upcomingIds = upcoming.map((g) => g.id);
  const pickedCount = upcomingIds.length
    ? await db.pick.count({ where: { userId, gameId: { in: upcomingIds } } })
    : 0;
  const needPicks = upcomingIds.length - pickedCount;

  const name = session.user.username ?? session.user.name ?? "there";
  const top = board.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">
        Welcome back, <span className="text-emerald-500">{name}</span>
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Rank" value={rank ? `#${rank}` : "—"} />
        <StatCard label="Points" value={String(me?.points ?? 0)} />
        <StatCard
          label="Record"
          value={me ? `${me.wins}-${me.losses}-${me.pushes}` : "0-0-0"}
        />
      </div>

      <Link
        href="/games"
        className={`mt-4 flex items-center justify-between rounded-xl border p-5 transition ${
          needPicks > 0
            ? "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15"
            : "border-cardborder bg-card hover:border-emerald-500/50"
        }`}
      >
        <div>
          <div className="text-lg font-bold">
            {needPicks > 0
              ? `${needPicks} game${needPicks === 1 ? "" : "s"} need your picks`
              : "You're all caught up"}
          </div>
          <div className="mt-0.5 text-sm text-muted">
            {needPicks > 0
              ? "Make them before kickoff →"
              : "Browse this week's slate →"}
          </div>
        </div>
        <span className="text-2xl">{needPicks > 0 ? "⚠️" : "✓"}</span>
      </Link>

      {top.length > 0 ? (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Leaderboard</h2>
            <Link href="/leaderboard" className="text-sm font-medium text-emerald-500 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
            {top.map((r, i) => (
              <div
                key={r.userId}
                className={`flex items-center justify-between px-4 py-3 ${
                  r.userId === userId ? "bg-emerald-500/10" : ""
                }`}
              >
                <span className="text-sm">
                  <span className="mr-2 font-semibold text-muted">{i + 1}</span>
                  {r.name}
                </span>
                <span className="text-sm font-bold tabular-nums">{r.points}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
