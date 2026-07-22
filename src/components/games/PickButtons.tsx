"use client";

import { useState, useTransition } from "react";
import {
  setPickAction,
  clearPickAction,
  setPickConfidenceAction,
} from "@/app/games/actions";
import { CONFIDENCE_META } from "@/lib/confidence";
import type { Confidence, PickSide } from "@/generated/prisma/client";

export function PickButtons({
  gameId,
  awayLabel,
  homeLabel,
  awayColor,
  homeColor,
  initialSide,
  initialConfidence,
}: {
  gameId: string;
  awayLabel: string;
  homeLabel: string;
  awayColor: string | null;
  homeColor: string | null;
  initialSide: PickSide | null;
  initialConfidence: Confidence | null;
}) {
  const [side, setSide] = useState<PickSide | null>(initialSide);
  const [confidence, setConfidence] = useState<Confidence | null>(
    initialConfidence,
  );
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function showFlash(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1600);
  }

  function choose(next: PickSide) {
    if (pending) return;
    const prev = side;
    setError(null);

    // Clicking your current pick again removes it (and its confidence).
    if (side === next) {
      setSide(null);
      setConfidence(null);
      startTransition(async () => {
        const res = await clearPickAction(gameId);
        if ("error" in res) {
          setSide(prev);
          setError(res.error);
        } else {
          showFlash("Removed");
        }
      });
      return;
    }

    setSide(next);
    startTransition(async () => {
      const res = await setPickAction(gameId, next);
      if ("error" in res) {
        setSide(prev);
        setError(res.error);
      } else {
        showFlash("Saved ✓");
      }
    });
  }

  function chooseConfidence(next: Confidence | null) {
    if (pending || !side) return;
    const prev = confidence;
    setError(null);
    setConfidence(next);
    startTransition(async () => {
      const res = await setPickConfidenceAction(gameId, next);
      if ("error" in res) {
        setConfidence(prev);
        setError(res.error);
      } else {
        showFlash(next ? `${CONFIDENCE_META[next].label} ✓` : "Cleared");
      }
    });
  }

  const base =
    "pick-btn min-w-[96px] rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:scale-105 active:scale-95 disabled:opacity-60";
  const unselected =
    "border-cardborder text-foreground hover:border-accent-400";

  function classes(target: PickSide, color: string | null) {
    if (side !== target) return `${base} ${unselected}`;
    // Selected: tint with the team's color when we have one, else the accent.
    return color ? `${base} text-white` : `${base} border-accent-500 bg-accent-600 text-white`;
  }
  function style(target: PickSide, color: string | null) {
    if (side === target && color) {
      return { backgroundColor: `#${color}`, borderColor: `#${color}` };
    }
    return undefined;
  }

  // Confidence chips: Normal (untagged) + each tier. Shown only once a side is
  // picked, since confidence rides on top of an existing pick.
  const cChip =
    "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition disabled:opacity-60";
  function cClasses(active: boolean) {
    return active
      ? `${cChip} border-accent-500 bg-accent-600 text-white`
      : `${cChip} border-cardborder text-muted hover:border-accent-400`;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => choose("AWAY")}
          disabled={pending}
          aria-pressed={side === "AWAY"}
          className={classes("AWAY", awayColor)}
          style={style("AWAY", awayColor)}
        >
          {awayLabel}
        </button>
        <button
          type="button"
          onClick={() => choose("HOME")}
          disabled={pending}
          aria-pressed={side === "HOME"}
          className={classes("HOME", homeColor)}
          style={style("HOME", homeColor)}
        >
          {homeLabel}
        </button>
      </div>

      {side ? (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Confidence
          </span>
          <button
            type="button"
            onClick={() => chooseConfidence(null)}
            disabled={pending}
            aria-pressed={confidence === null}
            title="Normal — correct +1, wrong 0"
            className={cClasses(confidence === null)}
          >
            Normal
          </button>
          {(Object.keys(CONFIDENCE_META) as Confidence[]).map((c) => {
            const m = CONFIDENCE_META[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => chooseConfidence(c)}
                disabled={pending}
                aria-pressed={confidence === c}
                title={`${m.label} — correct +${m.win}, wrong ${m.loss}`}
                className={cClasses(confidence === c)}
              >
                {m.emoji} {m.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <span className="text-xs text-red-500">{error}</span>
      ) : flash ? (
        <span className="text-xs font-semibold text-accent-500">{flash}</span>
      ) : null}
    </div>
  );
}
