import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncNflWeek } from "@/lib/ingest";

// Admin-only programmatic NFL sync. Also the seam a scheduler can hit later.
// POST /api/admin/sync/nfl?season=2025&week=1&seasonType=2
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const season = Number(url.searchParams.get("season"));
  const week = Number(url.searchParams.get("week"));
  const seasonType = Number(url.searchParams.get("seasonType")) || 2;
  if (!Number.isInteger(season) || !Number.isInteger(week)) {
    return NextResponse.json(
      { error: "season and week query params are required integers" },
      { status: 400 },
    );
  }

  try {
    const result = await syncNflWeek(season, week, seasonType);
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "sync failed" },
      { status: 502 },
    );
  }
}
