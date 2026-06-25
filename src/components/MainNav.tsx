"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  ListChecks,
  GitMerge,
  Skull,
  Trophy,
  CalendarDays,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/lib/auth-actions";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  auth?: boolean;
  admin?: boolean;
};

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
  { href: "/games", label: "Games", icon: ListChecks },
  { href: "/brackets", label: "Brackets", icon: GitMerge },
  { href: "/survivor", label: "Survivor", icon: Skull },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/recap", label: "Recap", icon: CalendarDays },
  { href: "/my-picks", label: "My Picks", icon: ClipboardList, auth: true },
  { href: "/admin", label: "Admin", icon: Settings, admin: true },
];

export function MainNav({
  user,
}: {
  user: { name: string; isAdmin: boolean } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = ITEMS.filter(
    (i) => (!i.auth || user) && (!i.admin || user?.isAdmin),
  );
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-20 border-b border-cardborder bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-6 py-3">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((i) => {
              const active = isActive(i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition hover:scale-105 ${
                    active
                      ? "bg-emerald-600/15 text-emerald-500 ring-1 ring-emerald-500/40"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <i.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{i.label}</span>
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />

          {/* Desktop auth */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="max-w-[120px] truncate text-sm text-muted">
                  {user.name}
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
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cardborder text-muted md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-cardborder px-6 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {items.map((i) => {
              const active = isActive(i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium ${
                    active ? "bg-emerald-600/15 text-emerald-500" : "text-muted"
                  }`}
                >
                  <i.icon className="h-4 w-4" />
                  {i.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 border-t border-cardborder pt-3">
            {user ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-cardborder px-3 py-2 text-sm font-medium"
                >
                  Sign out · {user.name}
                </button>
              </form>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-cardborder px-3 py-2 text-center text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
