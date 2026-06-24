"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/password-reset-actions";
import type { FormState } from "@/lib/form-state";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900";
const labelClass =
  "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/60 p-7 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60">
      <h1 className="text-2xl font-black tracking-tight">Choose a new password</h1>

      {token ? (
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label className={labelClass} htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {state?.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Reset password"}
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          This reset link is missing its token. Please{" "}
          <Link href="/forgot" className="font-semibold underline">
            request a new one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
