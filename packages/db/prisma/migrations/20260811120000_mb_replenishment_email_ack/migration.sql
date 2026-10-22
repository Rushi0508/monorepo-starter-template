-- AlterTable
ALTER TABLE "configurations" ADD COLUMN "mbDistributorEmail" TEXT;

-- AlterTable
ALTER TABLE "replenishment_orders" ADD COLUMN "emailSentAt" TIMESTAMP(3),
ADD COLUMN "emailAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN "gmailThreadId" TEXT,
ADD COLUMN "gmailMessageId" TEXT;

-- CreateIndex
CREATE INDEX "replenishment_orders_gmailThreadId_idx" ON "replenishment_orders"("gmailThreadId");
