import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncLeagueWeek } from "@/lib/ingest";
import { isLeague } from "@/lib/leagues";

// Admin-only programmatic sync. Also the seam a scheduler can hit later.
// POST /api/admin/sync?league=NFL&season=2026&week=1&seasonType=2
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const league = url.searchParams.get("league") ?? "";
  const season = Number(url.searchParams.get("season"));
  const week = Number(url.searchParams.get("week"));
  const seasonType = Number(url.searchParams.get("seasonType")) || 2;

  if (!isLeague(league) || league === "HS6A") {
    return NextResponse.json(
      { error: "league must be NFL or CFB" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(season) || !Number.isInteger(week)) {
    return NextResponse.json(
      { error: "season and week query params are required integers" },
      { status: 400 },
    );
  }

  try {
    const result = await syncLeagueWeek(league, season, week, seasonType);
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "sync failed" },
      { status: 502 },
    );
  }
}
