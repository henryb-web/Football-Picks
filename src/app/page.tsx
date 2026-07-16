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

const primaryBtn =
  "pop rounded-sm border-2 border-foreground bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-background transition hover:border-accent-600 hover:bg-accent-600 hover:text-white";
const ghostBtn =
  "pop rounded-sm border-2 border-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] transition hover:border-accent-600 hover:bg-accent-600 hover:text-white";

// Monogram for a crest seal: the team's abbreviation, else its initials.
function sealLetters(abbr: string | null, name: string): string {
  if (abbr) return abbr.slice(0, 3).toUpperCase();
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function ProgramSide({
  team,
}: {
  team: { abbreviation: string | null; displayName: string; location: string | null; record: string | null };
}) {
  const sub = [team.location, team.record].filter(Boolean).join(" · ");
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full border-2 border-foreground">
        <span className="headline text-lg leading-none">{sealLetters(team.abbreviation, team.displayName)}</span>
      </div>
      <div className="headline text-base leading-tight sm:text-xl">{team.displayName}</div>
      {sub ? <div className="mt-1 text-sm italic text-muted">{sub}</div> : null}
    </div>
  );
}

function ProgramFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="headline text-[10px] tracking-[0.18em] text-gold">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  // The next kickoff across all leagues, shown as a gameday-program entry.
  const featured = await db.game.findFirst({
    where: { status: "SCHEDULED", kickoff: { gt: new Date() } },
    orderBy: { kickoff: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });
  const tz = await getUserTimeZone();

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cardborder">
        {/* yard-line motif */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-foreground opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 54px, currentColor 54px 56px)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <hr className="mx-auto w-40 border-0 border-t-2 border-foreground" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-gold">
            Weekly Football Pick&apos;em
          </p>
          <h1 className="headline mt-3 text-7xl sm:text-8xl">
            Pick<span className="text-accent-600">Six</span>
          </h1>
          <hr className="rule-gold mx-auto mt-4 w-3/5" />
          <p className="mx-auto mt-6 max-w-xl text-lg italic text-muted">
            Pick your winner for NFL, NCAA, and UIL 6A games.
          </p>

          <div className="mt-9 flex justify-center gap-3">
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

      {/* Next kickoff — program entry */}
      {featured ? (
        <section className="mx-auto w-full max-w-3xl px-6 pt-12">
          <div className="rounded-sm border border-cardborder bg-card px-6 py-9 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              The Next Kickoff
            </p>
            <hr className="rule-gold mx-auto mt-3 w-16" />
            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <ProgramSide team={featured.awayTeam} />
              <div className="headline self-center text-sm tracking-[0.25em] text-accent-600">
                VS
              </div>
              <ProgramSide team={featured.homeTeam} />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-4">
              <ProgramFact label="Kickoff" value={formatGameTime(featured.kickoff, tz)} />
              <ProgramFact label="Date" value={formatGameDate(featured.kickoff, tz)} />
              {featured.homeTeam.venue ? (
                <ProgramFact label="Grounds" value={featured.homeTeam.venue} />
              ) : null}
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/games" className={primaryBtn}>Make your pick</Link>
              <Link href="/games" className={ghostBtn}>All games</Link>
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
              className="lift group relative overflow-hidden rounded-2xl border border-cardborder bg-card p-5 hover:border-accent-500 hover:ring-2 hover:ring-accent-500/40"
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
