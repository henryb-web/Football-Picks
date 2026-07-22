import Link from "next/link";
import { Users, Lock, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Page, PageHeader, EmptyState } from "@/components/ui/Page";
import { CreateGroupForm } from "./CreateGroupForm";
import { JoinGroupForm } from "./JoinGroupForm";

type GroupRow = { id: string; name: string; isPrivate: boolean; members: number };

function GroupCard({ g, tag }: { g: GroupRow; tag?: string }) {
  return (
    <Link
      href={`/groups/${g.id}`}
      className="lift flex items-center justify-between rounded-xl border border-cardborder bg-card p-4 hover:border-accent-500/50"
    >
      <div className="flex min-w-0 items-center gap-2 font-bold">
        {g.isPrivate ? <Lock className="size-3.5 text-muted" aria-label="Private" /> : null}
        <span className="truncate">{g.name}</span>
        {tag ? (
          <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-500">
            {tag}
          </span>
        ) : null}
      </div>
      <span className="flex flex-none items-center gap-1 text-xs text-muted">
        <Users className="size-3.5" />
        {g.members}
      </span>
    </Link>
  );
}

export default async function GroupsListPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const myMemberships = userId
    ? await db.pickemMembership.findMany({
        where: { userId },
        include: { group: { include: { _count: { select: { members: true } } } } },
        orderBy: { joinedAt: "desc" },
      })
    : [];
  const myGroups: GroupRow[] = myMemberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    isPrivate: m.group.isPrivate,
    members: m.group._count.members,
  }));
  const myIds = new Set(myGroups.map((g) => g.id));

  const publicRows = await db.pickemGroup.findMany({
    where: { isPrivate: false },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  const publicGroups: GroupRow[] = publicRows
    .filter((g) => !myIds.has(g.id))
    .map((g) => ({ id: g.id, name: g.name, isPrivate: g.isPrivate, members: g._count.members }));

  return (
    <Page>
      <PageHeader title="Groups" />

      {userId ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <CreateGroupForm />
          <div className="space-y-4">
            <JoinGroupForm />
            <p className="rounded-xl border border-cardborder bg-card p-4 text-sm text-muted">
              A group is a private leaderboard for you and your friends — you
              still make your picks once, and the group ranks just its members.
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold text-accent-500 underline">Log in</Link>{" "}
          to create or join a group.
        </p>
      )}

      {myGroups.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-bold">Your groups</h2>
          <div className="space-y-2">
            {myGroups.map((g) => (
              <GroupCard key={g.id} g={g} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">Public groups</h2>
        {publicGroups.length === 0 ? (
          <EmptyState icon={UsersRound}>
            No public groups yet — create one above, or join by code.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {publicGroups.map((g) => (
              <GroupCard key={g.id} g={g} tag="Join" />
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
