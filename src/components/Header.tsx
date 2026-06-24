import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/auth-actions";

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <Link href="/" className="text-lg font-black tracking-tight">
        🏈 Football Picks
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <span className="text-neutral-500">
              {user.username ?? user.name ?? user.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="font-medium hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
