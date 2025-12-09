/*
  Warnings:

  - The values [DISCOVERY,PROPOSAL_SENT] on the enum `DealStage` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `ownerId` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DealStage_new" AS ENUM ('QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'PROPOSAL_PRICE_QUOTE', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
ALTER TABLE "public"."Deal" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "Deal" ALTER COLUMN "stage" TYPE "DealStage_new" USING ("stage"::text::"DealStage_new");
ALTER TYPE "DealStage" RENAME TO "DealStage_old";
ALTER TYPE "DealStage_new" RENAME TO "DealStage";
DROP TYPE "public"."DealStage_old";
ALTER TABLE "Deal" ALTER COLUMN "stage" SET DEFAULT 'QUALIFICATION';
COMMIT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ALTER COLUMN "stage" SET DEFAULT 'QUALIFICATION';

-- CreateIndex
CREATE INDEX "Deal_ownerId_stage_idx" ON "Deal"("ownerId", "stage");

-- CreateIndex
CREATE INDEX "Deal_ownerId_isDeleted_idx" ON "Deal"("ownerId", "isDeleted");

-- CreateIndex
CREATE INDEX "Deal_isDeleted_deletedAt_idx" ON "Deal"("isDeleted", "deletedAt");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
