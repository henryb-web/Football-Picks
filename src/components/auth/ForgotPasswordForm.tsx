"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/password-reset-actions";
import type { FormState } from "@/lib/form-state";

const inputClass =
  "mt-1 w-full rounded-lg border border-cardborder bg-background px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-cardborder bg-card p-7 shadow-sm">
      <h1 className="text-2xl font-black tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {state?.ok ? (
        <p className="mt-6 rounded-lg bg-cyan-500/10 px-3 py-3 text-sm text-cyan-500">
          {state.ok}
        </p>
      ) : (
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
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
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-cyan-500 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
