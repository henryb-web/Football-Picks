"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-cardborder bg-card px-4 py-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Invite code
        </div>
        <div className="headline text-2xl tracking-[0.25em] text-accent-500">{code}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-cardborder px-3 py-2 text-sm font-semibold transition hover:border-accent-500 hover:text-accent-500"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
