import { db } from "@/lib/db";
import { LEAGUE_SCORING } from "@/lib/leagues";
import type { League } from "@/generated/prisma/client";

async function findOrCreateManualTeam(league: League, displayName: string) {
  const name = displayName.trim();
  const existing = await db.team.findFirst({
    where: { league, externalSource: "manual", displayName: name },
  });
  if (existing) return existing;
  return db.team.create({
    data: { league, externalSource: "manual", name, displayName: name },
  });
}

// Create a game entered by hand (used for Texas 6A and any other off-feed games).
export async function createManualGame(input: {
  league: League;
  season: number;
  week: number | null;
  kickoff: Date;
  homeName: string;
  awayName: string;
}) {
  const [home, away] = await Promise.all([
    findOrCreateManualTeam(input.league, input.homeName),
    findOrCreateManualTeam(input.league, input.awayName),
  ]);

  return db.game.create({
    data: {
      league: input.league,
      season: input.season,
      week: input.week,
      kickoff: input.kickoff,
      pickLockAt: input.kickoff,
      status: "SCHEDULED",
      scoringMode: LEAGUE_SCORING[input.league],
      homeTeamId: home.id,
      awayTeamId: away.id,
      externalSource: "manual",
    },
  });
}
