import { Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getLeaderboard, getStandingsSeries } from "@/lib/scoring";
import { getStatsForUsers } from "@/lib/stats";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { FormPips } from "@/components/FormPips";
import { StreakFlame, BadgeChips } from "@/components/Badges";
import { Avatar } from "@/components/Avatar";
import { StandingsChart } from "@/components/StandingsChart";

// Gold / silver / bronze for the top three.
function medalClass(i: number): string {
  return i === 0
    ? "text-amber-400"
    : i === 1
      ? "text-zinc-300"
      : i === 2
        ? "text-amber-700"
        : "text-muted";
}

function Movement({ m }: { m: number | null }) {
  if (m == null) return null;
  if (m === 0) return <span className="text-[10px] text-muted">—</span>;
  const up = m > 0;
  return (
    <span className={`text-[10px] font-bold ${up ? "text-accent-400" : "text-red-400"}`}>
      {up ? "▲" : "▼"}
      {Math.abs(m)}
    </span>
  );
}

export default async function LeaderboardPage() {
  const [rows, series, session] = await Promise.all([
    getLeaderboard(),
    getStandingsSeries(),
    auth(),
  ]);
  const meId = session?.user?.id;
  const stats = await getStatsForUsers(rows.map((r) => r.userId));

  return (
    <Page>
      <PageHeader
        title="Leaderboard"
      />

      {series.weeks.length >= 2 ? (
        <div className="mb-4">
          <StandingsChart data={series} meId={meId} />
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState icon={Trophy}>
          No graded picks yet. Standings appear once games go final.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-cardborder bg-card">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Player</th>
                <th className="px-4 py-2.5 text-right">Points</th>
                <th className="px-4 py-2.5 text-right">Record (W-L-P)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardborder">
              {rows.map((r, i) => (
                <tr key={r.userId} className={r.userId === meId ? "bg-accent-500/10" : ""}>
                  <td className="px-4 py-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-display text-lg ${medalClass(i)}`}>
                        {i + 1}
                      </span>
                      <Movement m={r.movement} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={r.name}
                        size={30}
                        image={r.image}
                        emoji={r.avatarEmoji}
                        color={r.avatarColor}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{r.name}</span>
                          <StreakFlame n={stats.get(r.userId)?.currentStreak ?? 0} />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {r.form.length > 0 ? <FormPips form={r.form} /> : null}
                          <BadgeChips badges={stats.get(r.userId)?.badges ?? []} max={3} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-display text-lg tabular-nums">
                    {r.points}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">
                    {r.wins}-{r.losses}-{r.pushes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
