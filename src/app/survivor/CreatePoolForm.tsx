"use client";

import { useActionState, useState } from "react";
import { createPoolAction } from "./actions";
import { LEAGUE_LABELS, LEAGUES } from "@/lib/leagues";
import type { FormState } from "@/lib/form-state";

const input =
  "w-full rounded-lg border border-cardborder bg-background px-3 py-2 text-sm outline-none transition focus:border-accent-500";

export function CreatePoolForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createPoolAction,
    undefined,
  );
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  return (
    <form action={action} className="space-y-3 rounded-xl border border-cardborder bg-card p-5">
      <h2 className="headline text-lg">Create a pool</h2>
      <input type="hidden" name="visibility" value={visibility} />

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">Pool name</span>
        <input name="title" placeholder="e.g. Bandy Family Survivor" className={input} />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">League</span>
        <select name="league" defaultValue="NFL" className={input}>
          {LEAGUES.map((l) => (
            <option key={l} value={l}>{LEAGUE_LABELS[l]}</option>
          ))}
        </select>
      </label>

      <div className="text-sm">
        <span className="mb-1 block font-medium text-muted">Visibility</span>
        <div className="grid grid-cols-2 gap-2">
          {(["public", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              aria-pressed={visibility === v}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                visibility === v
                  ? "border-accent-500 bg-accent-500/10"
                  : "border-cardborder hover:border-accent-400"
              }`}
            >
              <span className="block font-semibold capitalize">{v}</span>
              <span className="block text-xs text-muted">
                {v === "public" ? "Anyone can find & join" : "Join by code only"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create pool"}
      </button>
      {state?.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
    </form>
  );
}
