"use client";

import { useActionState } from "react";
import { generateBracketAction } from "@/app/admin/brackets/actions";
import type { AdminState } from "@/lib/admin-types";
import { Feedback } from "./Feedback";
import { btnClass } from "./styles";

export function GenerateButton({ bracketId }: { bracketId: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    generateBracketAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="bracketId" value={bracketId} />
      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Generating…" : "Generate / rebuild matchups"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
