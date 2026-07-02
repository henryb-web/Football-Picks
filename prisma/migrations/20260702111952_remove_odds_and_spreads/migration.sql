-- DropForeignKey
ALTER TABLE "Line" DROP CONSTRAINT "Line_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Pick" DROP CONSTRAINT "Pick_lineId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "scoringMode";

-- AlterTable
ALTER TABLE "Pick" DROP COLUMN "lineId",
DROP COLUMN "spreadAtPick";

-- DropTable
DROP TABLE "Line";

-- DropEnum
DROP TYPE "ScoringMode";
