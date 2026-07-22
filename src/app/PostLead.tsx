"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SlateGame } from "./FeaturedSlate";

// The Post front page's rotating lead story: the soonest game in each league,
// each written up as its own lead. Auto-advances (pauses on hover / reduced
// motion); edition tabs jump directly. Mirrors FeaturedSlate's rotation.
export function PostLead({
  slate,
  loggedIn,
}: {
  slate: SlateGame[];
  loggedIn: boolean;
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slate.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % slate.length), 7000);
    return () => clearInterval(id);
  }, [slate.length, paused]);

  if (!slate.length) {
    return (
      <>
        <h1 className="pfp-hed">The Slate Is Quiet</h1>
        <p className="pfp-subhed">
          No games on the board right now — check back on gameday.
        </p>
        <div className="pfp-byline">By the PickSix Desk</div>
      </>
    );
  }

  const g = slate[i % slate.length];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slate.length > 1 ? (
        <div className="pfp-tabs">
          {slate.map((s, idx) => (
            <button
              key={s.league}
              type="button"
              onClick={() => setI(idx)}
              aria-pressed={idx === i}
              className="pfp-tab"
            >
              {s.league}
            </button>
          ))}
        </div>
      ) : null}

      <div key={`${g.league}-${i}`} className="animate-modalfade">
        <div className="pfp-kicker">
          {g.league}
          {g.week ? ` · Week ${g.week}` : ""} · Today&apos;s Lead
        </div>
        <h1 className="pfp-hed">
          {g.away.displayName} Visit {g.home.displayName}
        </h1>
        <p className="pfp-subhed">
          Kickoff {g.kickoffTime} · {g.kickoffDate}
          {g.venue ? ` · ${g.venue}` : ""}
        </p>
        <div className="pfp-byline">
          By the PickSix Desk{g.venue ? ` · ${g.venue}` : ""}
        </div>

        <div className="pfp-cols">
          <div>
            <p className="pfp-lede">
              The {g.league} slate features the {g.away.displayName} traveling to
              face the {g.home.displayName}
              {g.venue ? ` at ${g.venue}` : ""}. First whistle is set for{" "}
              {g.kickoffTime} on {g.kickoffDate}, and the room is already weighing
              in.
            </p>
            <p className="pfp-lede">
              Every game on the card counts a single point, straight up — pick the
              winner, no spreads. Make your call before kickoff and watch where you
              land in the standings.
            </p>
            <div className="pfp-photo">
              <div className="pfp-img" aria-hidden="true" />
              <div className="pfp-cap">
                Above: the visitors take the field — file photo.
              </div>
            </div>
          </div>

          <div>
            <div className="pfp-box">
              <div className="pfp-box-hd">On the Card</div>
              <div className="pfp-box-in">
                <div className="pfp-team">{g.away.displayName}</div>
                <div className="pfp-at">— at —</div>
                <div className="pfp-team">{g.home.displayName}</div>
                <Link href={g.leagueHref} className="pfp-cta">
                  {loggedIn ? "Make your picks" : "Create an account"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
