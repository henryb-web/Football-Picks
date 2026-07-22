import type { Badge } from "@/lib/stats";

// A small flame chip for an active win streak (>= 2). Hidden otherwise.
export function StreakFlame({ n }: { n: number }) {
  if (n < 2) return null;
  return (
    <span
      title={`${n}-pick win streak`}
      className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[11px] font-bold text-orange-400 tabular-nums"
    >
      🔥{n}
    </span>
  );
}

// Compact badge emojis with hover labels. `max` caps how many show (the list is
// already prestige-ordered), with a "+N" chip for the remainder.
export function BadgeChips({ badges, max }: { badges: Badge[]; max?: number }) {
  if (badges.length === 0) return null;
  const shown = max ? badges.slice(0, max) : badges;
  const extra = badges.length - shown.length;
  return (
    <span className="inline-flex items-center gap-1">
      {shown.map((b) => (
        <span key={b.label} title={b.label} className="text-sm leading-none">
          {b.emoji}
        </span>
      ))}
      {extra > 0 ? (
        <span
          title={badges.slice(shown.length).map((b) => b.label).join(", ")}
          className="text-[11px] font-semibold text-muted"
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}

// Full pill list (label + emoji) for the dashboard showcase.
export function BadgePills({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={b.label}
          className="rounded-full border border-cardborder bg-card px-3 py-1 text-xs font-semibold"
        >
          {b.emoji} {b.label}
        </span>
      ))}
    </div>
  );
}
