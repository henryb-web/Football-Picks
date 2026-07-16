"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TeamLogo } from "@/components/games/TeamLogo";

type FavSide = {
  displayName: string;
  color: string | null;
  logo: string | null;
  isFav: boolean;
};

export type FavGame = {
  id: string;
  league: string;
  week: number | null;
  kickoffLabel: string;
  venue: string | null;
  favName: string;
  away: FavSide;
  home: FavSide;
};

function Side({ team, right = false }: { team: FavSide; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
      <TeamLogo logo={team.logo} color={team.color} name={team.displayName} size={30} />
      <div className="min-w-0">
        <div className="headline truncate text-base leading-tight sm:text-lg">
          {team.displayName}
        </div>
        {team.isFav ? (
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-500">
            ★ Your team
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Rotates through the soonest upcoming games across a user's favorite teams.
export function FavoriteGamesCard({ games }: { games: FavGame[] }) {
  const [i, setI] = useState(0);
  const g = games[Math.min(i, games.length - 1)];
  if (!g) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-cardborder bg-card">
      {/* Graphics bar + rotate controls */}
      <div className="flex items-center justify-between border-b border-cardborder bg-gradient-to-r from-accent-500/15 to-transparent px-4 py-2.5">
        <span className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-accent-500">
          {g.favName}
        </span>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            aria-label="Previous game"
            disabled={i === 0}
            onClick={() => setI((n) => Math.max(0, n - 1))}
            className="rounded-full border border-cardborder p-1 text-muted transition hover:border-accent-500 hover:text-accent-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-cardborder disabled:hover:text-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-mono text-xs tabular-nums text-muted">
            {i + 1} / {games.length}
          </span>
          <button
            type="button"
            aria-label="Next game"
            disabled={i >= games.length - 1}
            onClick={() => setI((n) => Math.min(games.length - 1, n + 1))}
            className="rounded-full border border-cardborder p-1 text-muted transition hover:border-accent-500 hover:text-accent-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-cardborder disabled:hover:text-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Matchup */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-5">
        <Side team={g.away} />
        <span className="px-1 font-mono text-xs text-muted">AT</span>
        <Side team={g.home} right />
      </div>

      {/* Meta + link */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cardborder px-4 py-2.5 text-xs text-muted">
        <span className="tabular-nums">
          {g.league}
          {g.week ? ` · Wk ${g.week}` : ""} · {g.kickoffLabel}
          {g.venue ? ` · ${g.venue}` : ""}
        </span>
        <Link
          href={`/games?team=${encodeURIComponent(g.favName)}`}
          className="font-semibold text-accent-500 hover:underline"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
