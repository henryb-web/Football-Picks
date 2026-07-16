import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import {
  indexEntries,
  resolveSides,
  sameRef,
  type ResolvedEntry,
  type SeedRef,
} from "@/lib/bracket/resolve";
import { getBracketStandings } from "@/lib/bracket/scoring";
import { BracketPickButtons } from "@/components/brackets/BracketPickButtons";
import { Page } from "@/components/ui/Page";
import { Avatar } from "@/components/Avatar";

function Chip({
  entry,
  picked,
  result,
}: {
  entry: ResolvedEntry | null;
  picked: boolean;
  result: "win" | "loss" | null;
}) {
  return (
    <div
      className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${
        picked
          ? result === "win"
            ? "border-accent-500 bg-accent-600 text-white"
            : result === "loss"
              ? "border-red-500 bg-red-600/80 text-white"
              : "border-accent-500 bg-accent-500/15"
          : "border-cardborder text-muted"
      }`}
    >
      {entry ? (
        <>
          <span className="text-xs opacity-70">{entry.seed}</span> {entry.displayName}
          {picked && result === "win" ? " ✓" : ""}
          {picked && result === "loss" ? " ✗" : ""}
        </>
      ) : (
        "TBD"
      )}
    </div>
  );
}

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const bracket = await db.bracket.findUnique({
    where: { id },
    include: { entries: true, games: { orderBy: { slot: "asc" } } },
  });
  if (!bracket || bracket.status === "SETUP") notFound();

  const idx = indexEntries(bracket.entries);

  // Actual results (for showing who really won / grading).
  const actualWinner = new Map<number, SeedRef>();
  for (const g of bracket.games) {
    if (g.winnerSeed != null) actualWinner.set(g.slot, { seed: g.winnerSeed, group: g.winnerGroup });
  }

  // The viewer's picks.
  const slotByGameId = new Map(bracket.games.map((g) => [g.id, g.slot]));
  const myPick = new Map<number, SeedRef>();
  if (userId) {
    const picks = await db.bracketPick.findMany({
      where: { userId, bracketGameId: { in: bracket.games.map((g) => g.id) } },
    });
    for (const p of picks) {
      myPick.set(slotByGameId.get(p.bracketGameId)!, { seed: p.predSeed, group: p.predGroup });
    }
  }

  // Participants shown: a logged-in viewer sees their own predicted bracket;
  // otherwise the real bracket as results come in.
  const sides = resolveSides(
    bracket.games,
    idx,
    userId ? (slot) => myPick.get(slot) ?? null : (slot) => actualWinner.get(slot) ?? null,
  );

  const editable = bracket.status === "OPEN" && !!userId;
  const standings = await getBracketStandings(bracket.id);

  // Group games by round (in slot order).
  const rounds: { round: number; label: string; games: typeof bracket.games }[] = [];
  for (const g of bracket.games) {
    let r = rounds.find((x) => x.round === g.round);
    if (!r) {
      r = { round: g.round, label: g.label, games: [] };
      rounds.push(r);
    }
    r.games.push(g);
  }
  rounds.sort((a, b) => a.round - b.round);

  return (
    <Page>
      <Link href="/brackets" className="text-sm text-accent-500 hover:underline">
        ← All brackets
      </Link>
      <h1 className="headline mt-2 text-4xl">{bracket.title}</h1>
      <p className="mt-1 text-sm text-muted">
        <span className="font-semibold text-accent-500">{LEAGUE_LABELS[bracket.league]}</span>{" "}
        · {bracket.season} ·{" "}
        {bracket.status === "OPEN"
          ? "open — pick away"
          : bracket.status === "LOCKED"
            ? "locked"
            : "final"}
      </p>

      {!userId ? (
        <p className="mt-4 rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold text-accent-500 underline">
            Log in
          </Link>{" "}
          to fill out this bracket.
        </p>
      ) : null}

      <div className="mt-6 space-y-7">
        {rounds.map((r) => (
          <section key={r.round}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
              {r.label}
            </h2>
            <div className="space-y-2">
              {r.games.map((g) => {
                const s = sides.get(g.slot)!;
                const pick = myPick.get(g.slot) ?? null;
                const actual = actualWinner.get(g.slot) ?? null;
                const resultFor = (e: ResolvedEntry | null): "win" | "loss" | null => {
                  if (!actual || !pick || !e || !sameRef(pick, e)) return null;
                  return sameRef(pick, actual) ? "win" : "loss";
                };
                return (
                  <div
                    key={g.id}
                    className="rounded-xl border border-cardborder bg-card p-3"
                  >
                    {g.group ? (
                      <div className="mb-1.5 text-xs font-semibold text-muted">{g.group}</div>
                    ) : null}
                    {editable ? (
                      <BracketPickButtons
                        bracketId={bracket.id}
                        gameId={g.id}
                        top={s.top}
                        bottom={s.bottom}
                        currentSeed={pick?.seed ?? null}
                        currentGroup={pick?.group ?? null}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <Chip entry={s.top} picked={sameRef(pick, s.top)} result={resultFor(s.top)} />
                        <Chip entry={s.bottom} picked={sameRef(pick, s.bottom)} result={resultFor(s.bottom)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {standings.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-2 text-lg font-bold">Bracket standings</h2>
          <div className="divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
            {standings.map((row, i) => (
              <div
                key={row.userId}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  row.userId === userId ? "bg-accent-500/10" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-muted">{i + 1}</span>
                  <Avatar name={row.name} size={22} />
                  {row.name}
                </span>
                <span className="font-bold tabular-nums">
                  {row.points} pts <span className="font-normal text-muted">· {row.correct} correct</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Page>
  );
}
