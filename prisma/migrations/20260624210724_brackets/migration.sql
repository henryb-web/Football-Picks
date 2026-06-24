-- CreateEnum
CREATE TYPE "BracketStatus" AS ENUM ('SETUP', 'OPEN', 'LOCKED', 'COMPLETE');

-- CreateTable
CREATE TABLE "Bracket" (
    "id" TEXT NOT NULL,
    "league" "League" NOT NULL,
    "season" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BracketStatus" NOT NULL DEFAULT 'SETUP',
    "lockAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BracketEntry" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "group" TEXT,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "BracketEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BracketGame" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "group" TEXT,
    "label" TEXT NOT NULL,
    "topSeed" INTEGER,
    "topGroup" TEXT,
    "topFromSlot" INTEGER,
    "bottomSeed" INTEGER,
    "bottomGroup" TEXT,
    "bottomFromSlot" INTEGER,
    "winnerSeed" INTEGER,
    "winnerGroup" TEXT,

    CONSTRAINT "BracketGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BracketPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bracketGameId" TEXT NOT NULL,
    "predSeed" INTEGER NOT NULL,
    "predGroup" TEXT,
    "correct" BOOLEAN,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BracketPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bracket_league_season_key" ON "Bracket"("league", "season");

-- CreateIndex
CREATE INDEX "BracketEntry_bracketId_idx" ON "BracketEntry"("bracketId");

-- CreateIndex
CREATE UNIQUE INDEX "BracketEntry_bracketId_group_seed_key" ON "BracketEntry"("bracketId", "group", "seed");

-- CreateIndex
CREATE INDEX "BracketGame_bracketId_idx" ON "BracketGame"("bracketId");

-- CreateIndex
CREATE UNIQUE INDEX "BracketGame_bracketId_slot_key" ON "BracketGame"("bracketId", "slot");

-- CreateIndex
CREATE INDEX "BracketPick_bracketGameId_idx" ON "BracketPick"("bracketGameId");

-- CreateIndex
CREATE UNIQUE INDEX "BracketPick_userId_bracketGameId_key" ON "BracketPick"("userId", "bracketGameId");

-- AddForeignKey
ALTER TABLE "BracketEntry" ADD CONSTRAINT "BracketEntry_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketGame" ADD CONSTRAINT "BracketGame_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "Bracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketPick" ADD CONSTRAINT "BracketPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketPick" ADD CONSTRAINT "BracketPick_bracketGameId_fkey" FOREIGN KEY ("bracketGameId") REFERENCES "BracketGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
