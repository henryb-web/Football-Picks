"use client";

import { useActionState } from "react";
import { createSurvivorPoolAction } from "@/app/admin/survivor/actions";
import { LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import type { AdminState } from "@/lib/admin-types";
import { Feedback } from "./Feedback";
import { btnClass, inputClass, labelClass } from "./styles";

export function CreateSurvivorForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createSurvivorPoolAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-cardborder bg-card p-5">
      <h2 className="font-bold">New survivor pool</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="s-league">League</label>
          <select id="s-league" name="league" defaultValue="NFL" className={inputClass}>
            {LEAGUES.map((l) => (
              <option key={l} value={l}>{LEAGUE_LABELS[l]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="s-season">Season</label>
          <input id="s-season" name="season" type="number" defaultValue={2026} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="s-title">Title</label>
          <input id="s-title" name="title" placeholder="optional" className={inputClass} />
        </div>
      </div>
      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Creating…" : "Create pool"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
