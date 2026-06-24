import type { GameStatus } from "@/generated/prisma/client";

// A game is locked for picking once it's no longer scheduled or its lock time
// (kickoff) has passed.
export function isLocked(game: {
  status: GameStatus;
  pickLockAt: Date;
}): boolean {
  return game.status !== "SCHEDULED" || game.pickLockAt.getTime() <= Date.now();
}
