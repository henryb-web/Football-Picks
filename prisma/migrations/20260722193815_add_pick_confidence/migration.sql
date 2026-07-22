-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('STRONG', 'LOCK');

-- AlterTable
ALTER TABLE "Pick" ADD COLUMN     "confidence" "Confidence";
