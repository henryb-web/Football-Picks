import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { CreateSurvivorForm } from "@/components/admin/CreateSurvivorForm";
import { toggleSurvivorPoolAction } from "@/app/admin/survivor/actions";

export default async function AdminSurvivorPage() {
  await requireAdmin();
  const pools = await db.survivorPool.findMany({
    orderBy: [{ season: "desc" }, { league: "asc" }],
    include: { _count: { select: { picks: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <div>
        <Link href="/admin" className="text-sm text-cyan-500 hover:underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Survivor pools</h1>
        <p className="mt-1 text-sm text-muted">
          Picks use the league&apos;s existing games; results grade automatically
          when games go final.
        </p>
      </div>

      <CreateSurvivorForm />

      <div className="space-y-2">
        {pools.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No survivor pools yet.
          </p>
        ) : (
          pools.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-cardborder bg-card p-4"
            >
              <div>
                <div className="font-bold">{p.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  <span className="font-semibold text-cyan-500">
                    {LEAGUE_LABELS[p.league]}
                  </span>{" "}
                  · {p.season} · {p._count.picks} picks
                </div>
              </div>
              <form action={toggleSurvivorPoolAction}>
                <input type="hidden" name="poolId" value={p.id} />
                <button
                  type="submit"
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    p.active
                      ? "bg-cyan-600 text-white hover:bg-cyan-500"
                      : "border border-cardborder hover:bg-background"
                  }`}
                >
                  {p.active ? "Active" : "Inactive"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
