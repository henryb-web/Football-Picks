"use client";

import { useActionState } from "react";
import { setFavoriteTeamAction } from "@/app/account/actions";

export function FavoriteTeamForm({
  current,
  teamNames,
}: {
  current: string;
  teamNames: string[];
}) {
  const [state, action, pending] = useActionState(setFavoriteTeamAction, undefined);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input
        name="favoriteTeam"
        defaultValue={current}
        list="dash-team-options"
        placeholder="Type a team name…"
        aria-label="Favorite team"
        className="min-w-0 flex-1 rounded-lg border border-cardborder bg-background px-3 py-2 text-sm outline-none transition focus:border-cyan-500"
      />
      <datalist id="dash-team-options">
        {teamNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <button
        disabled={pending}
        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
      >
        {current ? "Change" : "Set"}
      </button>
      {state?.error ? (
        <span className="text-sm text-red-500">{state.error}</span>
      ) : state?.ok ? (
        <span className="text-sm text-cyan-500">{state.ok}</span>
      ) : null}
    </form>
  );
}
