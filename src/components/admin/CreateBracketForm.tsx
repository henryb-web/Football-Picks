"use client";

import { useActionState } from "react";
import { createBracketAction } from "@/app/admin/brackets/actions";
import type { AdminState } from "@/lib/admin-types";
import { Feedback } from "./Feedback";
import { btnClass, inputClass, labelClass } from "./styles";

export function CreateBracketForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createBracketAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-cardborder bg-card p-5">
      <h2 className="font-bold">New bracket</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="b-league">League</label>
          <select id="b-league" name="league" defaultValue="CFB" className={inputClass}>
            <option value="CFB">College (CFP)</option>
            <option value="NFL">NFL</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="b-season">Season</label>
          <input id="b-season" name="season" type="number" defaultValue={2026} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="b-title">Title</label>
          <input id="b-title" name="title" placeholder="optional" className={inputClass} />
        </div>
      </div>
      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Creating…" : "Create bracket"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
