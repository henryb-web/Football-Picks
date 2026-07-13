import Link from "next/link";
import { auth } from "@/auth";

const LEAGUES = [
  { tag: "NFL", title: "Pro", blurb: "Every NFL matchup.", href: "/games?league=NFL" },
  { tag: "CFB", title: "College", blurb: "Power-conference & CFP teams.", href: "/games?league=CFB" },
  { tag: "6A", title: "Texas High School", blurb: "Tracked UIL & TAPPS schools.", href: "/games?league=HS6A" },
];

export default async function Home() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

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
          <h1 className="headline text-7xl sm:text-8xl">
            Pick<span className="text-cyan-500">Six</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Pick your winner for NFL, NCAA, and UIL 6A games
          </p>

          <div className="mt-8 flex justify-center gap-3">
            {loggedIn ? (
              <>
                <Link
                  href="/games"
                  className="pop rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-500"
                >
                  Make your picks
                </Link>
                <Link
                  href="/dashboard"
                  className="pop rounded-lg border border-cardborder px-6 py-3 text-sm font-semibold hover:bg-card"
                >
                  Your dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="pop rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-500"
                >
                  Create an account
                </Link>
                <Link
                  href="/login"
                  className="pop rounded-lg border border-cardborder px-6 py-3 text-sm font-semibold hover:bg-card"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Leagues */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {LEAGUES.map((l) => (
            <Link
              key={l.tag}
              href={l.href}
              className="lift group relative overflow-hidden rounded-2xl border border-cardborder bg-card p-5 hover:border-cyan-500 hover:ring-2 hover:ring-cyan-500/40"
            >
              <span className="headline pointer-events-none absolute -right-1 -top-2 text-6xl text-cyan-500/10 transition group-hover:text-cyan-500/25">
                {l.tag}
              </span>
              <h2 className="headline relative text-2xl">{l.title}</h2>
              <p className="relative mt-1 text-sm text-muted">{l.blurb}</p>
              <span className="relative mt-3 inline-block text-sm font-semibold text-cyan-500 opacity-0 transition group-hover:opacity-100">
                Make picks →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
