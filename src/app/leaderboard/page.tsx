import { Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/scoring";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { FormPips } from "@/components/FormPips";
import { Avatar } from "@/components/Avatar";

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
    <span className={`text-[10px] font-bold ${up ? "text-cyan-400" : "text-red-400"}`}>
      {up ? "▲" : "▼"}
      {Math.abs(m)}
    </span>
  );
}

export default async function LeaderboardPage() {
  const [rows, session] = await Promise.all([getLeaderboard(), auth()]);
  const meId = session?.user?.id;

  return (
    <Page>
      <PageHeader
        title="Leaderboard"
        subtitle="Global standings — 1 point per correct pick."
      />

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
                <tr key={r.userId} className={r.userId === meId ? "bg-cyan-500/10" : ""}>
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
                      <Avatar name={r.name} size={30} />
                      <div>
                        <div className="font-medium">{r.name}</div>
                        {r.form.length > 0 ? (
                          <div className="mt-1">
                            <FormPips form={r.form} />
                          </div>
                        ) : null}
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
