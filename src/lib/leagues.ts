import type { League, ScoringMode } from "@/generated/prisma/client";

export const LEAGUES = ["NFL", "CFB", "HS6A"] as const;

export const LEAGUE_LABELS: Record<League, string> = {
  NFL: "NFL",
  CFB: "College",
  HS6A: "Texas HS",
};

// NFL & college are scored against the spread; high school is straight-up.
export const LEAGUE_SCORING: Record<League, ScoringMode> = {
  NFL: "ATS",
  CFB: "ATS",
  HS6A: "SU",
};

export function isLeague(value: string): value is League {
  return (LEAGUES as readonly string[]).includes(value);
}
