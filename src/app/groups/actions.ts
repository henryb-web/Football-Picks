"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createPickemGroup,
  joinGroup,
  joinGroupByCode,
  deletePickemGroup,
} from "@/lib/pickem-groups";
import type { FormState } from "@/lib/form-state";

export async function createGroupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to create a group." };
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Give your group a name (3+ characters)." };
  // Default private; a "public" visibility makes it listable/joinable by anyone.
  const isPrivate = String(formData.get("visibility") ?? "private") !== "public";

  const res = await createPickemGroup({ ownerId: session.user.id, name, isPrivate });
  if ("error" in res) return { error: res.error };

  revalidatePath("/groups");
  redirect(`/groups/${res.id}`);
}

export async function joinByCodeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to join a group." };
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter a join code." };

  const res = await joinGroupByCode(session.user.id, code);
  if ("error" in res) return { error: res.error };

  revalidatePath("/groups");
  redirect(`/groups/${res.groupId}`);
}

// Join a public group (button on the group page).
export async function joinGroupAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;
  await joinGroup(session.user.id, groupId);
  revalidatePath(`/groups/${groupId}`);
}

export async function deleteGroupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to delete a group." };
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return { error: "Missing group." };

  const res = await deletePickemGroup(session.user.id, groupId);
  if ("error" in res) return { error: res.error };

  revalidatePath("/groups");
  redirect("/groups");
}
