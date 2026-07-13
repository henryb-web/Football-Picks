import Link from "next/link";
import { Skull } from "lucide-react";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";

export default async function SurvivorListPage() {
  const pools = await db.survivorPool.findMany({
    where: { active: true },
    orderBy: [{ season: "desc" }, { league: "asc" }],
  });

  return (
    <Page>
      <PageHeader
        title="Survivor"
      />

      {pools.length === 0 ? (
        <EmptyState icon={Skull}>No survivor pools are running right now.</EmptyState>
      ) : (
        <div className="space-y-2">
          {pools.map((p) => (
            <Link
              key={p.id}
              href={`/survivor/${p.id}`}
              className="lift flex items-center justify-between rounded-xl border border-cardborder bg-card p-4 hover:border-cyan-500/50"
            >
              <div className="font-bold">{p.title}</div>
              <span className="text-xs text-muted">
                <span className="font-semibold text-cyan-500">
                  {LEAGUE_LABELS[p.league]}
                </span>{" "}
                · {p.season}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
