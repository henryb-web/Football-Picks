import Link from "next/link";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";

export default async function SurvivorListPage() {
  const pools = await db.survivorPool.findMany({
    where: { active: true },
    orderBy: [{ season: "desc" }, { league: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Survivor</h1>
      <p className="mt-1 text-sm text-muted">
        Pick one team to win each week. Can&apos;t reuse a team. One loss and
        you&apos;re out — last one standing wins.
      </p>

      <div className="mt-6 space-y-2">
        {pools.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No survivor pools are running right now.
          </p>
        ) : (
          pools.map((p) => (
            <Link
              key={p.id}
              href={`/survivor/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-cardborder bg-card p-4 transition hover:border-emerald-500/50"
            >
              <div className="font-bold">{p.title}</div>
              <span className="text-xs text-muted">
                <span className="font-semibold text-emerald-500">
                  {LEAGUE_LABELS[p.league]}
                </span>{" "}
                · {p.season}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
