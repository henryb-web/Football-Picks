"use client";

import { useActionState } from "react";
import { saveSeedsAction } from "@/app/admin/brackets/actions";
import { requiredEntries, seedFieldName } from "@/lib/bracket/format";
import type { AdminState } from "@/lib/admin-types";
import type { League } from "@/generated/prisma/client";
import { Feedback } from "./Feedback";
import { btnClass, inputClass } from "./styles";

export function SeedEditor({
  bracketId,
  league,
  values,
}: {
  bracketId: string;
  league: League;
  values: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    saveSeedsAction,
    undefined,
  );
  const entries = requiredEntries(league);
  const groups = [...new Set(entries.map((e) => e.group))];

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="bracketId" value={bracketId} />
      {groups.map((g) => (
        <div key={g ?? "all"}>
          {g ? (
            <h3 className="mb-2 text-sm font-bold text-muted">{g}</h3>
          ) : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {entries
              .filter((e) => e.group === g)
              .map((e) => {
                const fn = seedFieldName(e.group, e.seed);
                return (
                  <div key={fn} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-right text-xs font-bold text-muted">
                      {e.seed}
                    </span>
                    <input
                      name={fn}
                      defaultValue={values[fn] ?? ""}
                      placeholder={`Seed ${e.seed} team`}
                      className={inputClass}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      ))}
      <button type="submit" className={btnClass} disabled={pending}>
        {pending ? "Saving…" : "Save seeds"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
