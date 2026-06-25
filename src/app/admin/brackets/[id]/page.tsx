import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { seedFieldName } from "@/lib/bracket/format";
import { indexEntries, resolveSides, type ResolvedEntry } from "@/lib/bracket/resolve";
import { SeedEditor } from "@/components/admin/SeedEditor";
import { GenerateButton } from "@/components/admin/GenerateButton";
import {
  deleteBracketAction,
  setBracketStatusAction,
  setWinnerAction,
} from "@/app/admin/brackets/actions";
import type { BracketStatus } from "@/generated/prisma/client";

const STATUSES: BracketStatus[] = ["SETUP", "OPEN", "LOCKED", "COMPLETE"];

function WinnerButton({
  gameId,
  entry,
  isWinner,
}: {
  gameId: string;
  entry: ResolvedEntry | null;
  isWinner: boolean;
}) {
  if (!entry) {
    return <span className="px-2 py-1 text-sm text-muted">TBD</span>;
  }
  return (
    <form action={setWinnerAction}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="seed" value={entry.seed} />
      <input type="hidden" name="group" value={entry.group ?? ""} />
      <button
        type="submit"
        className={`rounded-md px-2.5 py-1 text-sm transition ${
          isWinner
            ? "bg-cyan-600 font-bold text-white"
            : "border border-cardborder hover:border-cyan-400"
        }`}
      >
        {entry.seed}. {entry.displayName}
      </button>
    </form>
  );
}

export default async function ManageBracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const bracket = await db.bracket.findUnique({
    where: { id },
    include: {
      entries: true,
      games: { orderBy: { slot: "asc" } },
    },
  });
  if (!bracket) notFound();

  const values: Record<string, string> = {};
  for (const e of bracket.entries) {
    values[seedFieldName(e.group, e.seed)] = e.displayName;
  }

  const idx = indexEntries(bracket.entries);
  const winnerMap = new Map<number, { seed: number; group: string | null }>();
  for (const g of bracket.games) {
    if (g.winnerSeed != null) winnerMap.set(g.slot, { seed: g.winnerSeed, group: g.winnerGroup });
  }
  const sides = resolveSides(bracket.games, idx, (slot) => winnerMap.get(slot) ?? null);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <div>
        <Link href="/admin/brackets" className="text-sm text-cyan-500 hover:underline">
          ← All brackets
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight">{bracket.title}</h1>
        <p className="mt-1 text-sm text-muted">
          <span className="font-semibold text-cyan-500">
            {LEAGUE_LABELS[bracket.league]}
          </span>{" "}
          · {bracket.season} · status <span className="font-semibold">{bracket.status}</span>
        </p>
      </div>

      {/* Status controls */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <form key={s} action={setBracketStatusAction}>
            <input type="hidden" name="bracketId" value={bracket.id} />
            <input type="hidden" name="status" value={s} />
            <button
              type="submit"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                bracket.status === s
                  ? "bg-cyan-600 text-white"
                  : "border border-cardborder hover:bg-card"
              }`}
            >
              {s}
            </button>
          </form>
        ))}
      </div>
      <p className="-mt-4 text-xs text-muted">
        SETUP → seed the field. OPEN → players can fill it out. LOCKED → no more
        picks. COMPLETE → champion decided.
      </p>

      {/* Seeds */}
      <section className="rounded-xl border border-cardborder bg-card p-5">
        <h2 className="mb-3 font-bold">Seeded field</h2>
        <SeedEditor bracketId={bracket.id} league={bracket.league} values={values} />
      </section>

      {/* Generate */}
      <section className="rounded-xl border border-cardborder bg-card p-5">
        <h2 className="mb-3 font-bold">Matchups</h2>
        <GenerateButton bracketId={bracket.id} />
        <p className="mt-2 text-xs text-muted">
          Rebuild after editing seeds. (This clears existing matchups; do it before
          opening for picks.)
        </p>
      </section>

      {/* Results */}
      {bracket.games.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">Enter results</h2>
          <div className="space-y-2">
            {bracket.games.map((g) => {
              const s = sides.get(g.slot)!;
              const winner = winnerMap.get(g.slot) ?? null;
              return (
                <div
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cardborder bg-card p-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {g.group ? `${g.group} · ` : ""}
                    {g.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <WinnerButton
                      gameId={g.id}
                      entry={s.top}
                      isWinner={!!winner && !!s.top && winner.seed === s.top.seed && (winner.group ?? null) === (s.top.group ?? null)}
                    />
                    <span className="text-xs text-muted">vs</span>
                    <WinnerButton
                      gameId={g.id}
                      entry={s.bottom}
                      isWinner={!!winner && !!s.bottom && winner.seed === s.bottom.seed && (winner.group ?? null) === (s.bottom.group ?? null)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <form action={deleteBracketAction}>
        <input type="hidden" name="bracketId" value={bracket.id} />
        <button
          type="submit"
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
        >
          Delete bracket
        </button>
      </form>
    </main>
  );
}
