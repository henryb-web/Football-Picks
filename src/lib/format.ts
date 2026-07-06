// Kickoffs are shown in US Central time (Texas-centric, sensible default for all
// three leagues) with a fixed format so server render and any hydration agree.
const kickoffFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Chicago",
});

export function formatKickoff(date: Date): string {
  return kickoffFmt.format(date);
}

// Full date, e.g. "Saturday, September 13, 2025" (Central time, fixed format).
const gameDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Chicago",
});

export function formatGameDate(date: Date): string {
  return gameDateFmt.format(date);
}

// Time of day with zone, e.g. "7:30 PM CDT" (Central time, fixed format).
const gameTimeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
  timeZone: "America/Chicago",
});

export function formatGameTime(date: Date): string {
  return gameTimeFmt.format(date);
}

// Shared parts formatter: an instant's US Central wall-clock components.
const centralPartsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function centralParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    centralPartsFmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
}

// Format an instant as a "YYYY-MM-DDTHH:mm" value for <input type="datetime-local">,
// expressed in US Central time so admin kickoff entry is timezone-stable no matter
// where the server runs. Pair with centralDatetimeLocalToDate to parse it back.
export function toDatetimeLocalValue(date: Date): string {
  const p = centralParts(date);
  const hour = p.hour === "24" ? "00" : p.hour; // some ICU builds emit "24" at midnight
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}

// Milliseconds Central is offset from UTC at the given instant (negative — Central
// is behind UTC). Derived from the wall-clock parts at that instant.
function centralOffsetMs(instant: Date): number {
  const p = centralParts(instant);
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  const wallAsUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
  );
  return wallAsUTC - instant.getTime();
}

// Parse a naive "YYYY-MM-DDTHH:mm" value (from <input type="datetime-local">) as
// US Central wall-clock time, returning the matching absolute instant regardless
// of the server's timezone. Returns an invalid Date if the value doesn't parse.
export function centralDatetimeLocalToDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return new Date(NaN);
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  // Treat the wall-clock as UTC, then correct by Central's offset at that instant.
  const asUTC = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(asUTC - centralOffsetMs(new Date(asUTC)));
}
