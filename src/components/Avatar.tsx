// Avatar: uploaded photo > chosen emoji > deterministic monogram.
// Ordered around the color wheel (red → orange → … → pink) so the picker
// reads like a rainbow.
export const AVATAR_COLORS = [
  "ef4444", "f97316", "f59e0b", "eab308", "22c55e",
  "10b981", "14b8a6", "06b6d4", "0ea5e9", "3b82f6",
  "8b5cf6", "a855f7", "d946ef", "ec4899", "fb7185",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  size = 28,
  image,
  emoji,
  color,
}: {
  name: string;
  size?: number;
  image?: string | null;
  emoji?: string | null;
  color?: string | null;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const bg = `#${color ?? AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length]}`;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.round(size * (emoji ? 0.55 : 0.4)),
      }}
    >
      {emoji ?? initials(name)}
    </span>
  );
}
