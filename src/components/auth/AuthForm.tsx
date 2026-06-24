"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/lib/auth-types";

type Props = {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  googleAction: () => Promise<void>;
  googleConfigured: boolean;
  notice?: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-700 dark:bg-neutral-900";
const labelClass = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export function AuthForm({
  mode,
  action,
  googleAction,
  googleConfigured,
  notice,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/60 p-7 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60">
      <h1 className="text-2xl font-black tracking-tight">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {isSignup
          ? "Sign up to start making picks."
          : "Log in to make your picks."}
      </p>

      {notice ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        {isSignup ? (
          <>
            <div>
              <label className={labelClass} htmlFor="email">
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
            <div>
              <label className={labelClass} htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                required
                autoComplete="username"
                className={inputClass}
                placeholder="3–20 letters, numbers, or _"
              />
            </div>
          </>
        ) : (
          <div>
            <label className={labelClass} htmlFor="identifier">
              Email or username
            </label>
            <input
              id="identifier"
              name="identifier"
              required
              autoComplete="username"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={inputClass}
          />
        </div>

        {!isSignup ? (
          <div className="-mt-1 text-right">
            <Link
              href="/forgot"
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        ) : null}

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
          {pending ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <form action={googleAction}>
        <button
          type="submit"
          disabled={!googleConfigured}
          title={googleConfigured ? undefined : "Google sign-in isn't configured yet"}
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {googleConfigured ? "Continue with Google" : "Google sign-in (coming soon)"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-emerald-600 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
