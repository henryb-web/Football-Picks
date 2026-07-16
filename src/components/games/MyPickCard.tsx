"use client";

import { useState } from "react";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { TeamLogo } from "./TeamLogo";
import { GameModal } from "./GameModal";
import type { GameCardData } from "./GameCard";
import type { PickResult, PickSide } from "@/generated/prisma/client";

const RESULT_BADGE: Record<PickResult, { label: string; className: string }> = {
  WIN: { label: "Win", className: "bg-accent-600 text-white" },
  LOSS: { label: "Loss", className: "bg-red-600 text-white" },
  PUSH: { label: "Push", className: "bg-neutral-500 text-white" },
  VOID: { label: "Void", className: "bg-neutral-600 text-white" },
  PENDING: { label: "Pending", className: "bg-background text-muted" },
};

// A ticket-stub row for one of the user's picks. Clicking it opens the same
// game detail modal used on the Games page.
export function MyPickCard({
  game,
  side,
  result,
  consensus,
  locked,
  loggedIn,
  tz = "America/Chicago",
}: {
  game: GameCardData;
  side: PickSide;
  result: PickResult;
  consensus: { home: number; away: number };
  locked: boolean;
  loggedIn: boolean;
  tz?: string;
}) {
  const [open, setOpen] = useState(false);
  const picked = side === "HOME" ? game.homeTeam : game.awayTeam;
  const badge = RESULT_BADGE[result];
  const kickoff = new Date(game.kickoffISO);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="lift relative flex cursor-pointer overflow-hidden rounded-xl border border-cardborder bg-card text-left transition hover:border-accent-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        {/* picked-team color edge */}
        <span
          aria-hidden
          className="w-1.5 shrink-0"
          style={{ backgroundColor: picked.color ? `#${picked.color}` : "var(--muted)" }}
        />
        {/* the matchup + pick */}
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center gap-2">
            <TeamLogo logo={picked.logo} color={picked.color} size={22} name={picked.displayName} />
            <span className="headline text-lg">{picked.displayName}</span>
          </div>
          <div className="mt-1 text-xs text-muted">
            <span className="font-semibold text-accent-500">
              {LEAGUE_LABELS[game.league]}
            </span>
            {game.week ? ` · Wk ${game.week}` : ""} ·{" "}
            {game.awayTeam.name} @ {game.homeTeam.name} · {formatKickoff(kickoff, tz)}
            {game.status === "FINAL"
              ? ` · Final ${game.awayScore}–${game.homeScore}`
              : ""}
          </div>
        </div>
        {/* perforated result stub */}
        <div className="relative flex w-28 shrink-0 items-center justify-center border-l border-dashed border-cardborder">
          <span className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-background" />
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {open ? (
        <GameModal
          game={game}
          pick={side}
          consensus={consensus}
          locked={locked}
          loggedIn={loggedIn}
          tz={tz}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
