import Link from "next/link";

const LEAGUES = [
  {
    tag: "NFL",
    title: "Pro",
    blurb: "Every NFL matchup, picked against the spread.",
    href: "/games?league=NFL",
  },
  {
    tag: "CFB",
    title: "College",
    blurb: "FBS matchups and the road to the 12-team Playoff, against the spread.",
    href: "/games?league=CFB",
  },
  {
    tag: "6A",
    title: "Texas High School",
    blurb: "UIL Class 6A games — straight-up winner picks.",
    href: "/games?league=HS6A",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Weekly pick&apos;em &middot; one global leaderboard
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
          PickSix
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-500">
          Make your picks before kickoff. Pro, college, and Texas 6A — with live
          spreads and odds where they exist.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {LEAGUES.map((l) => (
          <Link
            key={l.tag}
            href={l.href}
            className="group rounded-2xl border border-neutral-200 p-5 transition hover:border-emerald-500 hover:shadow-md hover:ring-2 hover:ring-emerald-500/40 dark:border-neutral-800 dark:hover:border-emerald-500"
          >
            <span className="inline-block rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
              {l.tag}
            </span>
            <h2 className="mt-3 text-lg font-bold group-hover:text-emerald-600">
              {l.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{l.blurb}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-emerald-600 opacity-0 transition group-hover:opacity-100">
              Make picks →
            </span>
          </Link>
        ))}
      </div>

      <p className="text-sm text-neutral-400">
        Coming soon — sign in to start picking.
      </p>
    </main>
  );
}
