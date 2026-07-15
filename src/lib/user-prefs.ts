import { auth } from "@/auth";
import { db } from "@/lib/db";

// The logged-in user's preferred time zone for displaying kickoff times.
// Falls back to US Central for guests or if anything goes wrong.
export async function getUserTimeZone(): Promise<string> {
  try {
    const session = await auth();
    if (!session?.user?.id) return "America/Chicago";
    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });
    return u?.timezone || "America/Chicago";
  } catch {
    return "America/Chicago";
  }
}
