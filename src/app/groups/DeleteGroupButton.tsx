"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteGroupAction } from "./actions";
import type { FormState } from "@/lib/form-state";

// Owner-only, two-step confirm (deleting removes the group for all members).
export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    deleteGroupAction,
    undefined,
  );
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
      >
        <Trash2 className="size-4" />
        Delete group
      </button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="groupId" value={groupId} />
      <p className="text-sm text-muted">
        Delete this group for <strong>everyone</strong>? Members and its
        leaderboard are removed. This can&apos;t be undone.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg border border-cardborder px-4 py-2 text-sm font-semibold transition hover:border-accent-500 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
      {state?.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
    </form>
  );
}
