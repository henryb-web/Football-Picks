import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isLocked } from "@/lib/picks";
import {
  getConsensus,
  makeLastGameResolver,
  makeRecordResolver,
  toGameCardData,
} from "@/lib/game-card";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { MyPickCard } from "@/components/games/MyPickCard";

export default async function MyPicksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const picks = await db.pick.findMany({
    where: { userId: session.user.id },
    include: { game: { include: { homeTeam: true, awayTeam: true } } },
    orderBy: { game: { kickoff: "desc" } },
  });

  const points = picks.reduce((sum, p) => sum + p.pointsAwarded, 0);
  const wins = picks.filter((p) => p.result === "WIN").length;
  const losses = picks.filter((p) => p.result === "LOSS").length;
  const pushes = picks.filter((p) => p.result === "PUSH").length;

  const recordFor = await makeRecordResolver(picks.map((p) => p.game));
  const lastGameFor = await makeLastGameResolver(picks.map((p) => p.game));
  const consensus = await getConsensus(picks.map((p) => p.gameId));

  return (
    <Page>
      <PageHeader
        title="My Picks"
        subtitle={`${picks.length} picks · ${points} points · ${wins}-${losses}-${pushes}`}
      />

      {picks.length === 0 ? (
        <EmptyState icon={ClipboardList}>
          You haven&apos;t made any picks yet.{" "}
          <Link href="/games" className="font-semibold text-cyan-500 hover:underline">
            Go pick some games →
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {picks.map((p) => (
            <MyPickCard
              key={p.id}
              game={toGameCardData(p.game, recordFor, lastGameFor)}
              side={p.side}
              result={p.result}
              consensus={consensus.get(p.gameId) ?? { home: 0, away: 0 }}
              locked={isLocked(p.game)}
              loggedIn
            />
          ))}
        </div>
      )}
    </Page>
  );
}
