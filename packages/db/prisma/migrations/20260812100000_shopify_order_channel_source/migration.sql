-- AlterTable
ALTER TABLE "shopify_orders" ADD COLUMN "sourceName" TEXT;

-- CreateIndex
CREATE INDEX "shopify_orders_sourceName_idx" ON "shopify_orders"("sourceName");
