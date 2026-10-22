-- AlterTable
ALTER TABLE "sku_landed_costs" ADD COLUMN     "fulfillment" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "production" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "repack" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sku_msrps" (
    "id" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_msrps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sku_msrps_skuSettingId_effectiveFrom_idx" ON "sku_msrps"("skuSettingId", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sku_msrps_skuSettingId_effectiveFrom_key" ON "sku_msrps"("skuSettingId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "sku_msrps" ADD CONSTRAINT "sku_msrps_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
