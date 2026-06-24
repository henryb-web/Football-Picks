import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { toDatetimeLocalValue } from "@/lib/format";
import { EditGameForm } from "@/components/admin/EditGameForm";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const game = await db.game.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!game) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <Link href="/admin" className="text-sm text-emerald-600 hover:underline">
        ← Back to admin
      </Link>
      <h1 className="mt-3 text-2xl font-black tracking-tight">Edit game</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {game.awayTeam.displayName} @ {game.homeTeam.displayName}
      </p>

      <div className="mt-6">
        <EditGameForm
          game={{
            id: game.id,
            league: game.league,
            season: game.season,
            week: game.week,
            kickoffValue: toDatetimeLocalValue(game.kickoff),
            awayName: game.awayTeam.displayName,
            homeName: game.homeTeam.displayName,
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            isManual: game.externalSource === "manual",
          }}
        />
      </div>
    </main>
  );
}
