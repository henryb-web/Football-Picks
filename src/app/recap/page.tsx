import { getWeeklyRecaps } from "@/lib/stats";

export default async function RecapPage() {
  const recaps = await getWeeklyRecaps();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Weekly Recap</h1>
      <p className="mt-1 text-sm text-muted">
        Who topped the pool each week.
      </p>

      {recaps.length === 0 ? (
        <p className="mt-6 rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
          No completed weeks yet — recaps appear once games go final.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {recaps.map((r) => (
            <div key={r.week} className="rounded-xl border border-cardborder bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">
                  {r.week === 0 ? "Other" : `Week ${r.week}`}
                </h2>
                {r.winnerPoints > 0 ? (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                    🏆 {r.winners.join(" & ")} · {r.winnerPoints} pts
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-1">
                {r.standings.map((s, i) => (
                  <div
                    key={s.name + i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted">
                      <span className="mr-2 font-semibold">{i + 1}</span>
                      {s.name}
                    </span>
                    <span className="font-bold tabular-nums">{s.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
