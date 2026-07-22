"use client";

import { MapPin } from "lucide-react";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { PickButtons } from "./PickButtons";
import { TeamLogo } from "./TeamLogo";
import { LockCountdown } from "./LockCountdown";
import { ConsensusBar } from "./ConsensusBar";
import { CONFIDENCE_META } from "@/lib/confidence";
import type { Confidence, League, GameStatus, PickSide } from "@/generated/prisma/client";

// A prior-season snapshot (NFL/CFB): record + key statistical leaders.
export type SeasonLeader = {
  cat: string;
  name: string;
  pos: string | null;
  stat: string;
};
export type PostseasonGame = {
  name: string;
  result: "W" | "L" | "T";
  teamScore: number;
  oppScore: number;
  opponent: string;
};
export type SeasonSummary = {
  season: number;
  record: string | null;
  leaders: SeasonLeader[];
  postseason?: PostseasonGame[];
};

// A team's most recent completed game (from this team's perspective).
export type LastGameSummary = {
  result: "W" | "L" | "T";
  teamScore: number;
  oppScore: number;
  opponent: string;
  home: boolean;
  kickoffISO: string;
};

// Serializable slice of a game + its teams, shared by the card and its modal.
export type GameCardTeam = {
  name: string;
  displayName: string;
  abbreviation: string | null;
  location: string | null;
  venue: string | null;
  grouping: string | null;
  color: string | null;
  altColor: string | null;
  logo: string | null;
  record: string | null;
  lastGame: LastGameSummary | null;
  seasonSummary: SeasonSummary | null;
};

export type GameCardData = {
  id: string;
  league: League;
  season: number;
  week: number | null;
  kickoffISO: string;
  pickLockISO: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  venueLabel: string | null;
  spread: string | null;
  overUnder: number | null;
  homeTeam: GameCardTeam;
  awayTeam: GameCardTeam;
};

export function GameCard({
  game,
  pick,
  confidence,
  consensus,
  loggedIn,
  locked,
  tz = "America/Chicago",
  onOpen,
}: {
  game: GameCardData;
  pick: PickSide | null;
  confidence: Confidence | null;
  consensus: { home: number; away: number };
  loggedIn: boolean;
  locked: boolean;
  tz?: string;
  onOpen: () => void;
}) {
  const isFinal = game.status === "FINAL";
  const pickLabel =
    pick === "HOME"
      ? game.homeTeam.name
      : pick === "AWAY"
        ? game.awayTeam.name
        : null;
  const awayC = game.awayTeam.color ?? "3b4252";
  const homeC = game.homeTeam.color ?? "3b4252";
  const kickoff = new Date(game.kickoffISO);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="lift relative cursor-pointer overflow-hidden rounded-xl border border-cardborder bg-card p-4 pl-5 text-left transition hover:border-accent-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{
            background: `linear-gradient(to bottom, #${awayC} 0 50%, #${homeC} 50% 100%)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            background: `linear-gradient(110deg, #${awayC}, transparent 42%, transparent 58%, #${homeC})`,
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="headline flex flex-wrap items-center gap-x-2 gap-y-0.5 text-base sm:text-lg">
              <TeamLogo logo={game.awayTeam.logo} color={game.awayTeam.color} name={game.awayTeam.displayName} />
              {game.awayTeam.displayName}
              <span className="font-sans text-xs lowercase text-muted">@</span>
              <TeamLogo logo={game.homeTeam.logo} color={game.homeTeam.color} name={game.homeTeam.displayName} />
              {game.homeTeam.displayName}
            </div>
            <div className="mt-1 text-xs text-muted">
              <span className="font-semibold text-accent-500">
                {LEAGUE_LABELS[game.league]}
              </span>
              {game.week ? ` · Wk ${game.week}` : ""} · {formatKickoff(kickoff, tz)}
              {game.venueLabel ? (
                <span className="ml-1 inline-flex items-center gap-0.5">
                  <MapPin className="inline size-3 -translate-y-px" aria-hidden />
                  {game.venueLabel}
                </span>
              ) : null}
              {!locked ? (
                <>
                  {" · "}
                  <LockCountdown lockAt={game.pickLockISO} />
                </>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            {loggedIn && !locked ? (
              // Stop clicks on the pick buttons from also opening the modal.
              <div onClick={(e) => e.stopPropagation()}>
                <PickButtons
                  gameId={game.id}
                  awayLabel={game.awayTeam.name}
                  homeLabel={game.homeTeam.name}
                  awayColor={game.awayTeam.color}
                  homeColor={game.homeTeam.color}
                  initialSide={pick}
                  initialConfidence={confidence}
                />
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1 text-right">
                {isFinal ? (
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    {game.awayScore}
                    <span className="mx-1 text-muted">–</span>
                    {game.homeScore}
                  </span>
                ) : (
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
                    {game.status === "IN_PROGRESS"
                      ? "Live"
                      : locked
                        ? "Locked"
                        : "Scheduled"}
                  </span>
                )}
                {pickLabel ? (
                  <span className="text-xs text-muted">
                    Your pick:{" "}
                    <span className="font-semibold text-foreground">
                      {pickLabel}
                    </span>
                    {confidence ? (
                      <span
                        className="ml-1"
                        title={`${CONFIDENCE_META[confidence].label} — correct +${CONFIDENCE_META[confidence].win}, wrong ${CONFIDENCE_META[confidence].loss}`}
                      >
                        {CONFIDENCE_META[confidence].emoji}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <ConsensusBar
          awayCount={consensus.away}
          homeCount={consensus.home}
          awayColor={game.awayTeam.color}
          homeColor={game.homeTeam.color}
        />
      </div>
  );
}
