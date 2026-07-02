// Dev check for survivor: pick, no-reuse, eliminate-on-loss, standings. Cleans up.
import "dotenv/config";
import { db } from "@/lib/db";
import { findOrCreateTeam } from "@/lib/ingest/manual";
import {
  setSurvivorPick,
  gradeSurvivorForGame,
  getSurvivorStandings,
} from "@/lib/survivor";

const SEASON = 2095;

async function makeGame(week: number, homeName: string, awayName: string) {
  const home = await findOrCreateTeam("NFL", homeName);
  const away = await findOrCreateTeam("NFL", awayName);
  const kickoff = new Date(`${SEASON}-09-0${week}T19:00:00`);
  return db.game.create({
    data: {
      league: "NFL",
      season: SEASON,
      week,
      kickoff,
      pickLockAt: kickoff,
      status: "SCHEDULED",
      homeTeamId: home.id,
      awayTeamId: away.id,
      externalSource: "manual",
    },
    include: { homeTeam: true, awayTeam: true },
  });
}

async function main() {
  const user = await db.user.findFirst({ where: { passwordHash: { not: null } } });
  if (!user) throw new Error("need a user");

  await db.survivorPool.deleteMany({ where: { season: SEASON } });
  await db.game.deleteMany({ where: { season: SEASON } });

  const g1 = await makeGame(1, "SurvA", "SurvB"); // week 1
  const g2 = await makeGame(2, "SurvA", "SurvC"); // week 2 (SurvA again)
  const pool = await db.survivorPool.create({
    data: { league: "NFL", season: SEASON, title: "Survivor test" },
  });

  const r1 = await setSurvivorPick(user.id, pool.id, g1.id, g1.homeTeamId); // SurvA wk1
  console.log("pick week1 (SurvA):", "ok" in r1 ? "OK" : `FAIL ${(r1 as { error: string }).error}`);

  const reuse = await setSurvivorPick(user.id, pool.id, g2.id, g2.homeTeamId); // SurvA wk2 -> reuse
  console.log("reuse same team rejected:", "error" in reuse ? "OK" : "FAIL");

  const r2 = await setSurvivorPick(user.id, pool.id, g2.id, g2.awayTeamId); // SurvC wk2
  console.log("pick week2 (SurvC):", "ok" in r2 ? "OK" : "FAIL");

  // Week 1 finals: SurvA (home) LOSES -> user eliminated.
  await db.game.update({
    where: { id: g1.id },
    data: { status: "FINAL", homeScore: 10, awayScore: 21 },
  });
  await gradeSurvivorForGame(g1.id);

  const afterLoss = await setSurvivorPick(user.id, pool.id, g2.id, g2.awayTeamId);
  console.log("eliminated user can't pick:", "error" in afterLoss ? "OK" : "FAIL");

  const standings = await getSurvivorStandings(pool.id);
  const me = standings.find((s) => s.userId === user.id);
  console.log(
    "standings: eliminated wk1:",
    me && !me.alive && me.eliminatedWeek === 1 ? "OK" : `FAIL ${JSON.stringify(me)}`,
  );

  await db.survivorPool.deleteMany({ where: { season: SEASON } });
  await db.game.deleteMany({ where: { season: SEASON } });
  console.log("cleaned up");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
