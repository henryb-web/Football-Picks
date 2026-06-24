"use client";

import { useActionState } from "react";
import { deleteGameAction, updateGameAction } from "@/app/admin/actions";
import { LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import type { AdminState } from "@/lib/admin-types";
import type { GameStatus, League } from "@/generated/prisma/client";
import { Feedback } from "./Feedback";
import { btnClass, inputClass, labelClass } from "./styles";

const STATUSES: GameStatus[] = ["SCHEDULED", "IN_PROGRESS", "FINAL", "CANCELED"];

export type EditableGame = {
  id: string;
  league: League;
  season: number;
  week: number | null;
  kickoffValue: string;
  awayName: string;
  homeName: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  isManual: boolean;
};

export function EditGameForm({ game }: { game: EditableGame }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    updateGameAction,
    undefined,
  );

  function confirmDelete(e: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm("Delete this game? Any picks on it are removed too.")) {
      e.preventDefault();
    }
  }

  return (
    <div className="space-y-6">
      {!game.isManual ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          This game came from a feed (e.g. ESPN). Edits here may be overwritten the
          next time that week is synced.
        </p>
      ) : null}

      <form action={action} className="space-y-4">
        <input type="hidden" name="gameId" value={game.id} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="e-league">
              League
            </label>
            <select
              id="e-league"
              name="league"
              defaultValue={game.league}
              className={inputClass}
            >
              {LEAGUES.map((l) => (
                <option key={l} value={l}>
                  {LEAGUE_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="e-status">
              Status
            </label>
            <select
              id="e-status"
              name="status"
              defaultValue={game.status}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="e-away">
              Away team
            </label>
            <input
              id="e-away"
              name="awayName"
              defaultValue={game.awayName}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="e-home">
              Home team
            </label>
            <input
              id="e-home"
              name="homeName"
              defaultValue={game.homeName}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass} htmlFor="e-season">
              Season
            </label>
            <input
              id="e-season"
              name="season"
              type="number"
              defaultValue={game.season}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="e-week">
              Week
            </label>
            <input
              id="e-week"
              name="week"
              type="number"
              min={1}
              defaultValue={game.week ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="e-kickoff">
              Kickoff
            </label>
            <input
              id="e-kickoff"
              name="kickoff"
              type="datetime-local"
              defaultValue={game.kickoffValue}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="e-awayScore">
              Away score
            </label>
            <input
              id="e-awayScore"
              name="awayScore"
              type="number"
              defaultValue={game.awayScore ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="e-homeScore">
              Home score
            </label>
            <input
              id="e-homeScore"
              name="homeScore"
              type="number"
              defaultValue={game.homeScore ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-xs text-neutral-400">
          Scores are ignored while status is Scheduled.
        </p>

        <div className="flex items-center gap-3">
          <button type="submit" className={btnClass} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          <Feedback state={state} />
        </div>
      </form>

      <form action={deleteGameAction} onSubmit={confirmDelete}>
        <input type="hidden" name="gameId" value={game.id} />
        <button
          type="submit"
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
        >
          Delete game
        </button>
      </form>
    </div>
  );
}
