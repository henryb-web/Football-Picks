"use client";

import { useActionState } from "react";
import { setScoreAction } from "@/app/admin/actions";
import type { AdminState } from "@/lib/admin-types";

const scoreInput =
  "w-14 rounded-md border border-cardborder bg-background px-2 py-1 text-center text-sm outline-none focus:border-emerald-500";

export function ScoreForm({
  gameId,
  awayLabel,
  homeLabel,
  homeScore,
  awayScore,
}: {
  gameId: string;
  awayLabel: string;
  homeLabel: string;
  homeScore: number | null;
  awayScore: number | null;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    setScoreAction,
    undefined,
  );

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="gameId" value={gameId} />
      <input
        name="awayScore"
        type="number"
        defaultValue={awayScore ?? ""}
        aria-label={`${awayLabel} score`}
        className={scoreInput}
      />
      <span className="text-xs text-muted">@</span>
      <input
        name="homeScore"
        type="number"
        defaultValue={homeScore ?? ""}
        aria-label={`${homeLabel} score`}
        className={scoreInput}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-cardborder px-2.5 py-1 text-xs font-semibold transition hover:bg-background disabled:opacity-60"
      >
        {pending ? "…" : "Save"}
      </button>
      {state?.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}
