// Choices for the account/profile editor.

export const AVATAR_EMOJIS = [
  "🏈", "🔥", "🐐", "⚡", "💪", "🎯", "👑", "🦅", "🐅", "🐏",
  "🦬", "🏆", "🎉", "😎", "🤠", "🧊", "🚀", "⭐", "💯", "🥶",
];

// Common US zones (+ a couple others). value = IANA id, label = friendly.
export const TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
];

export const THEME_OPTIONS = [
  { value: "", label: "System default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
