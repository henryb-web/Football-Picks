"use client";

import { useActionState } from "react";
import { syncGamesAction } from "@/app/admin/actions";
import type { AdminState } from "@/lib/admin-types";
import { Feedback } from "./Feedback";
import { btnClass, inputClass, labelClass } from "./styles";

export function SyncForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    syncGamesAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="sync-league">
            League
          </label>
          <select
            id="sync-league"
            name="league"
            defaultValue="NFL"
            className={inputClass}
          >
            <option value="NFL">NFL</option>
            <option value="CFB">College (FBS)</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="sync-type">
            Type
          </label>
          <select
            id="sync-type"
            name="seasonType"
            defaultValue={2}
            className={inputClass}
          >
            <option value={1}>Preseason</option>
            <option value={2}>Regular</option>
            <option value={3}>Postseason</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="sync-season">
            Season
          </label>
          <input
            id="sync-season"
            name="season"
            type="number"
            defaultValue={2026}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sync-week">
            Week
          </label>
          <input
            id="sync-week"
            name="week"
            type="number"
            defaultValue={1}
            min={1}
            className={inputClass}
          />
        </div>
      </div>
      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Syncing…" : "Sync week"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
