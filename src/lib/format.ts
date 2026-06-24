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

// Format a Date as a value for an <input type="datetime-local"> using the
// server's local wall clock (matches how new Date(value) parses it back).
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
