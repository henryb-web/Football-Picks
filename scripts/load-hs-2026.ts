// Load the researched 2026 Texas HS schedules. Idempotent: re-running skips
// games already in the DB. Run with: npx tsx scripts/load-hs-2026.ts
import "dotenv/config";
import { db } from "@/lib/db";
import { findOrCreateTeam } from "@/lib/ingest/manual";
import { HS_2026 } from "./data/hs-2026";

// Texas HS week number from the game date (Week 1 starts Mon Aug 24, 2026).
function weekOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = Date.UTC(2026, 7, 24);
  const day = Date.UTC(y, m - 1, d);
  return Math.floor((day - start) / (7 * 24 * 3600 * 1000)) + 1;
}

async function main() {
  // Flatten per-school lists into unique games (dedupe by date + team pair).
  const seen = new Set<string>();
  const games: { home: string; away: string; date: string; time: string }[] = [];
  for (const s of HS_2026) {
    for (const g of s.games) {
      const home = g.homeaway === "home" ? s.school : g.opponent;
      const away = g.homeaway === "home" ? g.opponent : s.school;
      const key = `${g.date}|${[home, away].sort().join("~")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      games.push({ home, away, date: g.date, time: g.time });
    }
  }

  let created = 0;
  let updated = 0;
  for (const g of games) {
    const [home, away] = await Promise.all([
      findOrCreateTeam("HS6A", g.home),
      findOrCreateTeam("HS6A", g.away),
    ]);
    const kickoff = new Date(`${g.date}T${g.time}:00`);
    const week = weekOf(g.date);
    const existing = await db.game.findFirst({
      where: { league: "HS6A", homeTeamId: home.id, awayTeamId: away.id, kickoff },
    });
    if (existing) {
      if (existing.week !== week) {
        await db.game.update({ where: { id: existing.id }, data: { week } });
        updated += 1;
      }
      continue;
    }
    await db.game.create({
      data: {
        league: "HS6A",
        season: 2026,
        week,
        kickoff,
        pickLockAt: kickoff,
        status: "SCHEDULED",
        homeTeamId: home.id,
        awayTeamId: away.id,
        externalSource: "manual",
      },
    });
    created += 1;
  }

  console.log(
    `HS 2026: ${games.length} unique games — created ${created}, updated ${updated} weeks.`,
  );
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
