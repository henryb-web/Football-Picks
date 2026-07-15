// Avatar: uploaded photo > chosen emoji > deterministic monogram.
export const AVATAR_COLORS = [
  "06b6d4", "8b5cf6", "f59e0b", "ef4444", "22c55e",
  "3b82f6", "ec4899", "14b8a6", "f97316", "a855f7",
  "eab308", "0ea5e9", "d946ef", "10b981", "fb7185",
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
