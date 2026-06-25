"use client";

import { useState, useTransition } from "react";
import { setPickAction, clearPickAction } from "@/app/games/actions";
import type { PickSide } from "@/generated/prisma/client";

export function PickButtons({
  gameId,
  awayLabel,
  homeLabel,
  awayColor,
  homeColor,
  initialSide,
}: {
  gameId: string;
  awayLabel: string;
  homeLabel: string;
  awayColor: string | null;
  homeColor: string | null;
  initialSide: PickSide | null;
}) {
  const [side, setSide] = useState<PickSide | null>(initialSide);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: PickSide) {
    if (pending) return;
    const prev = side;
    setError(null);

    // Clicking your current pick again removes it.
    if (side === next) {
      setSide(null);
      startTransition(async () => {
        const res = await clearPickAction(gameId);
        if ("error" in res) {
          setSide(prev);
          setError(res.error);
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
      }
    });
  }

  const base =
    "min-w-[96px] rounded-lg border px-3 py-2 text-sm font-bold transition hover:scale-105 active:scale-95 disabled:opacity-60";
  const unselected =
    "border-cardborder text-foreground hover:border-emerald-400";

  function classes(target: PickSide, color: string | null) {
    if (side !== target) return `${base} ${unselected}`;
    // Selected: tint with the team's color when we have one, else emerald.
    return color ? `${base} text-white` : `${base} border-emerald-500 bg-emerald-600 text-white`;
  }
  function style(target: PickSide, color: string | null) {
    if (side === target && color) {
      return { backgroundColor: `#${color}`, borderColor: `#${color}` };
    }
    return undefined;
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
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
