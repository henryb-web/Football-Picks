"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Header nav link that boxes itself when you're on that tab.
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = href.split("?")[0];
  const active =
    base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(`${base}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2 py-1 text-sm font-medium transition ${
        active
          ? "bg-emerald-600/15 text-emerald-500 ring-1 ring-emerald-500/40"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
