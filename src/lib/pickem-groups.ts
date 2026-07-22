import { db } from "@/lib/db";
import { getLeaderboard, type LeaderboardRow } from "@/lib/scoring";

export type GroupResult = { ok: true } | { error: string };

// Short, unambiguous join code (no 0/O/1/I/L) — same alphabet as survivor.
function generateJoinCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export async function createPickemGroup(input: {
  ownerId: string;
  name: string;
  isPrivate: boolean;
}): Promise<{ id: string } | { error: string }> {
  let joinCode = generateJoinCode();
  for (let i = 0; i < 6; i++) {
    const clash = await db.pickemGroup.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode();
  }
  const group = await db.pickemGroup.create({
    data: {
      name: input.name,
      isPrivate: input.isPrivate,
      joinCode,
      ownerId: input.ownerId,
      members: { create: { userId: input.ownerId } }, // owner auto-joins
    },
    select: { id: true },
  });
  return group;
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const m = await db.pickemMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return Boolean(m);
}

export async function joinGroup(userId: string, groupId: string): Promise<GroupResult> {
  const g = await db.pickemGroup.findUnique({ where: { id: groupId } });
  if (!g) return { error: "That group doesn't exist." };
  await db.pickemMembership.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId },
    update: {},
  });
  return { ok: true };
}

export async function joinGroupByCode(
  userId: string,
  code: string,
): Promise<{ ok: true; groupId: string } | { error: string }> {
  const g = await db.pickemGroup.findUnique({
    where: { joinCode: code.trim().toUpperCase() },
  });
  if (!g) return { error: "No group with that code." };
  await db.pickemMembership.upsert({
    where: { groupId_userId: { groupId: g.id, userId } },
    create: { groupId: g.id, userId },
    update: {},
  });
  return { ok: true, groupId: g.id };
}

export async function deletePickemGroup(
  userId: string,
  groupId: string,
): Promise<GroupResult> {
  const g = await db.pickemGroup.findUnique({
    where: { id: groupId },
    select: { ownerId: true },
  });
  if (!g) return { error: "Group not found." };
  if (g.ownerId !== userId) {
    return { error: "Only the group's owner can delete it." };
  }
  await db.pickemGroup.delete({ where: { id: groupId } });
  return { ok: true };
}

// --- Trash talk ---

export type GroupMessageRow = {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  name: string;
  image: string | null;
  avatarColor: string | null;
  avatarEmoji: string | null;
};

export async function getGroupMessages(
  groupId: string,
  limit = 50,
): Promise<GroupMessageRow[]> {
  const msgs = await db.groupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { username: true, name: true, image: true, avatarColor: true, avatarEmoji: true } },
    },
  });
  return msgs
    .map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      userId: m.userId,
      name: m.user.username ?? m.user.name ?? "Player",
      image: m.user.image,
      avatarColor: m.user.avatarColor,
      avatarEmoji: m.user.avatarEmoji,
    }))
    .reverse(); // oldest -> newest for chat display
}

export async function postGroupMessage(
  userId: string,
  groupId: string,
  body: string,
): Promise<GroupResult> {
  const text = body.trim();
  if (!text) return { error: "Say something first." };
  if (text.length > 500) return { error: "Keep it under 500 characters." };
  if (!(await isGroupMember(groupId, userId))) {
    return { error: "Join the group to post." };
  }
  await db.groupMessage.create({ data: { groupId, userId, body: text } });
  return { ok: true };
}

// Group standings: the global leaderboard scoped to members, plus any members
// who haven't made a settled pick yet (shown 0–0 so the whole group appears).
export async function getGroupLeaderboard(groupId: string): Promise<LeaderboardRow[]> {
  const members = await db.pickemMembership.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const ids = members.map((m) => m.userId);
  if (ids.length === 0) return [];

  const board = await getLeaderboard(ids);
  const present = new Set(board.map((r) => r.userId));
  const missingIds = ids.filter((id) => !present.has(id));
  if (missingIds.length > 0) {
    const users = await db.user.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, username: true, name: true, image: true, avatarColor: true, avatarEmoji: true },
    });
    for (const u of users) {
      board.push({
        userId: u.id,
        name: u.username ?? u.name ?? "Player",
        image: u.image,
        avatarColor: u.avatarColor,
        avatarEmoji: u.avatarEmoji,
        points: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        total: 0,
        form: [],
        movement: null,
      });
    }
  }
  return board;
}
