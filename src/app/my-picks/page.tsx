import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { TeamLogo } from "@/components/games/TeamLogo";
import type { PickResult } from "@/generated/prisma/client";

const RESULT_BADGE: Record<PickResult, { label: string; className: string }> = {
  WIN: { label: "Win", className: "bg-cyan-600 text-white" },
  LOSS: { label: "Loss", className: "bg-red-600 text-white" },
  PUSH: { label: "Push", className: "bg-neutral-500 text-white" },
  VOID: { label: "Void", className: "bg-neutral-600 text-white" },
  PENDING: { label: "Pending", className: "bg-background text-muted" },
};

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
          {picks.map((p) => {
            const picked = p.side === "HOME" ? p.game.homeTeam : p.game.awayTeam;
            const badge = RESULT_BADGE[p.result];
            return (
              <div
                key={p.id}
                className="lift relative flex overflow-hidden rounded-xl border border-cardborder bg-card"
              >
                {/* picked-team color edge */}
                <span
                  aria-hidden
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: picked.color ? `#${picked.color}` : "var(--muted)" }}
                />
                {/* stub: the matchup + pick */}
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-center gap-2">
                    <TeamLogo logo={picked.logo} color={picked.color} size={22} />
                    <span className="headline text-lg">{picked.displayName}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    <span className="font-semibold text-cyan-500">
                      {LEAGUE_LABELS[p.game.league]}
                    </span>
                    {p.game.week ? ` · Wk ${p.game.week}` : ""} ·{" "}
                    {p.game.awayTeam.name} @ {p.game.homeTeam.name} ·{" "}
                    {formatKickoff(p.game.kickoff)}
                    {p.game.status === "FINAL"
                      ? ` · Final ${p.game.awayScore}–${p.game.homeScore}`
                      : ""}
                  </div>
                </div>
                {/* perforated result stub */}
                <div className="relative flex w-28 shrink-0 items-center justify-center border-l border-dashed border-cardborder">
                  <span className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
                  <span className="absolute bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-background" />
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
