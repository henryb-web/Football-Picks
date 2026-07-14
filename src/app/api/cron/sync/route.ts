import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncLeagueWeek } from "@/lib/ingest";

// Re-sync the active week(s) from ESPN so scores/odds stay current and picks
// get settled. Triggered by Vercel Cron (see vercel.json); also callable
// manually. Protected by CRON_SECRET — Vercel Cron sends it as a Bearer token.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only sync games in a window around now (a couple days back, a few ahead),
  // so each run touches just the current week(s) instead of the whole season.
  const now = Date.now();
  const from = new Date(now - 2 * 24 * 60 * 60 * 1000);
  const to = new Date(now + 5 * 24 * 60 * 60 * 1000);

  const active = await db.game.findMany({
    where: {
      league: { in: ["NFL", "CFB"] }, // HS6A has no ESPN feed (manual entry)
      week: { not: null },
      kickoff: { gte: from, lte: to },
    },
    select: { league: true, season: true, week: true },
    distinct: ["league", "week"],
    orderBy: [{ league: "asc" }, { week: "asc" }],
  });

  const synced: Array<Record<string, unknown>> = [];
  for (const a of active) {
    if (a.week == null) continue;
    try {
      const r = await syncLeagueWeek(a.league, a.season, a.week, 2);
      synced.push(r);
    } catch (e) {
      synced.push({
        league: a.league,
        week: a.week,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ok: true, at: new Date(now).toISOString(), synced });
}
