"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/games/TeamLogo";

type SlateSide = { displayName: string; color: string | null; logo: string | null };

export type SlateGame = {
  league: string;
  leagueHref: string;
  week: number | null;
  kickoffTime: string;
  kickoffDate: string;
  venue: string | null;
  away: SlateSide;
  home: SlateSide;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col">
      <small className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </small>
      <b className="text-sm font-semibold tabular-nums">{value}</b>
    </span>
  );
}

// The home hero's rotating "slate": the soonest upcoming game in each league,
// auto-advancing every few seconds (pauses on hover / reduced-motion), with
// league tabs to jump directly.
export function FeaturedSlate({ slate }: { slate: SlateGame[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slate.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % slate.length), 6000);
    return () => clearInterval(id);
  }, [slate.length, paused]);

  if (!slate.length) return null;
  const g = slate[i % slate.length];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slate.length > 1 ? (
        <div className="mb-3 flex justify-center gap-2">
          {slate.map((s, idx) => (
            <button
              key={s.league}
              type="button"
              onClick={() => setI(idx)}
              aria-pressed={idx === i}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] transition ${
                idx === i
                  ? "bg-accent-500 text-white"
                  : "border border-cardborder text-muted hover:border-accent-500 hover:text-accent-500"
              }`}
            >
              {s.league}
            </button>
          ))}
        </div>
      ) : null}

      <div
        key={`${g.league}-${i}`}
        className="animate-modalfade overflow-hidden rounded-lg border border-cardborder bg-card"
      >
        {/* Graphics bar */}
        <div className="flex items-stretch justify-between border-b border-cardborder bg-gradient-to-r from-accent-500/15 to-transparent">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3">
            <Stat label="Kickoff" value={g.kickoffTime} />
            <Stat label="Date" value={g.kickoffDate} />
            {g.venue ? <Stat label="Venue" value={g.venue} /> : null}
          </div>
          <span className="flex items-center gap-2 bg-accent-500 px-5 text-xs font-bold uppercase tracking-[0.14em] text-white">
            <span className="inline-block size-2 rounded-full bg-white" />
            Picks Open
          </span>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-3 px-5 py-7">
            <TeamLogo logo={g.away.logo} color={g.away.color} name={g.away.displayName} size={44} />
            <span className="headline block text-2xl sm:text-3xl">{g.away.displayName}</span>
          </div>
          <span className="px-2 font-mono text-xs text-muted">AT</span>
          <div className="flex items-center justify-end gap-3 px-5 py-7 text-right">
            <span className="headline block text-2xl sm:text-3xl">{g.home.displayName}</span>
            <TeamLogo logo={g.home.logo} color={g.home.color} name={g.home.displayName} size={44} />
          </div>
        </div>

        {/* Pick bar */}
        <div className="grid grid-cols-2 gap-px border-t border-cardborder bg-cardborder">
          <Link
            href={g.leagueHref}
            className="bg-card px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.1em] transition hover:bg-accent-500 hover:text-white"
          >
            Pick {g.away.displayName}
          </Link>
          <Link
            href={g.leagueHref}
            className="bg-card px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.1em] transition hover:bg-accent-500 hover:text-white"
          >
            Pick {g.home.displayName}
          </Link>
        </div>
      </div>
    </div>
  );
}
