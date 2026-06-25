import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/auth-actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-cardborder bg-card/80 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          <span className="text-emerald-500">Pick</span>Six
        </Link>

        <nav className="flex items-center gap-4">
          {user ? <NavLink href="/dashboard">Dashboard</NavLink> : null}
          <NavLink href="/games">Games</NavLink>
          <NavLink href="/brackets">Brackets</NavLink>
          <NavLink href="/survivor">Survivor</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/recap">Recap</NavLink>
          {user ? <NavLink href="/my-picks">My Picks</NavLink> : null}
          {user?.isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}

          <ThemeToggle />

          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">
                {user.username ?? user.name ?? user.email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-cardborder px-3 py-1.5 text-sm font-medium transition hover:bg-background"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
