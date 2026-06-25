import Link from "next/link";
import { auth } from "@/auth";

const LEAGUES = [
  { tag: "NFL", title: "Pro", blurb: "Every NFL matchup.", href: "/games?league=NFL" },
  { tag: "CFB", title: "College", blurb: "Power-conference & CFP teams.", href: "/games?league=CFB" },
  { tag: "6A", title: "Texas High School", blurb: "UIL Class 6A games.", href: "/games?league=HS6A" },
];

export default async function Home() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
          Weekly pick&apos;em &middot; one global leaderboard
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">PickSix</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Make your picks before kickoff. Pro, college, and Texas 6A — compete
          on one leaderboard.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          {loggedIn ? (
            <>
              <Link
                href="/games"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Make your picks
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-cardborder px-5 py-2.5 text-sm font-semibold transition hover:bg-card"
              >
                Your dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-cardborder px-5 py-2.5 text-sm font-semibold transition hover:bg-card"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {LEAGUES.map((l) => (
          <Link
            key={l.tag}
            href={l.href}
            className="lift group rounded-2xl border border-cardborder bg-card p-5 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/40"
          >
            <span className="inline-block rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              {l.tag}
            </span>
            <h2 className="mt-3 text-lg font-bold group-hover:text-emerald-500">{l.title}</h2>
            <p className="mt-1 text-sm text-muted">{l.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
