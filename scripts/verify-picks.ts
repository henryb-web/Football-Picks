// Dev check for pick persistence + lock logic (cleans up after itself).
import "dotenv/config";
import { db } from "@/lib/db";
import { isLocked } from "@/lib/picks";

async function main() {
  const user = await db.user.findFirst({ where: { passwordHash: { not: null } } });
  const game = await db.game.findFirst({
    where: { league: "NFL" },
    orderBy: { kickoff: "asc" },
  });
  if (!user || !game) throw new Error("need a user and an NFL game");

  const a = await db.pick.upsert({
    where: { userId_gameId: { userId: user.id, gameId: game.id } },
    create: { userId: user.id, gameId: game.id, side: "AWAY" },
    update: { side: "AWAY" },
  });
  const b = await db.pick.upsert({
    where: { userId_gameId: { userId: user.id, gameId: game.id } },
    create: { userId: user.id, gameId: game.id, side: "HOME" },
    update: { side: "HOME" },
  });
  console.log("pick saved then changed ->", a.side, "→", b.side);
  console.log("one row per user+game ->", a.id === b.id ? "OK" : "FAIL");
  console.log(
    "isLocked(upcoming scheduled) ->",
    isLocked(game) === false ? "OK (open)" : "FAIL",
  );

  await db.pick.delete({ where: { id: a.id } });
  console.log("cleaned up test pick");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
