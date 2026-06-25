"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/password-reset-actions";
import type { FormState } from "@/lib/form-state";

const inputClass =
  "mt-1 w-full rounded-lg border border-cardborder bg-background px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30";
const labelClass = "block text-sm font-medium text-foreground";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-cardborder bg-card p-7 shadow-sm">
      <h1 className="text-2xl font-black tracking-tight">Choose a new password</h1>

      {token ? (
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className={labelClass} htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required autoComplete="new-password" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
          </div>

          {state?.error ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Reset password"}
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-3 text-sm text-red-500">
          This reset link is missing its token. Please{" "}
          <Link href="/forgot" className="font-semibold underline">request a new one</Link>.
        </p>
      )}
    </div>
  );
}
