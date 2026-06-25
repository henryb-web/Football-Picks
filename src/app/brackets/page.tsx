import Link from "next/link";
import { GitMerge } from "lucide-react";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";

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
    <Page>
      <PageHeader
        title="Brackets"
        subtitle="Predict the whole postseason before it starts. More points for later rounds."
      />

      {brackets.length === 0 ? (
        <EmptyState icon={GitMerge}>
          No brackets are open yet — they appear here once the postseason field is
          set.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {brackets.map((b) => (
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
          ))}
        </div>
      )}
    </Page>
  );
}
