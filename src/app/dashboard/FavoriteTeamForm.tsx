"use client";

import { useActionState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/games/TeamLogo";
import { setFavoriteTeamAction } from "@/app/account/actions";

type Team = {
  displayName: string;
  name: string;
  logo: string | null;
  color: string | null;
  record: string | null;
};

export function FavoriteTeamCard({
  league,
  label,
  team,
  nextGameLabel,
  teamNames,
}: {
  league: "NFL" | "CFB" | "HS6A";
  label: string;
  team: Team | null;
  nextGameLabel: string | null;
  teamNames: string[];
}) {
  const [state, action, pending] = useActionState(setFavoriteTeamAction, undefined);
  const listId = `fav-teams-${league}`;

  return (
    <div className="rounded-xl border border-cardborder bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </div>

      {team ? (
        <Link
          href={`/games?team=${encodeURIComponent(team.name)}`}
          className="mt-2 flex items-center gap-2 transition hover:opacity-90"
        >
          <TeamLogo logo={team.logo} color={team.color} name={team.displayName} size={32} />
          <div className="min-w-0">
            <div className="headline truncate text-base">{team.displayName}</div>
            {team.record ? <div className="text-xs text-muted">{team.record}</div> : null}
          </div>
        </Link>
      ) : (
        <div className="mt-2 text-sm text-muted">No team set.</div>
      )}
      {team && nextGameLabel ? (
        <div className="mt-2 text-xs text-muted">{nextGameLabel}</div>
      ) : null}

      <form action={action} className="mt-3 flex items-center gap-2">
        <input type="hidden" name="league" value={league} />
        <input
          name="favoriteTeam"
          defaultValue={team?.displayName ?? ""}
          list={listId}
          placeholder="Type a team…"
          aria-label={`Favorite ${label} team`}
          className="min-w-0 flex-1 rounded-lg border border-cardborder bg-background px-2.5 py-1.5 text-sm outline-none transition focus:border-cyan-500"
        />
        <datalist id={listId}>
          {teamNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <button
          disabled={pending}
          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
        >
          {team ? "Change" : "Set"}
        </button>
      </form>
      {state?.error ? (
        <p className="mt-1 text-xs text-red-500">{state.error}</p>
      ) : state?.ok ? (
        <p className="mt-1 text-xs text-cyan-500">{state.ok}</p>
      ) : null}
    </div>
  );
}
