-- CreateEnum
CREATE TYPE "SurvivorResult" AS ENUM ('PENDING', 'WIN', 'LOSS');

-- CreateTable
CREATE TABLE "SurvivorPool" (
    "id" TEXT NOT NULL,
    "league" "League" NOT NULL,
    "season" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurvivorPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurvivorPick" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "result" "SurvivorResult" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurvivorPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurvivorPool_league_season_key" ON "SurvivorPool"("league", "season");

-- CreateIndex
CREATE INDEX "SurvivorPick_gameId_idx" ON "SurvivorPick"("gameId");

-- CreateIndex
CREATE INDEX "SurvivorPick_poolId_idx" ON "SurvivorPick"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "SurvivorPick_poolId_userId_week_key" ON "SurvivorPick"("poolId", "userId", "week");

-- AddForeignKey
ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "SurvivorPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurvivorPick" ADD CONSTRAINT "SurvivorPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
