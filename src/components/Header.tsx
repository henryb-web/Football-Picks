import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MainNav } from "@/components/MainNav";

export async function Header() {
  const session = await auth();
  let user = null;
  if (session?.user?.id) {
    try {
      const u = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          username: true, name: true, email: true,
          image: true, avatarColor: true, avatarEmoji: true, isAdmin: true,
        },
      });
      if (u) {
        user = {
          name: u.username ?? u.name ?? u.email ?? "You",
          isAdmin: Boolean(u.isAdmin),
          image: u.image,
          emoji: u.avatarEmoji,
          color: u.avatarColor,
        };
      }
    } catch {
      // Fall back to session claims if the DB read fails.
      user = {
        name: session.user.username ?? session.user.name ?? "You",
        isAdmin: Boolean(session.user.isAdmin),
        image: null,
        emoji: null,
        color: null,
      };
    }
  }

  return <MainNav user={user} />;
}
