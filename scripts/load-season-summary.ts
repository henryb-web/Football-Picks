// Populate Team.seasonSummary for NFL & CFB from ESPN's core API: last
// completed season's record + passing/rushing/receiving leaders ("key
// players"). HS is skipped (no data source). Safe to re-run.
// Usage: npx tsx scripts/load-season-summary.ts [season]   (default 2025)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type League } from "../src/generated/prisma/client";

const SEASON = Number(process.argv[2]) || 2025;
const LEAGUE_KEY: Record<string, string> = { NFL: "nfl", CFB: "college-football" };
const CATS: Array<[string, string]> = [
  ["passingLeader", "Passing"],
  ["rushingLeader", "Rushing"],
  ["receivingLeader", "Receiving"],
];
const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues";

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchSummary(leagueKey: string, teamId: string) {
  const base = `${CORE}/${leagueKey}/seasons/${SEASON}/types/2/teams/${teamId}`;
  const [rec, lead] = await Promise.all([
    getJson(`${base}/record`),
    getJson(`${base}/leaders`),
  ]);

  const record: string | null =
    rec?.items?.find((i: any) => i.type === "total")?.summary ??
    rec?.items?.[0]?.summary ??
    null;

  const leaders: Array<{ cat: string; name: string; pos: string | null; stat: string }> = [];
  const cats: any[] = lead?.categories ?? [];
  for (const [key, label] of CATS) {
    const entry = cats.find((c) => c.name === key)?.leaders?.[0];
    if (!entry?.athlete?.$ref) continue;
    const athlete = await getJson(entry.athlete.$ref);
    if (!athlete?.displayName) continue;
    leaders.push({
      cat: label,
      name: athlete.displayName,
      pos: athlete.position?.abbreviation ?? null,
      stat: entry.displayValue ?? "",
    });
  }

  if (!record && leaders.length === 0) return null;
  return { season: SEASON, record, leaders };
}

// Run `worker` over `items` with a bounded concurrency pool.
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const teams = await db.team.findMany({
    where: {
      league: { in: ["NFL", "CFB"] as League[] },
      externalSource: "espn",
      externalId: { not: null },
    },
    select: { id: true, league: true, displayName: true, externalId: true },
  });
  console.log(`Fetching ${SEASON} summaries for ${teams.length} NFL/CFB teams…`);

  let ok = 0, empty = 0;
  await pool(teams, 6, async (t) => {
    const summary = await fetchSummary(LEAGUE_KEY[t.league], t.externalId!);
    if (!summary) {
      empty++;
      return;
    }
    await db.team.update({ where: { id: t.id }, data: { seasonSummary: summary } });
    ok++;
    if (ok % 25 === 0) console.log(`  …${ok} done`);
  });

  console.log(`Done. Set ${ok} summaries, ${empty} had no data (skipped).`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
