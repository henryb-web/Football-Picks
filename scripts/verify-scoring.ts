// Dev check for grading + leaderboard (cleans up after itself).
import "dotenv/config";
import { db } from "@/lib/db";
import { createManualGame } from "@/lib/ingest/manual";
import { getLeaderboard, settleGame } from "@/lib/scoring";

async function main() {
  const users = await db.user.findMany({ take: 2, orderBy: { createdAt: "asc" } });
  if (users.length < 2) throw new Error("need 2 users to test");
  const [u1, u2] = users;

  const game = await createManualGame({
    league: "NFL",
    season: 2099,
    week: 1,
    kickoff: new Date("2099-01-01T00:00:00"),
    homeName: "Test Home",
    awayName: "Test Away",
  });
  await db.pick.create({ data: { userId: u1.id, gameId: game.id, side: "AWAY" } });
  await db.pick.create({ data: { userId: u2.id, gameId: game.id, side: "HOME" } });

  // Away wins 27-20.
  await db.game.update({
    where: { id: game.id },
    data: { status: "FINAL", awayScore: 27, homeScore: 20 },
  });
  await settleGame(game.id);

  const graded = await db.pick.findMany({ where: { gameId: game.id } });
  for (const p of graded) {
    console.log(`  ${p.side} -> ${p.result} (${p.pointsAwarded}pt)`);
  }

  const board = await getLeaderboard();
  const u1row = board.find((r) => r.userId === u1.id);
  console.log("  leaderboard has AWAY-picker with >=1 pt ->", (u1row?.points ?? 0) >= 1 ? "OK" : "FAIL");

  // Un-finalize -> picks should revert to pending.
  await db.game.update({ where: { id: game.id }, data: { status: "SCHEDULED" } });
  await settleGame(game.id);
  const reverted = await db.pick.findMany({ where: { gameId: game.id } });
  console.log(
    "  reset on un-final ->",
    reverted.every((p) => p.result === "PENDING" && p.pointsAwarded === 0) ? "OK" : "FAIL",
  );

  await db.game.delete({ where: { id: game.id } }); // cascades picks
  console.log("  cleaned up");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
