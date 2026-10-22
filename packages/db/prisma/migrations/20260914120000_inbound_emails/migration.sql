-- pod_emails becomes inbound_emails, holding both POD and pickup emails.
-- Renamed in place so existing POD emails (and the order_email_flows links
-- to them) are kept.

-- Enums
ALTER TYPE "PodEmailStatus" RENAME TO "InboundEmailStatus";

CREATE TYPE "InboundEmailType" AS ENUM ('POD', 'PICKUP');

-- Table, constraint and indexes
ALTER TABLE "pod_emails" RENAME TO "inbound_emails";

ALTER TABLE "inbound_emails" RENAME CONSTRAINT "pod_emails_pkey" TO "inbound_emails_pkey";

ALTER INDEX "pod_emails_gmailMessageId_key" RENAME TO "inbound_emails_gmailMessageId_key";

ALTER INDEX "pod_emails_receivedAt_idx" RENAME TO "inbound_emails_receivedAt_idx";

DROP INDEX "pod_emails_status_idx";

-- OCR output is no longer POD-only
ALTER TABLE "inbound_emails" RENAME COLUMN "podData" TO "extractedData";

-- Every existing row is a POD email; the default only backfills them
ALTER TABLE "inbound_emails" ADD COLUMN "type" "InboundEmailType" NOT NULL DEFAULT 'POD';

ALTER TABLE "inbound_emails" ALTER COLUMN "type" DROP DEFAULT;

CREATE INDEX "inbound_emails_type_status_idx" ON "inbound_emails"("type", "status");

-- Pickup confirmation now links to the stored pickup email instead of a
-- Gmail thread id
ALTER TABLE "replenishment_orders" DROP COLUMN "pickupGmailThreadId",
ADD COLUMN "pickupEmailId" UUID;

CREATE INDEX "replenishment_orders_pickupEmailId_idx" ON "replenishment_orders"("pickupEmailId");

ALTER TABLE "replenishment_orders" ADD CONSTRAINT "replenishment_orders_pickupEmailId_fkey" FOREIGN KEY ("pickupEmailId") REFERENCES "inbound_emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
