import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLeaderboard } from "@/lib/scoring";
import { getUserStats } from "@/lib/stats";
import { Page } from "@/components/ui/Page";
import { FormPips } from "@/components/FormPips";
import { Avatar } from "@/components/Avatar";

// Start of the football week containing `d`, anchored at Tuesday 12:00 UTC — a
// dead zone between Monday-night games (which can spill into early Tuesday in UTC)
// and the next Thursday slate. Keeps a full Thu–Mon week in one bucket on any
// server timezone, and merges NFL/CFB/HS games that fall in the same calendar week
// even though each league numbers its weeks differently.
function weekStartFor(d: Date): Date {
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0),
  );
  const daysSinceTuesday = (start.getUTCDay() - 2 + 7) % 7; // getUTCDay: 0=Sun..6=Sat
  start.setUTCDate(start.getUTCDate() - daysSinceTuesday);
  if (start > d) start.setUTCDate(start.getUTCDate() - 7);
  return start;
}

function StatCard({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-cardborder bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={`headline mt-1 text-4xl tabular-nums ${gold ? "text-amber-400" : ""}`}>
        {value}
      </div>
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

  // Games still open for picking, scoped to the nearest football week only — so we
  // nudge about the immediate slate, not every game left in the season. We take the
  // soonest still-open game across all leagues and count everything in its Tue→Mon
  // week that this user hasn't picked (NFL/CFB/HS merged by calendar week).
  const now = new Date();
  const openGames = await db.game.findMany({
    where: { status: "SCHEDULED", pickLockAt: { gt: now } },
    select: { id: true, kickoff: true },
    orderBy: { kickoff: "asc" },
  });

  let weekIds: string[] = [];
  if (openGames.length > 0) {
    const weekStart = weekStartFor(openGames[0].kickoff);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    weekIds = openGames
      .filter((g) => g.kickoff >= weekStart && g.kickoff < weekEnd)
      .map((g) => g.id);
  }
  const pickedCount = weekIds.length
    ? await db.pick.count({ where: { userId, gameId: { in: weekIds } } })
    : 0;
  const needPicks = weekIds.length - pickedCount;

  const stats = await getUserStats(userId);
  const name = session.user.username ?? session.user.name ?? "there";
  const top = board.slice(0, 3);

  return (
    <Page>
      <h1 className="headline text-4xl sm:text-5xl">
        Welcome back, <span className="text-cyan-500">{name}</span>
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Rank" value={rank ? `#${rank}` : "—"} gold={rank === 1} />
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

      {me && me.form.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-widest text-muted">
            Form
          </span>
          <FormPips form={me.form} />
        </div>
      ) : null}

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
            ? "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/15"
            : "border-cardborder bg-card hover:border-cyan-500/50"
        }`}
      >
        <div>
          <div className="text-lg font-bold">
            {needPicks > 0
              ? `${needPicks} game${needPicks === 1 ? "" : "s"} need your picks this week`
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
            <Link href="/leaderboard" className="text-sm font-medium text-cyan-500 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
            {top.map((r, i) => (
              <div
                key={r.userId}
                className={`flex items-center justify-between px-4 py-3 ${
                  r.userId === userId ? "bg-cyan-500/10" : ""
                }`}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={`font-display ${
                      i === 0
                        ? "text-amber-400"
                        : i === 1
                          ? "text-zinc-300"
                          : "text-amber-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Avatar name={r.name} size={24} />
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
