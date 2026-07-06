import { db } from "@/lib/db";
import { settleGame } from "@/lib/scoring";
import type { NormalizedGame, NormalizedTeam } from "./types";
import type { League } from "@/generated/prisma/client";

async function upsertTeam(league: League, source: string, team: NormalizedTeam) {
  return db.team.upsert({
    where: {
      league_externalSource_externalId: {
        league,
        externalSource: source,
        externalId: team.externalId,
      },
    },
    create: {
      league,
      externalSource: source,
      externalId: team.externalId,
      name: team.name,
      displayName: team.displayName,
      abbreviation: team.abbreviation ?? null,
      location: team.location ?? null,
      color: team.color ?? null,
      altColor: team.altColor ?? null,
      logo: team.logo ?? null,
      record: team.record ?? null,
    },
    update: {
      name: team.name,
      displayName: team.displayName,
      abbreviation: team.abbreviation ?? null,
      location: team.location ?? null,
      color: team.color ?? null,
      altColor: team.altColor ?? null,
      logo: team.logo ?? null,
      // Don't clobber a known record with a null from a feed that omits it.
      ...(team.record != null ? { record: team.record } : {}),
    },
  });
}

export type PersistResult = { created: number; updated: number };

// Upsert a batch of normalized games (and their teams). Idempotent: re-syncing
// the same week updates kickoff/status/scores rather than duplicating.
export async function persistGames(games: NormalizedGame[]): Promise<PersistResult> {
  let created = 0;
  let updated = 0;

  for (const g of games) {
    const [home, away] = await Promise.all([
      upsertTeam(g.league, g.source, g.home),
      upsertTeam(g.league, g.source, g.away),
    ]);

    const existing = await db.game.findUnique({
      where: {
        league_externalSource_externalId: {
          league: g.league,
          externalSource: g.source,
          externalId: g.externalId,
        },
      },
      select: { id: true },
    });

    const data = {
      league: g.league,
      season: g.season,
      week: g.week,
      kickoff: g.kickoff,
      pickLockAt: g.kickoff,
      status: g.status,
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      externalSource: g.source,
      externalId: g.externalId,
    };

    // Odds vanish from the feed once a game starts; keep the last known line
    // by only writing these when present.
    const odds: { spread?: string; overUnder?: number } = {};
    if (g.spread != null) odds.spread = g.spread;
    if (g.overUnder != null) odds.overUnder = g.overUnder;

    let gameId: string;
    if (existing) {
      await db.game.update({ where: { id: existing.id }, data: { ...data, ...odds } });
      gameId = existing.id;
      updated += 1;
    } else {
      const createdGame = await db.game.create({
        data: { ...data, spread: g.spread ?? null, overUnder: g.overUnder ?? null },
      });
      gameId = createdGame.id;
      created += 1;
    }

    // Grade picks as soon as a game is final.
    if (data.status === "FINAL") {
      await settleGame(gameId);
    }
  }

  return { created, updated };
}
