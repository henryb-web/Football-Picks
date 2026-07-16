"use client";

import { useState, useTransition } from "react";
import { setSurvivorPickAction } from "@/app/survivor/actions";
import { TeamLogo } from "@/components/games/TeamLogo";

type PickTeam = { teamId: string; name: string; displayName: string; logo: string | null; color: string | null };
type PickGame = { id: string; locked: boolean; kickoffLabel: string; away: PickTeam; home: PickTeam };

export function SurvivorPicker({
  poolId,
  games,
  usedTeamIds,
  pickedTeamId,
}: {
  poolId: string;
  games: PickGame[];
  usedTeamIds: string[];
  pickedTeamId: string | null;
}) {
  const used = new Set(usedTeamIds);
  const [sel, setSel] = useState<string | null>(pickedTeamId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(gameId: string, teamId: string) {
    if (pending) return;
    const prev = sel;
    setError(null);
    setSel(teamId);
    startTransition(async () => {
      const r = await setSurvivorPickAction(poolId, gameId, teamId);
      if ("error" in r) {
        setSel(prev);
        setError(r.error);
      }
    });
  }

  function teamButton(gameId: string, t: PickTeam, locked: boolean) {
    const isSel = sel === t.teamId;
    const disabledByReuse = used.has(t.teamId) && t.teamId !== pickedTeamId;
    const disabled = pending || locked || disabledByReuse;
    return (
      <button
        type="button"
        onClick={() => pick(gameId, t.teamId)}
        disabled={disabled}
        aria-pressed={isSel}
        title={disabledByReuse ? "Already used this team" : undefined}
        className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition hover:scale-[1.03] active:scale-95 disabled:opacity-40 ${
          isSel
            ? "border-accent-500 bg-accent-600 text-white"
            : "border-cardborder hover:border-accent-400"
        }`}
      >
        <TeamLogo logo={t.logo} color={t.color} size={18} name={t.displayName} />
        {t.name}
        {disabledByReuse ? <span className="ml-auto text-xs">used</span> : null}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {games.map((g) => (
        <div key={g.id} className="rounded-lg border border-cardborder bg-card p-2">
          <div className="mb-1 px-1 text-[11px] text-muted">
            {g.kickoffLabel}
            {g.locked ? " · locked" : ""}
          </div>
          <div className="flex gap-2">
            {teamButton(g.id, g.away, g.locked)}
            {teamButton(g.id, g.home, g.locked)}
          </div>
        </div>
      ))}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
