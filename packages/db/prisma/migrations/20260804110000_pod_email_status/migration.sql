-- CreateEnum
CREATE TYPE "PodEmailStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED');

-- AlterTable
ALTER TABLE "pod_emails" ADD COLUMN "status" "PodEmailStatus" NOT NULL DEFAULT 'PENDING';

-- Migrate existing boolean
UPDATE "pod_emails" SET "status" = 'PROCESSED' WHERE "isProcessed" = true;

-- DropIndex
DROP INDEX IF EXISTS "pod_emails_isProcessed_idx";

-- AlterTable
ALTER TABLE "pod_emails" DROP COLUMN "isProcessed";

-- CreateIndex
CREATE INDEX "pod_emails_status_idx" ON "pod_emails"("status");
