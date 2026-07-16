import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatGameDate, formatGameTime } from "@/lib/format";
import { getUserTimeZone } from "@/lib/user-prefs";
import { FeaturedSlate, type SlateGame } from "./FeaturedSlate";

const LEAGUES = [
  { tag: "NFL", title: "Pro", blurb: "Every NFL matchup.", href: "/games?league=NFL" },
  { tag: "CFB", title: "College", blurb: "Power-conference & CFP teams.", href: "/games?league=CFB" },
  { tag: "6A", title: "Texas High School", blurb: "Tracked UIL 6A teams.", href: "/games?league=HS6A" },
];

// Soonest upcoming game per league, in slate order.
const SLATE_LEAGUES = [
  { key: "NFL" as const, label: "NFL" },
  { key: "CFB" as const, label: "College" },
  { key: "HS6A" as const, label: "Texas HS" },
];

// Solid accent-blue fill with white text.
const primaryBtn =
  "pop rounded-md bg-accent-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-accent-400";
const ghostBtn =
  "pop rounded-md border border-cardborder px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] transition hover:border-accent-500 hover:text-accent-500";

export default async function Home() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);
  const tz = await getUserTimeZone();

  // The soonest upcoming game in each league — the hero rotates through these.
  const slateRaw = await Promise.all(
    SLATE_LEAGUES.map(async (l) => {
      const g = await db.game.findFirst({
        where: { league: l.key, status: "SCHEDULED", kickoff: { gt: new Date() } },
        orderBy: { kickoff: "asc" },
        include: {
          homeTeam: { select: { displayName: true, color: true, logo: true, venue: true } },
          awayTeam: { select: { displayName: true, color: true, logo: true } },
        },
      });
      if (!g) return null;
      return {
        league: l.label,
        leagueHref: `/games?league=${l.key}`,
        week: g.week,
        kickoffTime: formatGameTime(g.kickoff, tz),
        kickoffDate: formatGameDate(g.kickoff, tz),
        venue: g.homeTeam.venue,
        away: { displayName: g.awayTeam.displayName, color: g.awayTeam.color, logo: g.awayTeam.logo },
        home: { displayName: g.homeTeam.displayName, color: g.homeTeam.color, logo: g.homeTeam.logo },
      } satisfies SlateGame;
    }),
  );
  const slate = slateRaw.filter((s): s is SlateGame => s !== null);

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cardborder">
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="mb-5 inline-flex items-center gap-2 border border-accent-500/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-500">
            <span className="inline-block size-1.5 rounded-full bg-accent-500" />
            NFL · College · Texas 6A
          </div>
          <h1 className="headline text-6xl sm:text-8xl">
            Pick<span className="text-accent-500">Six</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Pick your winner for NFL, NCAA, and UIL 6A games.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
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

      {/* This week's slate — rotating soonest game per league */}
      {slate.length > 0 ? (
        <section className="mx-auto w-full max-w-3xl px-6 pt-10">
          <FeaturedSlate slate={slate} />
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
