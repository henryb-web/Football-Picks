import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { formatKickoff } from "@/lib/format";
import type { PickResult } from "@/generated/prisma/client";

const RESULT_BADGE: Record<PickResult, { label: string; className: string }> = {
  WIN: { label: "Win", className: "bg-emerald-600 text-white" },
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
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-black tracking-tight">My Picks</h1>
      <p className="mt-1 text-sm text-muted">
        {picks.length} picks · {points} points · {wins}-{losses}-{pushes}
      </p>

      {picks.length === 0 ? (
        <p className="mt-6 rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
          You haven&apos;t made any picks yet.{" "}
          <Link href="/games" className="font-semibold text-emerald-500 hover:underline">
            Go pick some games →
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-2">
          {picks.map((p) => {
            const picked = p.side === "HOME" ? p.game.homeTeam : p.game.awayTeam;
            const badge = RESULT_BADGE[p.result];
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-cardborder bg-card p-4"
              >
                <div className="min-w-0">
                  <div className="text-sm">
                    <span className="font-semibold">{picked.displayName}</span>
                    <span className="text-muted">
                      {" "}
                      ({p.game.awayTeam.name} @ {p.game.homeTeam.name})
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    <span className="font-semibold text-emerald-500">
                      {LEAGUE_LABELS[p.game.league]}
                    </span>
                    {p.game.week ? ` · Wk ${p.game.week}` : ""} ·{" "}
                    {formatKickoff(p.game.kickoff)}
                    {p.game.status === "FINAL"
                      ? ` · Final ${p.game.awayScore}–${p.game.homeScore}`
                      : ""}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
