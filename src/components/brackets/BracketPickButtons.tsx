"use client";

import { useState, useTransition } from "react";
import { setBracketPickAction } from "@/app/brackets/actions";

type Side = { seed: number; group: string | null; displayName: string } | null;

export function BracketPickButtons({
  bracketId,
  gameId,
  top,
  bottom,
  currentSeed,
  currentGroup,
}: {
  bracketId: string;
  gameId: string;
  top: Side;
  bottom: Side;
  currentSeed: number | null;
  currentGroup: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(side: Side) {
    if (!side || pending) return;
    setError(null);
    startTransition(async () => {
      const r = await setBracketPickAction(bracketId, gameId, side.seed, side.group);
      if ("error" in r) setError(r.error);
    });
  }

  const isPicked = (s: Side) =>
    !!s && s.seed === currentSeed && (s.group ?? null) === (currentGroup ?? null);

  function btn(side: Side) {
    if (!side) {
      return (
        <span className="flex-1 rounded-md border border-dashed border-cardborder px-3 py-2 text-center text-sm text-muted">
          TBD
        </span>
      );
    }
    const picked = isPicked(side);
    return (
      <button
        type="button"
        onClick={() => pick(side)}
        disabled={pending}
        aria-pressed={picked}
        className={`flex-1 rounded-md border px-3 py-2 text-left text-sm font-semibold transition disabled:opacity-60 ${
          picked
            ? "border-emerald-500 bg-emerald-600 text-white"
            : "border-cardborder hover:border-emerald-400"
        }`}
      >
        <span className="text-xs opacity-70">{side.seed}</span> {side.displayName}
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {btn(top)}
        {btn(bottom)}
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
