// Team logo with a colored-dot fallback. Plain <img> (external ESPN URL) is
// fine here; we don't need Next image optimization for tiny logos.
export function TeamLogo({
  logo,
  color,
  size = 22,
}: {
  logo: string | null;
  color: string | null;
  size?: number;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        className="shrink-0 object-contain dark:brightness-110 dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.7)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`inline-block shrink-0 rounded-full ring-1 ring-inset ring-cardborder ${color ? "" : "bg-muted"}`}
      style={{
        width: size * 0.6,
        height: size * 0.6,
        backgroundColor: color ? `#${color}` : undefined,
      }}
    />
  );
}
