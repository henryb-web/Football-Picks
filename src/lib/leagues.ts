import type { League } from "@/generated/prisma/client";

export const LEAGUES = ["NFL", "CFB", "HS6A"] as const;

export const LEAGUE_LABELS: Record<League, string> = {
  NFL: "NFL",
  CFB: "College",
  HS6A: "Texas HS",
};

export function isLeague(value: string): value is League {
  return (LEAGUES as readonly string[]).includes(value);
}
