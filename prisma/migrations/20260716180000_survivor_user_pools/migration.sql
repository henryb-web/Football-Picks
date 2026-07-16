-- Survivor pools become user-owned, joinable, and public/private.

-- 1. New columns (nullable first so existing rows can be backfilled).
ALTER TABLE "SurvivorPool" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SurvivorPool" ADD COLUMN "joinCode" TEXT;
ALTER TABLE "SurvivorPool" ADD COLUMN "ownerId" TEXT;

-- 2. Backfill existing pools: owner = first admin (else first user), random code.
UPDATE "SurvivorPool"
SET "ownerId" = COALESCE(
  (SELECT "id" FROM "User" WHERE "isAdmin" = true ORDER BY "createdAt" ASC LIMIT 1),
  (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "ownerId" IS NULL;

UPDATE "SurvivorPool"
SET "joinCode" = upper(substr(md5(random()::text || "id"), 1, 6))
WHERE "joinCode" IS NULL;

-- 3. Membership table.
CREATE TABLE "SurvivorEntry" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurvivorEntry_pkey" PRIMARY KEY ("id")
);

-- 4. Backfill memberships from anyone who already has a pick.
INSERT INTO "SurvivorEntry" ("id", "poolId", "userId", "joinedAt")
SELECT DISTINCT md5(random()::text || "poolId" || "userId"), "poolId", "userId", CURRENT_TIMESTAMP
FROM "SurvivorPick";

-- 5. Drop the one-pool-per-league limit; enforce the new constraints.
DROP INDEX IF EXISTS "SurvivorPool_league_season_key";
ALTER TABLE "SurvivorPool" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "SurvivorPool" ALTER COLUMN "joinCode" SET NOT NULL;

CREATE UNIQUE INDEX "SurvivorPool_joinCode_key" ON "SurvivorPool"("joinCode");
CREATE INDEX "SurvivorPool_ownerId_idx" ON "SurvivorPool"("ownerId");
ALTER TABLE "SurvivorPool"
  ADD CONSTRAINT "SurvivorPool_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "SurvivorEntry_poolId_userId_key" ON "SurvivorEntry"("poolId", "userId");
CREATE INDEX "SurvivorEntry_poolId_idx" ON "SurvivorEntry"("poolId");
ALTER TABLE "SurvivorEntry"
  ADD CONSTRAINT "SurvivorEntry_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "SurvivorPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SurvivorEntry"
  ADD CONSTRAINT "SurvivorEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
