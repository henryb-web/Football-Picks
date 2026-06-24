"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/password-reset-actions";
import type { FormState } from "@/lib/form-state";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/60 p-7 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60">
      <h1 className="text-2xl font-black tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {state?.ok ? (
        <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {state.ok}
        </p>
      ) : (
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
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
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
