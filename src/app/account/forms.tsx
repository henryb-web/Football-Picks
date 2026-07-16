"use client";

import { useActionState, useState } from "react";
import { Avatar, AVATAR_COLORS } from "@/components/Avatar";
import { AVATAR_EMOJIS, TIMEZONES, THEME_OPTIONS } from "@/lib/account";
import type { FormState } from "@/lib/form-state";
import {
  updateProfileAction,
  changePasswordAction,
  updateAvatarAction,
  uploadAvatarPhotoAction,
  updatePreferencesAction,
  deleteAccountAction,
} from "./actions";

const inputCls =
  "w-full rounded-lg border border-cardborder bg-background px-3 py-2 text-sm outline-none transition focus:border-accent-500";
const btnCls =
  "rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-500 disabled:opacity-60";

function Feedback({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="text-sm text-red-500">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-accent-500">{state.ok}</p>;
  return null;
}

export function ProfileForm({ name, username }: { name: string; username: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">Display name</span>
        <input name="name" defaultValue={name} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">Username</span>
        <input name="username" defaultValue={username} className={inputCls} />
      </label>
      <div className="flex items-center gap-3">
        <button className={btnCls} disabled={pending}>Save</button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-3">
      {hasPassword ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-muted">Current password</span>
          <input type="password" name="current" className={inputCls} />
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">New password</span>
        <input type="password" name="password" className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">Confirm new password</span>
        <input type="password" name="confirm" className={inputCls} />
      </label>
      <div className="flex items-center gap-3">
        <button className={btnCls} disabled={pending}>
          {hasPassword ? "Change password" : "Set password"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function AvatarForm({
  name,
  image,
  emoji,
  color,
}: {
  name: string;
  image: string | null;
  emoji: string | null;
  color: string | null;
}) {
  const [selColor, setSelColor] = useState(color ?? AVATAR_COLORS[0]);
  const [selEmoji, setSelEmoji] = useState(emoji ?? "");
  const [state, action, pending] = useActionState(updateAvatarAction, undefined);
  const [photoState, photoAction, photoPending] = useActionState(
    uploadAvatarPhotoAction,
    undefined,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={name} size={56} image={image} emoji={selEmoji || null} color={selColor} />
        <p className="text-xs text-muted">
          {image
            ? "Using your uploaded photo. Pick a color/emoji (or remove the photo) to use a monogram instead."
            : "Live preview of your monogram."}
        </p>
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="color" value={selColor} />
        <input type="hidden" name="emoji" value={selEmoji} />
        <div>
          <span className="mb-1 block text-sm font-medium text-muted">Color</span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setSelColor(c)}
                aria-label={`Color #${c}`}
                className={`h-7 w-7 rounded-full ${selColor === c ? "ring-2 ring-accent-400 ring-offset-2 ring-offset-card" : ""}`}
                style={{ backgroundColor: `#${c}` }}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-muted">Emoji (optional)</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelEmoji("")}
              className={`h-8 w-8 rounded-md border text-sm ${selEmoji === "" ? "border-accent-500 text-accent-500" : "border-cardborder text-muted"}`}
            >
              –
            </button>
            {AVATAR_EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setSelEmoji(e)}
                className={`h-8 w-8 rounded-md border text-base ${selEmoji === e ? "border-accent-500 bg-accent-600/15" : "border-cardborder"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className={btnCls} disabled={pending}>Save avatar</button>
          {image ? (
            <button
              name="removePhoto"
              value="1"
              className="rounded-lg border border-cardborder px-3 py-2 text-sm font-medium transition hover:bg-background"
            >
              Remove photo
            </button>
          ) : null}
          <Feedback state={state} />
        </div>
      </form>

      <form action={photoAction} className="space-y-2 border-t border-cardborder pt-3">
        <span className="block text-sm font-medium text-muted">Upload a photo</span>
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="block text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
        />
        <div className="flex items-center gap-3">
          <button className={btnCls} disabled={photoPending}>Upload</button>
          <Feedback state={photoState} />
        </div>
      </form>
    </div>
  );
}

export function PreferencesForm({
  theme,
  timezone,
}: {
  theme: string;
  timezone: string;
}) {
  const [state, action, pending] = useActionState(updatePreferencesAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">Theme</span>
        <select name="theme" defaultValue={theme} className={inputCls}>
          {THEME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-muted">Time zone</span>
        <select name="timezone" defaultValue={timezone} className={inputCls}>
          <option value="">Not set</option>
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <button className={btnCls} disabled={pending}>Save preferences</button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DeleteAccount() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <form action={deleteAccountAction} className="space-y-3">
      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        I understand this permanently deletes my account and all my picks.
      </label>
      <button
        disabled={!confirmed}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
      >
        Delete my account
      </button>
    </form>
  );
}
