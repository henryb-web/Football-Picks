import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/scoring";

export default async function LeaderboardPage() {
  const [rows, session] = await Promise.all([getLeaderboard(), auth()]);
  const meId = session?.user?.id;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">
        Global standings — 1 point per correct pick.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
          No graded picks yet. Standings appear once games go final.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-cardborder bg-card">
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
                <tr key={r.userId} className={r.userId === meId ? "bg-emerald-500/10" : ""}>
                  <td className="px-4 py-3 font-semibold text-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{r.points}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">
                    {r.wins}-{r.losses}-{r.pushes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
