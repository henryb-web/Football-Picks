import { db } from "@/lib/db";
import type { GameStatus, League } from "@/generated/prisma/client";

// Reuse an existing team in the league by display name, else create a manual one.
export async function findOrCreateTeam(league: League, displayName: string) {
  const name = displayName.trim();
  const existing = await db.team.findFirst({
    where: { league, displayName: name },
  });
  if (existing) return existing;
  return db.team.create({
    data: { league, externalSource: "manual", name, displayName: name },
  });
}

type GameInput = {
  league: League;
  season: number;
  week: number | null;
  kickoff: Date;
  homeName: string;
  awayName: string;
};

// Create a game entered by hand (used for Texas 6A and any other off-feed games).
export async function createManualGame(input: GameInput) {
  const [home, away] = await Promise.all([
    findOrCreateTeam(input.league, input.homeName),
    findOrCreateTeam(input.league, input.awayName),
  ]);

  return db.game.create({
    data: {
      league: input.league,
      season: input.season,
      week: input.week,
      kickoff: input.kickoff,
      pickLockAt: input.kickoff,
      status: "SCHEDULED",
      homeTeamId: home.id,
      awayTeamId: away.id,
      externalSource: "manual",
    },
  });
}

// Edit an existing game's details (admin). Reassigns teams by name, recomputes
// the lock time, and clears scores if moved back to scheduled.
export async function updateGame(
  gameId: string,
  input: GameInput & {
    status: GameStatus;
    homeScore: number | null;
    awayScore: number | null;
  },
) {
  const [home, away] = await Promise.all([
    findOrCreateTeam(input.league, input.homeName),
    findOrCreateTeam(input.league, input.awayName),
  ]);

  const scheduled = input.status === "SCHEDULED";
  return db.game.update({
    where: { id: gameId },
    data: {
      league: input.league,
      season: input.season,
      week: input.week,
      kickoff: input.kickoff,
      pickLockAt: input.kickoff,
      status: input.status,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: scheduled ? null : input.homeScore,
      awayScore: scheduled ? null : input.awayScore,
    },
  });
}
