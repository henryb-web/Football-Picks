import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { SyncForm } from "@/components/admin/SyncForm";
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
    <div className="rounded-xl border border-cardborder bg-card p-5">
      <h2 className="font-bold">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-muted">{desc}</p>
      {children}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const q = (await searchParams).q?.trim() ?? "";

  const games = await db.game.findMany({
    where: q
      ? {
          OR: [
            { homeTeam: { displayName: { contains: q, mode: "insensitive" } } },
            { homeTeam: { name: { contains: q, mode: "insensitive" } } },
            { awayTeam: { displayName: { contains: q, mode: "insensitive" } } },
            { awayTeam: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "desc" },
    take: q ? 100 : 30,
  });

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted">
            Sync feeds, add games, and enter final scores.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/brackets"
            className="rounded-lg border border-cardborder px-3 py-1.5 text-sm font-semibold transition hover:bg-card"
          >
            Brackets →
          </Link>
          <Link
            href="/admin/survivor"
            className="rounded-lg border border-cardborder px-3 py-1.5 text-sm font-semibold transition hover:bg-card"
          >
            Survivor →
          </Link>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card
          title="Sync games (ESPN)"
          desc="Pull a week's NFL or college (FBS) schedule and scores. No API key needed."
        >
          <SyncForm />
        </Card>
        <Card
          title="Add a game manually"
          desc="For Texas 6A and any off-feed matchups."
        >
          <ManualGameForm />
        </Card>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-bold">
            {q
              ? `Search results (${games.length})`
              : `Recent games (${games.length})`}
          </h2>
          <form method="get" action="/admin" className="flex items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by team…"
              aria-label="Search games by team"
              className="w-48 rounded-lg border border-cardborder bg-background px-3 py-1.5 text-sm outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              Search
            </button>
            {q ? (
              <Link href="/admin" className="text-xs text-muted hover:underline">
                Clear
              </Link>
            ) : null}
          </form>
        </div>
        <div className="mt-3 divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
          {games.length === 0 ? (
            <p className="p-4 text-sm text-muted">
              {q
                ? `No games match “${q}”.`
                : "No games yet — sync NFL or add one above."}
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
                  <div className="text-xs text-muted">
                    <span className="font-semibold text-cyan-500">
                      {LEAGUE_LABELS[g.league]}
                    </span>
                    {g.week ? ` · Wk ${g.week}` : ""} · {formatKickoff(g.kickoff)} ·{" "}
                    {g.status}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ScoreForm
                    gameId={g.id}
                    awayLabel={g.awayTeam.displayName}
                    homeLabel={g.homeTeam.displayName}
                    homeScore={g.homeScore}
                    awayScore={g.awayScore}
                  />
                  <Link
                    href={`/admin/games/${g.id}`}
                    className="text-xs font-semibold text-cyan-500 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
