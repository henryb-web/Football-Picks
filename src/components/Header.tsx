import { auth } from "@/auth";
import { MainNav } from "@/components/MainNav";

export async function Header() {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.username ?? session.user.name ?? session.user.email ?? "You",
        isAdmin: Boolean(session.user.isAdmin),
      }
    : null;

  return <MainNav user={user} />;
}
