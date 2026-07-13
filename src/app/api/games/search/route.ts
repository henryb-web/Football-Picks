import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isLeague } from "@/lib/leagues";

// Typeahead for the Games search box: games where either team's name matches
// the query. GET /api/games/search?q=<text>&league=<NFL|CFB|HS6A>
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const leagueParam = url.searchParams.get("league");
  const league = leagueParam && isLeague(leagueParam) ? leagueParam : null;

  if (q.length < 2) return NextResponse.json({ games: [] });

  const nameMatch = {
    OR: [
      { displayName: { contains: q, mode: "insensitive" as const } },
      { name: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const games = await db.game.findMany({
    where: {
      ...(league ? { league } : {}),
      OR: [{ homeTeam: nameMatch }, { awayTeam: nameMatch }],
    },
    select: {
      id: true,
      league: true,
      week: true,
      kickoff: true,
      homeTeam: { select: { displayName: true } },
      awayTeam: { select: { displayName: true } },
    },
    orderBy: { kickoff: "asc" },
    take: 8,
  });

  return NextResponse.json({
    games: games.map((g) => ({
      id: g.id,
      league: g.league,
      week: g.week,
      kickoffISO: g.kickoff.toISOString(),
      home: g.homeTeam.displayName,
      away: g.awayTeam.displayName,
    })),
  });
}
