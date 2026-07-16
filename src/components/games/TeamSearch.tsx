"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import type { League } from "@/generated/prisma/client";

type Preview = {
  id: string;
  league: League;
  week: number | null;
  kickoffISO: string;
  home: string;
  away: string;
};

// Search box on the Games page. Shows a live preview of matching games as you
// type; submitting (Enter, or clicking a preview) shows every game the team
// plays via /games?team=<query> (keeping the current league).
export function TeamSearch({
  league,
  initialQuery,
}: {
  league: string | null;
  initialQuery: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<Preview[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // Only preview in response to real typing — not on load or after a submit
  // (both leave the query pre-filled, which would otherwise reopen the popup).
  const typedRef = useRef(false);

  function go(query: string) {
    setOpen(false);
    typedRef.current = false;
    const params = new URLSearchParams();
    if (league) params.set("league", league);
    if (query.trim()) params.set("team", query.trim());
    const qs = params.toString();
    router.push(qs ? `/games?${qs}` : "/games");
  }

  // Debounced typeahead fetch. Cancels stale requests.
  useEffect(() => {
    if (!typedRef.current) return;
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        if (league) params.set("league", league);
        const res = await fetch(`/api/games/search?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { games: Preview[] };
        setResults(data.games);
        setOpen(true);
      } catch {
        /* aborted or network error — ignore */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, league]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative mt-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            typedRef.current = true;
            setQ(e.target.value);
          }}
          onFocus={() => {
            if (typedRef.current && results.length) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search a team…"
          aria-label="Search a team"
          className="w-full rounded-lg border border-cardborder bg-card py-2 pl-9 pr-9 text-sm outline-none transition focus:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500/40"
        />
        {q ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              setResults([]);
              go("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      {showDropdown ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-cardborder bg-card shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted">
              No games match &ldquo;{q.trim()}&rdquo;.
            </div>
          ) : (
            <ul>
              {results.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => go(q)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-background"
                  >
                    <span className="min-w-0 truncate">
                      {g.away} <span className="text-muted">@</span> {g.home}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {LEAGUE_LABELS[g.league]}
                      {g.week ? ` · Wk ${g.week}` : ""} ·{" "}
                      {formatKickoff(new Date(g.kickoffISO))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
