-- Landed cost becomes COGS (materials + production + shipping), and fulfillment
-- moves to its own per-channel tables. The landed cost tables are renamed in
-- place, so existing versions (and demand plans' copies of them) are kept.
--
-- Column mapping. "amount" is untouched and still equals the sum of the parts:
--   production  -> production
--   repack      -> materials
--   fulfillment -> shipping
-- Review carried-over COGS versions in SKU settings: a value entered as the
-- old "fulfillment" part now reads as COGS "shipping".

-- ─── sku_landed_costs -> sku_cogs ────────────────────────────────────────────

ALTER TABLE "sku_landed_costs" RENAME TO "sku_cogs";

ALTER TABLE "sku_cogs" RENAME COLUMN "repack" TO "materials";

ALTER TABLE "sku_cogs" RENAME COLUMN "fulfillment" TO "shipping";

ALTER TABLE "sku_cogs" RENAME CONSTRAINT "sku_landed_costs_pkey" TO "sku_cogs_pkey";

ALTER TABLE "sku_cogs" RENAME CONSTRAINT "sku_landed_costs_skuSettingId_fkey" TO "sku_cogs_skuSettingId_fkey";

ALTER INDEX "sku_landed_costs_skuSettingId_effectiveFrom_idx" RENAME TO "sku_cogs_skuSettingId_effectiveFrom_idx";

ALTER INDEX "sku_landed_costs_skuSettingId_effectiveFrom_key" RENAME TO "sku_cogs_skuSettingId_effectiveFrom_key";

-- ─── demand_plan_landed_costs -> demand_plan_cogs ────────────────────────────

ALTER TABLE "demand_plan_landed_costs" RENAME TO "demand_plan_cogs";

ALTER TABLE "demand_plan_cogs" RENAME COLUMN "repack" TO "materials";

ALTER TABLE "demand_plan_cogs" RENAME COLUMN "fulfillment" TO "shipping";

ALTER TABLE "demand_plan_cogs" RENAME CONSTRAINT "demand_plan_landed_costs_pkey" TO "demand_plan_cogs_pkey";

ALTER TABLE "demand_plan_cogs" RENAME CONSTRAINT "demand_plan_landed_costs_planId_fkey" TO "demand_plan_cogs_planId_fkey";

ALTER TABLE "demand_plan_cogs" RENAME CONSTRAINT "demand_plan_landed_costs_skuSettingId_fkey" TO "demand_plan_cogs_skuSettingId_fkey";

ALTER INDEX "demand_plan_landed_costs_planId_skuSettingId_effectiveFrom_idx" RENAME TO "demand_plan_cogs_planId_skuSettingId_effectiveFrom_idx";

ALTER INDEX "demand_plan_landed_costs_planId_skuSettingId_effectiveFrom_key" RENAME TO "demand_plan_cogs_planId_skuSettingId_effectiveFrom_key";

-- ─── New: per-channel fulfillment cost (nothing to carry over) ───────────────

-- CreateTable
CREATE TABLE "sku_channel_fulfillment_costs" (
    "id" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "storage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pick" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pack" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_channel_fulfillment_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_plan_channel_fulfillment_costs" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "storage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pick" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pack" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_plan_channel_fulfillment_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sku_channel_fulfillment_costs_skuSettingId_channel_effectiv_idx" ON "sku_channel_fulfillment_costs"("skuSettingId", "channel", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sku_channel_fulfillment_costs_skuSettingId_channel_effectiv_key" ON "sku_channel_fulfillment_costs"("skuSettingId", "channel", "effectiveFrom");

-- CreateIndex
CREATE INDEX "demand_plan_channel_fulfillment_costs_planId_skuSettingId_c_idx" ON "demand_plan_channel_fulfillment_costs"("planId", "skuSettingId", "channel", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_channel_fulfillment_costs_planId_skuSettingId_c_key" ON "demand_plan_channel_fulfillment_costs"("planId", "skuSettingId", "channel", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "sku_channel_fulfillment_costs" ADD CONSTRAINT "sku_channel_fulfillment_costs_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_channel_fulfillment_costs" ADD CONSTRAINT "demand_plan_channel_fulfillment_costs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_channel_fulfillment_costs" ADD CONSTRAINT "demand_plan_channel_fulfillment_costs_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
