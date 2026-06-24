import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { SyncNflForm } from "@/components/admin/SyncNflForm";
import { ManualGameForm } from "@/components/admin/ManualGameForm";
import { ScoreForm } from "@/components/admin/ScoreForm";

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="font-bold">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-neutral-500">{desc}</p>
      {children}
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const games = await db.game.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "desc" },
    take: 30,
  });

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sync feeds, add games, and enter final scores.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card
          title="Sync NFL (ESPN)"
          desc="Pull a week's NFL schedule and scores. No API key needed."
        >
          <SyncNflForm />
        </Card>
        <Card
          title="Add a game manually"
          desc="For Texas 6A and any off-feed matchups."
        >
          <ManualGameForm />
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold">Recent games ({games.length})</h2>
        <div className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {games.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">
              No games yet — sync NFL or add one above.
            </p>
          ) : (
            games.map((g) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {g.awayTeam.displayName} @ {g.homeTeam.displayName}
                  </div>
                  <div className="text-xs text-neutral-500">
                    <span className="font-semibold text-emerald-600">
                      {LEAGUE_LABELS[g.league]}
                    </span>
                    {g.week ? ` · Wk ${g.week}` : ""} · {formatKickoff(g.kickoff)} ·{" "}
                    {g.status}
                  </div>
                </div>
                <ScoreForm
                  gameId={g.id}
                  awayLabel={g.awayTeam.displayName}
                  homeLabel={g.homeTeam.displayName}
                  homeScore={g.homeScore}
                  awayScore={g.awayScore}
                />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
