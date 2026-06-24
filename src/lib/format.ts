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
