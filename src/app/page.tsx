import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatGameDate, formatGameTime } from "@/lib/format";
import { getUserTimeZone } from "@/lib/user-prefs";

const LEAGUES = [
  { tag: "NFL", title: "Pro", blurb: "Every NFL matchup.", href: "/games?league=NFL" },
  { tag: "CFB", title: "College", blurb: "Power-conference & CFP teams.", href: "/games?league=CFB" },
  { tag: "6A", title: "Texas High School", blurb: "Tracked UIL 6A teams.", href: "/games?league=HS6A" },
];

// Solid accent-blue fill with white text.
const primaryBtn =
  "pop rounded-md bg-accent-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-accent-400";
const ghostBtn =
  "pop rounded-md border border-cardborder px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] transition hover:border-accent-500 hover:text-accent-500";

type FeaturedTeam = {
  displayName: string;
  location: string | null;
  record: string | null;
  color: string | null;
  venue: string | null;
};

function Chip({ color }: { color: string | null }) {
  return (
    <span
      aria-hidden
      className="size-11 flex-none rounded-[4px] ring-2 ring-white/15"
      style={{ backgroundColor: color ? `#${color}` : "var(--muted)" }}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col">
      <small className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </small>
      <b className="text-sm font-semibold tabular-nums">{value}</b>
    </span>
  );
}

export default async function Home() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  // The next kickoff across all leagues, shown as a broadcast lower-third.
  const featured = await db.game.findFirst({
    where: { status: "SCHEDULED", kickoff: { gt: new Date() } },
    orderBy: { kickoff: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });
  const tz = await getUserTimeZone();

  const meta = (t: FeaturedTeam) => [t.location, t.record].filter(Boolean).join(" · ");

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cardborder">
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="mb-5 inline-flex items-center gap-2 border border-accent-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-500">
            <span className="inline-block size-1.5 rounded-full bg-accent-500" />
            NFL · College · Texas 6A
          </div>
          <h1 className="headline text-7xl sm:text-8xl">
            Pick<span className="text-accent-500">Six</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Pick your winner for NFL, NCAA, and UIL 6A games.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            {loggedIn ? (
              <>
                <Link href="/games" className={primaryBtn}>Make your picks</Link>
                <Link href="/dashboard" className={ghostBtn}>Your dashboard</Link>
              </>
            ) : (
              <>
                <Link href="/signup" className={primaryBtn}>Create an account</Link>
                <Link href="/login" className={ghostBtn}>Log in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Next kickoff — broadcast lower-third */}
      {featured ? (
        <section className="mx-auto w-full max-w-3xl px-6 pt-10">
          <div className="overflow-hidden rounded-lg border border-cardborder bg-card">
            {/* Graphics bar */}
            <div className="flex items-stretch justify-between border-b border-cardborder bg-gradient-to-r from-accent-500/15 to-transparent">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3">
                <Stat label="Kickoff" value={formatGameTime(featured.kickoff, tz)} />
                <Stat label="Date" value={formatGameDate(featured.kickoff, tz)} />
                {featured.homeTeam.venue ? (
                  <Stat label="Venue" value={featured.homeTeam.venue} />
                ) : null}
              </div>
              <span className="flex items-center gap-2 bg-accent-500 px-5 text-xs font-bold uppercase tracking-[0.14em] text-white">
                <span className="inline-block size-2 rounded-full bg-white" />
                Picks Open
              </span>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <div className="flex items-center gap-3 px-5 py-7">
                <Chip color={featured.awayTeam.color} />
                <span className="min-w-0">
                  <span className="headline block text-2xl sm:text-3xl">
                    {featured.awayTeam.displayName}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {meta(featured.awayTeam)}
                  </span>
                </span>
              </div>
              <span className="px-2 font-mono text-xs text-muted">AT</span>
              <div className="flex items-center justify-end gap-3 px-5 py-7 text-right">
                <span className="min-w-0">
                  <span className="headline block text-2xl sm:text-3xl">
                    {featured.homeTeam.displayName}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {meta(featured.homeTeam)}
                  </span>
                </span>
                <Chip color={featured.homeTeam.color} />
              </div>
            </div>

            {/* Pick bar */}
            <div className="grid grid-cols-2 gap-px border-t border-cardborder bg-cardborder">
              <Link
                href="/games"
                className="bg-card px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.1em] transition hover:bg-accent-500 hover:text-white"
              >
                Pick {featured.awayTeam.displayName}
              </Link>
              <Link
                href="/games"
                className="bg-card px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.1em] transition hover:bg-accent-500 hover:text-white"
              >
                Pick {featured.homeTeam.displayName}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Leagues */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {LEAGUES.map((l) => (
            <Link
              key={l.tag}
              href={l.href}
              className="lift group relative overflow-hidden rounded-lg border border-cardborder bg-card p-5 hover:border-accent-500 hover:ring-2 hover:ring-accent-500/40"
            >
              <span className="headline pointer-events-none absolute -right-1 -top-2 text-6xl text-accent-500/10 transition group-hover:text-accent-500/25">
                {l.tag}
              </span>
              <h2 className="headline relative text-2xl">{l.title}</h2>
              <p className="relative mt-1 text-sm text-muted">{l.blurb}</p>
              <span className="relative mt-3 inline-block text-sm font-semibold text-accent-500 opacity-0 transition group-hover:opacity-100">
                Make picks →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
