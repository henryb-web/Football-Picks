import { Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/scoring";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { FormPips } from "@/components/FormPips";

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
                  <td className={`px-4 py-3 font-display text-lg ${medalClass(i)}`}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.name}</div>
                    {r.form.length > 0 ? (
                      <div className="mt-1">
                        <FormPips form={r.form} />
                      </div>
                    ) : null}
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
