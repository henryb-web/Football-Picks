import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cardborder px-6 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-muted sm:flex-row">
        <nav className="flex gap-4">
          <Link href="/games" className="hover:text-foreground">
            Games
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/brackets" className="hover:text-foreground">
            Brackets
          </Link>
          <Link href="/survivor" className="hover:text-foreground">
            Survivor
          </Link>
        </nav>
      </div>
    </footer>
  );
}
