"use client";

import { useState, useTransition } from "react";
import { setPickAction } from "@/app/games/actions";
import type { PickSide } from "@/generated/prisma/client";

export function PickButtons({
  gameId,
  awayLabel,
  homeLabel,
  initialSide,
}: {
  gameId: string;
  awayLabel: string;
  homeLabel: string;
  initialSide: PickSide | null;
}) {
  const [side, setSide] = useState<PickSide | null>(initialSide);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: PickSide) {
    if (pending) return;
    const prev = side;
    setError(null);
    setSide(next); // optimistic
    startTransition(async () => {
      const res = await setPickAction(gameId, next);
      if ("error" in res) {
        setSide(prev); // roll back
        setError(res.error);
      }
    });
  }

  const base =
    "min-w-[84px] rounded-lg border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60";
  const selected =
    "border-emerald-600 bg-emerald-600 text-white";
  const unselected =
    "border-neutral-300 hover:border-emerald-400 dark:border-neutral-700";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => choose("AWAY")}
          disabled={pending}
          className={`${base} ${side === "AWAY" ? selected : unselected}`}
          aria-pressed={side === "AWAY"}
        >
          {awayLabel}
        </button>
        <button
          type="button"
          onClick={() => choose("HOME")}
          disabled={pending}
          className={`${base} ${side === "HOME" ? selected : unselected}`}
          aria-pressed={side === "HOME"}
        >
          {homeLabel}
        </button>
      </div>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
