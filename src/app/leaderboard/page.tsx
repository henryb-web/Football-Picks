import { getLeaderboard } from "@/lib/scoring";

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Global standings — 1 point per correct pick.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-neutral-200 p-5 text-sm text-neutral-500 dark:border-neutral-800">
          No graded picks yet. Standings appear once games go final.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Player</th>
                <th className="px-4 py-2.5 text-right">Points</th>
                <th className="px-4 py-2.5 text-right">Record (W-L-P)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {rows.map((r, i) => (
                <tr key={r.userId}>
                  <td className="px-4 py-3 font-semibold text-neutral-400">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {r.points}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-500">
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
