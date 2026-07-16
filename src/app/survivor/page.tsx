import Link from "next/link";
import { Skull, Lock, Users } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LEAGUE_LABELS } from "@/lib/leagues";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { CreatePoolForm } from "./CreatePoolForm";
import { JoinByCodeForm } from "./JoinByCodeForm";

type PoolRow = {
  id: string;
  title: string;
  league: keyof typeof LEAGUE_LABELS;
  season: number;
  isPrivate: boolean;
  members: number;
};

function PoolCard({ p, tag }: { p: PoolRow; tag?: string }) {
  return (
    <Link
      href={`/survivor/${p.id}`}
      className="lift flex items-center justify-between rounded-xl border border-cardborder bg-card p-4 hover:border-accent-500/50"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-bold">
          {p.isPrivate ? <Lock className="size-3.5 text-muted" aria-label="Private" /> : null}
          <span className="truncate">{p.title}</span>
          {tag ? (
            <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-500">
              {tag}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          <span className="font-semibold text-accent-500">{LEAGUE_LABELS[p.league]}</span> · {p.season}
        </div>
      </div>
      <span className="flex flex-none items-center gap-1 text-xs text-muted">
        <Users className="size-3.5" />
        {p.members}
      </span>
    </Link>
  );
}

export default async function SurvivorListPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const myEntries = userId
    ? await db.survivorEntry.findMany({
        where: { userId },
        include: {
          pool: { include: { _count: { select: { members: true } } } },
        },
        orderBy: { joinedAt: "desc" },
      })
    : [];
  const myPools: PoolRow[] = myEntries
    .filter((e) => e.pool.active)
    .map((e) => ({
      id: e.pool.id,
      title: e.pool.title,
      league: e.pool.league,
      season: e.pool.season,
      isPrivate: e.pool.isPrivate,
      members: e.pool._count.members,
    }));
  const myPoolIds = new Set(myPools.map((p) => p.id));

  const publicRows = await db.survivorPool.findMany({
    where: { active: true, isPrivate: false },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  const publicPools: PoolRow[] = publicRows
    .filter((p) => !myPoolIds.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      league: p.league,
      season: p.season,
      isPrivate: p.isPrivate,
      members: p._count.members,
    }));

  return (
    <Page>
      <PageHeader title="Survivor" />

      {userId ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CreatePoolForm />
          <div className="space-y-4">
            <JoinByCodeForm />
            <p className="rounded-xl border border-cardborder bg-card p-4 text-sm text-muted">
              Pick one team to win each week. Never reuse a team. One loss and
              you&apos;re out — last one standing wins.
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold text-accent-500 underline">Log in</Link>{" "}
          to create or join a survivor pool.
        </p>
      )}

      {myPools.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-bold">Your pools</h2>
          <div className="space-y-2">
            {myPools.map((p) => (
              <PoolCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">Public pools</h2>
        {publicPools.length === 0 ? (
          <EmptyState icon={Skull}>
            No public pools yet — create one above to get started.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {publicPools.map((p) => (
              <PoolCard key={p.id} p={p} tag="Join" />
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
