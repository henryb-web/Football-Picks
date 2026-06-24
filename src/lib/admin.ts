import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Guard for admin-only pages and server actions. Redirects non-admins away.
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/");
  return session;
}
