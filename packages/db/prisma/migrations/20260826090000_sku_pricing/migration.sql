-- AlterTable
ALTER TABLE "production_runs" DROP COLUMN "cogsPerCase";

-- CreateTable
CREATE TABLE "sku_landed_costs" (
    "id" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_landed_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku_channel_prices" (
    "id" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_channel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sku_landed_costs_skuSettingId_effectiveFrom_idx" ON "sku_landed_costs"("skuSettingId", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sku_landed_costs_skuSettingId_effectiveFrom_key" ON "sku_landed_costs"("skuSettingId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "sku_channel_prices_skuSettingId_channel_effectiveFrom_idx" ON "sku_channel_prices"("skuSettingId", "channel", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sku_channel_prices_skuSettingId_channel_effectiveFrom_key" ON "sku_channel_prices"("skuSettingId", "channel", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "sku_landed_costs" ADD CONSTRAINT "sku_landed_costs_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_channel_prices" ADD CONSTRAINT "sku_channel_prices_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

