"use client";

import { useEffect } from "react";
import {
  X,
  MapPin,
  CalendarDays,
  Clock,
  Lock,
  Scale,
  Sigma,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatGameDate, formatGameTime } from "@/lib/format";
import { TeamLogo } from "./TeamLogo";
import { LockCountdown } from "./LockCountdown";
import { PickButtons } from "./PickButtons";
import type { GameCardData, GameCardTeam } from "./GameCard";
import type { League, PickSide } from "@/generated/prisma/client";

// What `grouping` means per league (see the Team model comment).
function groupingLabel(league: League): string {
  if (league === "CFB") return "Conference";
  if (league === "NFL") return "Division";
  return "District";
}

function statusText(game: GameCardData, locked: boolean): string {
  if (game.status === "FINAL") return "Final";
  if (game.status === "IN_PROGRESS") return "Live";
  return locked ? "Locked" : "Scheduled";
}

export function GameModal({
  game,
  pick,
  consensus,
  locked,
  loggedIn,
  tz = "America/Chicago",
  onClose,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
}: {
  game: GameCardData;
  pick: PickSide | null;
  consensus: { home: number; away: number };
  locked: boolean;
  loggedIn: boolean;
  tz?: string;
  onClose: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  // Close on Escape, step between games with the arrow keys, and lock
  // background scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
      else if (e.key === "ArrowRight" && hasNext) onNext?.();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const kickoff = new Date(game.kickoffISO);
  const hasScore = game.status === "FINAL" || game.status === "IN_PROGRESS";
  const total = consensus.home + consensus.away;
  const awayPct = total ? Math.round((consensus.away / total) * 100) : 0;
  const homePct = total ? 100 - awayPct : 0;
  const pickLabel =
    pick === "HOME"
      ? game.homeTeam.name
      : pick === "AWAY"
        ? game.awayTeam.name
        : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${game.awayTeam.displayName} at ${game.homeTeam.displayName}`}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Sized to the modal so the arrows hug its edges (~an inch out on
          desktop); on mobile the sheet is full-width so they tuck inside. */}
      <div className="relative w-full max-w-lg">
        {hasPrev ? (
          <button
            type="button"
            aria-label="Previous game"
            onClick={(e) => {
              e.stopPropagation();
              onPrev?.();
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cyan-500/25 bg-card/95 p-2 text-cyan-500/70 shadow-lg backdrop-blur transition hover:border-cyan-500/60 hover:bg-card hover:text-cyan-500 sm:left-auto sm:right-full sm:mr-4 lg:mr-16"
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        {hasNext ? (
          <button
            type="button"
            aria-label="Next game"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cyan-500/25 bg-card/95 p-2 text-cyan-500/70 shadow-lg backdrop-blur transition hover:border-cyan-500/60 hover:bg-card hover:text-cyan-500 sm:right-auto sm:left-full sm:ml-4 lg:ml-16"
          >
            <ChevronRight className="size-6" />
          </button>
        ) : null}
        <div
          className="relative w-full rounded-t-2xl border border-cardborder bg-card p-5 shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted transition hover:bg-background hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {/* Body — keyed by game id so it cross-fades when navigating. */}
        <div key={game.id} className="animate-modalfade">
        {/* Header: league · week · season */}
        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-500">
          {LEAGUE_LABELS[game.league]}
          {game.week ? ` · Week ${game.week}` : ""} · {game.season}
        </div>

        {/* Matchup */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <TeamSide team={game.awayTeam} score={hasScore ? game.awayScore : null} />
          <span className="shrink-0 text-sm font-semibold text-muted">@</span>
          <TeamSide team={game.homeTeam} score={hasScore ? game.homeScore : null} align="right" />
        </div>

        <div className="mt-3 flex justify-center">
          <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
            {statusText(game, locked)}
          </span>
        </div>

        {/* Facts */}
        <dl className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-cardborder bg-cardborder sm:grid-cols-2">
          <Fact icon={<CalendarDays className="size-4" />} label="Date" value={formatGameDate(kickoff, tz)} />
          <Fact icon={<Clock className="size-4" />} label="Kickoff" value={formatGameTime(kickoff, tz)} />
          <Fact
            icon={<MapPin className="size-4" />}
            label="Location"
            value={game.venueLabel ?? "TBD"}
          />
          <Fact
            icon={<Lock className="size-4" />}
            label="Pick choice"
            value={
              locked ? (
                "Locked"
              ) : (
                <LockCountdown lockAt={game.pickLockISO} />
              )
            }
          />
          {game.spread ? (
            <Fact icon={<Scale className="size-4" />} label="Spread" value={game.spread} />
          ) : null}
          {game.overUnder != null ? (
            <Fact
              icon={<Sigma className="size-4" />}
              label="Over / Under"
              value={String(game.overUnder)}
            />
          ) : null}
        </dl>

        {/* Per-team detail */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <TeamDetail team={game.awayTeam} league={game.league} label="Away" />
          <TeamDetail team={game.homeTeam} league={game.league} label="Home" />
        </div>

        {/* Pool consensus */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
            <span>Pool consensus</span>
            <span className="font-normal normal-case">
              {total} pick{total === 1 ? "" : "s"}
            </span>
          </div>
          {total === 0 ? (
            <p className="text-sm text-muted">No picks yet.</p>
          ) : (
            <>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-cardborder">
                <div
                  style={{
                    width: `${awayPct}%`,
                    backgroundColor: game.awayTeam.color ? `#${game.awayTeam.color}` : "var(--muted)",
                  }}
                />
                <div
                  style={{
                    width: `${homePct}%`,
                    backgroundColor: game.homeTeam.color ? `#${game.homeTeam.color}` : "var(--muted)",
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>
                  {awayPct}% {game.awayTeam.name}
                </span>
                <span>
                  {game.homeTeam.name} {homePct}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Your pick */}
        {loggedIn ? (
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Your pick
            </div>
            {locked ? (
              <div className="rounded-lg bg-background px-3 py-2 text-sm">
                {pickLabel ? (
                  <span className="font-semibold text-foreground">{pickLabel}</span>
                ) : (
                  <span className="text-muted">You didn&apos;t pick this game.</span>
                )}
              </div>
            ) : (
              <PickButtons
                gameId={game.id}
                awayLabel={game.awayTeam.name}
                homeLabel={game.homeTeam.name}
                awayColor={game.awayTeam.color}
                homeColor={game.homeTeam.color}
                initialSide={pick}
              />
            )}
          </div>
        ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}

function TeamSide({
  team,
  score,
  align = "left",
}: {
  team: GameCardTeam;
  score: number | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo logo={team.logo} color={team.color} size={36} name={team.displayName} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{team.displayName}</div>
        {team.record ? (
          <div className="text-xs text-muted">{team.record}</div>
        ) : null}
        {score != null ? (
          <div className="font-display text-2xl font-semibold tabular-nums">{score}</div>
        ) : null}
      </div>
    </div>
  );
}

function TeamDetail({
  team,
  league,
  label,
}: {
  team: GameCardTeam;
  league: League;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-cardborder p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold">{team.displayName}</div>
      {team.record ? (
        <div className="mt-1 text-xs text-muted">Record: {team.record}</div>
      ) : null}
      {team.lastGame ? (
        <div className="mt-1 text-xs text-muted">
          Last:{" "}
          <span
            className={
              team.lastGame.result === "W"
                ? "font-semibold text-cyan-500"
                : team.lastGame.result === "L"
                  ? "font-semibold text-red-500"
                  : "font-semibold text-foreground"
            }
          >
            {team.lastGame.result}
          </span>{" "}
          {team.lastGame.teamScore}–{team.lastGame.oppScore}{" "}
          {team.lastGame.home ? "vs" : "@"} {team.lastGame.opponent}
        </div>
      ) : null}
      {team.grouping ? (
        <div className="mt-1 text-xs text-muted">
          {groupingLabel(league)}: {team.grouping}
        </div>
      ) : null}
      {team.location ? (
        <div className="text-xs text-muted">{team.location}</div>
      ) : null}
      {team.seasonSummary ? (
        <div className="mt-2 border-t border-cardborder pt-2">
          {team.seasonSummary.record ? (
            <div className="text-[11px] text-muted">
              {team.seasonSummary.season} season:{" "}
              <span className="font-semibold text-foreground">
                {team.seasonSummary.record}
              </span>
            </div>
          ) : null}
          {team.seasonSummary.postseason?.map((p, i) => (
            <div key={i} className="mt-1 text-[11px] leading-tight text-muted">
              <span
                className={
                  p.result === "W"
                    ? "font-semibold text-cyan-500"
                    : p.result === "L"
                      ? "font-semibold text-red-500"
                      : "font-semibold text-foreground"
                }
              >
                {p.result}
              </span>{" "}
              {p.teamScore}–{p.oppScore} vs {p.opponent}
              <div className="text-[10px]">{p.name}</div>
            </div>
          ))}
          {team.seasonSummary.leaders.map((l) => (
            <div key={l.cat} className="mt-1 text-[11px] leading-tight text-muted">
              <span className="font-semibold text-cyan-500">{l.cat}</span>{" "}
              <span className="font-semibold text-foreground">
                {l.pos ? `${l.pos} ` : ""}
                {l.name}
              </span>
              <div className="text-[10px]">{l.stat}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 bg-card px-3 py-2.5">
      <span className="mt-0.5 text-cyan-500">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
