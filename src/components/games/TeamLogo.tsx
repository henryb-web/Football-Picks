// Team logos that are near-black and blend into the dark background. These get
// a small brightness lift + a subtle light halo in dark mode so they stay
// visible; every other logo is left untouched.
const HALO_TEAMS = new Set<string>([
  "Penn State Nittany Lions",
  "Vandegrift",
  "McNeil",
  "West Virginia Mountaineers",
  "Cincinnati Bearcats",
  "Wake Forest Demon Deacons",
  "Iowa Hawkeyes",
  "California Golden Bears",
  "Utah State Aggies",
  "New Mexico State Aggies",
  "Jarrell",
  "Rice Owls",
  "San Diego State Aztecs",
  "New York Jets",
]);

// Team logo with a colored-dot fallback. Plain <img> (external ESPN URL) is
// fine here; we don't need Next image optimization for tiny logos.
export function TeamLogo({
  logo,
  color,
  size = 22,
  name,
}: {
  logo: string | null;
  color: string | null;
  size?: number;
  name?: string;
}) {
  if (logo) {
    const halo =
      name != null && HALO_TEAMS.has(name)
        ? " dark:brightness-110 dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.7)]"
        : "";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        className={`shrink-0${halo}`}
        // objectFit inline so it can't be overridden to `fill` (which squishes
        // non-square logos — most HS logos are 3:2, unlike the square pro/college
        // marks). contain letterboxes them in the square box, no distortion.
        style={{ width: size, height: size, objectFit: "contain" }}
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
