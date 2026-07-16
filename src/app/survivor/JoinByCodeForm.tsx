"use client";

import { useActionState } from "react";
import { joinByCodeAction } from "./actions";
import type { FormState } from "@/lib/form-state";

export function JoinByCodeForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    joinByCodeAction,
    undefined,
  );

  return (
    <form action={action} className="rounded-xl border border-cardborder bg-card p-5">
      {!compact ? <h2 className="headline mb-3 text-lg">Join by code</h2> : null}
      <div className="flex gap-2">
        <input
          name="code"
          placeholder="Enter code"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-lg border border-cardborder bg-background px-3 py-2 text-sm uppercase tracking-widest outline-none transition focus:border-accent-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-60"
        >
          {pending ? "…" : "Join"}
        </button>
      </div>
      {state?.error ? <p className="mt-2 text-sm text-red-500">{state.error}</p> : null}
    </form>
  );
}
