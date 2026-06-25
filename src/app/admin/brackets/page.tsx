import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { CreateBracketForm } from "@/components/admin/CreateBracketForm";

export default async function AdminBracketsPage() {
  await requireAdmin();
  const brackets = await db.bracket.findMany({
    orderBy: [{ season: "desc" }, { league: "asc" }],
    include: { _count: { select: { games: true, entries: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <div>
        <Link href="/admin" className="text-sm text-emerald-500 hover:underline">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Brackets</h1>
      </div>

      <CreateBracketForm />

      <div className="space-y-2">
        {brackets.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No brackets yet. Create one above.
          </p>
        ) : (
          brackets.map((b) => (
            <Link
              key={b.id}
              href={`/admin/brackets/${b.id}`}
              className="flex items-center justify-between rounded-xl border border-cardborder bg-card p-4 transition hover:border-emerald-500/50"
            >
              <div>
                <div className="font-bold">{b.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  <span className="font-semibold text-emerald-500">
                    {LEAGUE_LABELS[b.league]}
                  </span>{" "}
                  · {b.season} · {b._count.entries} seeds · {b._count.games} games
                </div>
              </div>
              <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-muted">
                {b.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
