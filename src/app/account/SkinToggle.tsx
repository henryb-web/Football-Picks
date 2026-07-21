"use client";

import { useState } from "react";
import { setSkinAction } from "./actions";

const ONE_YEAR = 60 * 60 * 24 * 365;

type Skin = "booth" | "rip";

const OPTIONS: { id: Skin; name: string; desc: string }[] = [
  {
    id: "booth",
    name: "Broadcast Booth",
    desc: "Stadium navy + scoreboard blue. The default.",
  },
  {
    id: "rip",
    name: "The Rip",
    desc: "Plum cabinet + holo foil. Glossy trading-card energy.",
  },
];

// Apply the choice to the live document: flip the class for an instant preview
// and persist the cookie so layout.tsx renders it (before paint) next load.
function applySkin(next: Skin) {
  document.documentElement.classList.toggle("skin-rip", next === "rip");
  document.cookie = `skin=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

// Per-device look picker. `initial` comes from the server-read cookie, so the
// first render matches SSR (no flash, no hydration mismatch).
export function SkinToggle({ initial }: { initial: Skin }) {
  const [skin, setSkin] = useState<Skin>(initial);

  function choose(next: Skin) {
    setSkin(next);
    applySkin(next); // instant preview + per-device cookie
    void setSkinAction(next); // persist to the account (cross-device)
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => choose(o.id)}
          aria-pressed={skin === o.id}
          className={`rounded-lg border p-3 text-left transition ${
            skin === o.id
              ? "border-accent-500 bg-accent-500/10"
              : "border-cardborder hover:border-accent-400"
          }`}
        >
          <span className="block font-semibold">{o.name}</span>
          <span className="mt-0.5 block text-xs text-muted">{o.desc}</span>
        </button>
      ))}
    </div>
  );
}
