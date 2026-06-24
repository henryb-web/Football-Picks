"use client";

import { useActionState } from "react";
import { createGameAction } from "@/app/admin/actions";
import { LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import type { AdminState } from "@/lib/admin-types";
import { Feedback } from "./Feedback";
import { btnClass, inputClass, labelClass } from "./styles";

export function ManualGameForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createGameAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="m-league">
            League
          </label>
          <select id="m-league" name="league" defaultValue="HS6A" className={inputClass}>
            {LEAGUES.map((l) => (
              <option key={l} value={l}>
                {LEAGUE_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="m-kickoff">
            Kickoff
          </label>
          <input
            id="m-kickoff"
            name="kickoff"
            type="datetime-local"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="m-away">
            Away team
          </label>
          <input id="m-away" name="awayName" className={inputClass} placeholder="Lake Travis" />
        </div>
        <div>
          <label className={labelClass} htmlFor="m-home">
            Home team
          </label>
          <input id="m-home" name="homeName" className={inputClass} placeholder="Westlake" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="m-season">
            Season
          </label>
          <input
            id="m-season"
            name="season"
            type="number"
            defaultValue={2025}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="m-week">
            Week <span className="text-neutral-400">(optional)</span>
          </label>
          <input id="m-week" name="week" type="number" min={1} className={inputClass} />
        </div>
      </div>

      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Adding…" : "Add game"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
