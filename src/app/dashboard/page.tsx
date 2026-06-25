import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLeaderboard } from "@/lib/scoring";
import { getUserStats } from "@/lib/stats";
import { Page } from "@/components/ui/Page";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cardborder bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className="headline mt-1 text-4xl tabular-nums">{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

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

  const stats = await getUserStats(userId);
  const name = session.user.username ?? session.user.name ?? "there";
  const top = board.slice(0, 3);

  return (
    <Page>
      <h1 className="headline text-4xl sm:text-5xl">
        Welcome back, <span className="text-emerald-500">{name}</span>
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Rank" value={rank ? `#${rank}` : "—"} />
        <StatCard label="Points" value={String(me?.points ?? 0)} />
        <StatCard
          label="Record"
          value={me ? `${me.wins}-${me.losses}-${me.pushes}` : "0-0-0"}
        />
        <StatCard
          label="Streak"
          value={stats.currentStreak > 0 ? `🔥 ${stats.currentStreak}` : "—"}
        />
      </div>

      {stats.badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.badges.map((b) => (
            <span
              key={b.label}
              className="rounded-full border border-cardborder bg-card px-3 py-1 text-xs font-semibold"
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      ) : null}

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
    </Page>
  );
}
