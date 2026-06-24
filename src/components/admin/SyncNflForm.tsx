"use client";

import { useActionState } from "react";
import { syncNflAction } from "@/app/admin/actions";
import type { AdminState } from "@/lib/admin-types";
import { Feedback } from "./Feedback";
import { btnClass, inputClass, labelClass } from "./styles";

export function SyncNflForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    syncNflAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="nfl-season">
            Season
          </label>
          <input
            id="nfl-season"
            name="season"
            type="number"
            defaultValue={2025}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="nfl-week">
            Week
          </label>
          <input
            id="nfl-week"
            name="week"
            type="number"
            defaultValue={1}
            min={1}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="nfl-type">
            Type
          </label>
          <select
            id="nfl-type"
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
      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Syncing…" : "Sync NFL week"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
