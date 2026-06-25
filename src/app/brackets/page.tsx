import Link from "next/link";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open for picks",
  LOCKED: "Locked",
  COMPLETE: "Final",
};

export default async function BracketsPage() {
  const brackets = await db.bracket.findMany({
    where: { status: { in: ["OPEN", "LOCKED", "COMPLETE"] } },
    orderBy: [{ season: "desc" }, { league: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">Brackets</h1>
      <p className="mt-1 text-sm text-muted">
        Predict the whole postseason before it starts. More points for later rounds.
      </p>

      <div className="mt-6 space-y-2">
        {brackets.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No brackets are open yet — they appear here once the postseason field
            is set.
          </p>
        ) : (
          brackets.map((b) => (
            <Link
              key={b.id}
              href={`/brackets/${b.id}`}
              className="flex items-center justify-between rounded-xl border border-cardborder bg-card p-4 transition hover:border-emerald-500/50"
            >
              <div>
                <div className="font-bold">{b.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  <span className="font-semibold text-emerald-500">
                    {LEAGUE_LABELS[b.league]}
                  </span>{" "}
                  · {b.season}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  b.status === "OPEN"
                    ? "bg-emerald-600 text-white"
                    : "bg-background text-muted"
                }`}
              >
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
