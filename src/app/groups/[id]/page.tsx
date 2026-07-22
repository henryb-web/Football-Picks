import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Users } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Page } from "@/components/ui/Page";
import { Avatar } from "@/components/Avatar";
import { getGroupLeaderboard, getGroupMessages, isGroupMember } from "@/lib/pickem-groups";
import { getStandingsSeries } from "@/lib/scoring";
import { getStatsForUsers } from "@/lib/stats";
import { StreakFlame, BadgeChips } from "@/components/Badges";
import { StandingsChart } from "@/components/StandingsChart";
import { ShareCode } from "@/app/survivor/ShareCode";
import { JoinGroupForm } from "../JoinGroupForm";
import { DeleteGroupButton } from "../DeleteGroupButton";
import { ChatComposer } from "../ChatComposer";
import { joinGroupAction } from "../actions";

// Approximate relative time, computed at render (server-side, so no hydration
// mismatch — this page is a server component).
function ago(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function medalClass(i: number): string {
  return i === 0
    ? "text-amber-400"
    : i === 1
      ? "text-zinc-300"
      : i === 2
        ? "text-amber-700"
        : "text-muted";
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const group = await db.pickemGroup.findUnique({
    where: { id },
    include: {
      owner: { select: { username: true, name: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) notFound();

  const member = userId ? await isGroupMember(group.id, userId) : false;
  const isOwner = userId != null && group.ownerId === userId;
  const ownerName = group.owner.username ?? group.owner.name ?? "Someone";

  const header = (
    <>
      <Link href="/groups" className="text-sm text-accent-500 hover:underline">
        ← All groups
      </Link>
      <h1 className="headline mt-2 flex items-center gap-2 text-4xl">
        {group.isPrivate ? <Lock className="size-6 text-muted" aria-label="Private" /> : null}
        {group.name}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" /> {group._count.members}
        </span>
        · Owned by {ownerName}
      </p>
    </>
  );

  // Private groups are hidden from non-members: only a join-by-code prompt.
  if (group.isPrivate && !member) {
    return (
      <Page>
        {header}
        <div className="mt-6 max-w-md space-y-3">
          <p className="rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
            This is a private group. Enter its invite code to join.
          </p>
          {userId ? (
            <JoinGroupForm compact />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login" className="font-semibold text-accent-500 underline">
                Log in
              </Link>{" "}
              to join.
            </p>
          )}
        </div>
      </Page>
    );
  }

  const rows = await getGroupLeaderboard(group.id);
  const messages = await getGroupMessages(group.id);
  const series = await getStandingsSeries(rows.map((r) => r.userId));
  const stats = await getStatsForUsers(rows.map((r) => r.userId));

  return (
    <Page>
      {header}

      {/* Membership actions */}
      {!userId ? (
        <p className="mt-4 rounded-lg bg-accent-500/10 px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold text-accent-500 underline">Log in</Link>{" "}
          to join this group.
        </p>
      ) : member ? (
        <div className="mt-4 max-w-sm">
          <ShareCode code={group.joinCode} />
        </div>
      ) : (
        <form action={joinGroupAction} className="mt-4">
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            className="rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent-500"
          >
            Join this group
          </button>
        </form>
      )}

      {/* Group standings */}
      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">Standings</h2>
        {series.weeks.length >= 2 ? (
          <div className="mb-3">
            <StandingsChart data={series} meId={userId} />
          </div>
        ) : null}
        {rows.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No members yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-cardborder bg-card">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Player</th>
                  <th className="px-4 py-2.5 text-right">Points</th>
                  <th className="px-4 py-2.5 text-right">W-L-P</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cardborder">
                {rows.map((r, i) => (
                  <tr key={r.userId} className={r.userId === userId ? "bg-accent-500/10" : ""}>
                    <td className="px-4 py-3">
                      <span className={`font-display text-lg ${medalClass(i)}`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.name} size={30} image={r.image} emoji={r.avatarEmoji} color={r.avatarColor} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{r.name}</span>
                            <StreakFlame n={stats.get(r.userId)?.currentStreak ?? 0} />
                          </div>
                          <div className="mt-0.5">
                            <BadgeChips badges={stats.get(r.userId)?.badges ?? []} max={3} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-display text-lg tabular-nums">{r.points}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {r.wins}-{r.losses}-{r.pushes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trash talk */}
      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">Trash talk</h2>
        {messages.length === 0 ? (
          <p className="rounded-xl border border-cardborder bg-card p-5 text-sm text-muted">
            No chatter yet{member ? " — start it off." : "."}
          </p>
        ) : (
          <div className="space-y-3 rounded-xl border border-cardborder bg-card p-4">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <Avatar name={m.name} size={28} image={m.image} emoji={m.avatarEmoji} color={m.avatarColor} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{m.name}</span>
                    <span className="text-[11px] text-muted">{ago(m.createdAt)}</span>
                  </div>
                  <p className="break-words text-sm text-foreground/90">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {member ? <ChatComposer groupId={group.id} /> : null}
      </section>

      {/* Owner controls */}
      {isOwner ? (
        <section className="mt-10 border-t border-cardborder pt-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Owner controls
          </h2>
          <DeleteGroupButton groupId={group.id} />
        </section>
      ) : null}
    </Page>
  );
}
