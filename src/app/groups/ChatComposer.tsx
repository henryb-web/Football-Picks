"use client";

import { useActionState, useEffect, useRef } from "react";
import { postMessageAction } from "./actions";
import type { FormState } from "@/lib/form-state";

export function ChatComposer({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    postMessageAction,
    undefined,
  );
  const ref = useRef<HTMLTextAreaElement>(null);

  // Clear the box after a successful post (the feed re-renders via revalidate).
  useEffect(() => {
    if (state?.ok && ref.current) ref.current.value = "";
  }, [state]);

  return (
    <form action={action} className="mt-3 space-y-1.5">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="flex gap-2">
        <textarea
          ref={ref}
          name="body"
          rows={1}
          maxLength={500}
          placeholder="Talk some trash…"
          className="min-w-0 flex-1 resize-none rounded-lg border border-cardborder bg-background px-3 py-2 text-sm outline-none transition focus:border-accent-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500 disabled:opacity-60"
        >
          {pending ? "…" : "Post"}
        </button>
      </div>
      {state?.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
    </form>
  );
}
