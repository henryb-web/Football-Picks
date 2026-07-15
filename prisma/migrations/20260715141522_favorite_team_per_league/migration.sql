-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "favoriteTeamId", ADD COLUMN "favoriteNflId" TEXT, ADD COLUMN "favoriteCfbId" TEXT, ADD COLUMN "favoriteHs6aId" TEXT;
