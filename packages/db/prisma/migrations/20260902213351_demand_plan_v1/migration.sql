-- CreateEnum
CREATE TYPE "ForecastMethodType" AS ENUM ('STATIC_GROWTH', 'HISTORICAL_AVERAGE', 'HARD_ENTRY');

-- CreateEnum
CREATE TYPE "DemandOverrideReason" AS ENUM ('PROMOTION', 'CUSTOMER_COMMITMENT', 'SALES_INPUT', 'MARKETING_CAMPAIGN', 'INVENTORY_CONSTRAINT', 'NEW_CUSTOMER', 'MARKET_TREND', 'MANUAL_ADJUSTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "demand_plans" ADD COLUMN     "channels" TEXT[],
ADD COLUMN     "defaultMethod" "ForecastMethodType" NOT NULL DEFAULT 'HISTORICAL_AVERAGE',
ADD COLUMN     "defaultWindowMonths" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "flagOverrideAbovePct" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
ADD COLUMN     "requireReasonAbovePct" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
ADD COLUMN     "skuSettingIds" TEXT[];

-- CreateTable
CREATE TABLE "demand_forecast_methods" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "method" "ForecastMethodType" NOT NULL,
    "growthPct" DOUBLE PRECISION,
    "windowMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_forecast_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_plan_landed_costs" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "production" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fulfillment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "repack" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_plan_landed_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_plan_channel_prices" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_plan_channel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_plan_entries" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "reason" "DemandOverrideReason",
    "note" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_actuals" (
    "id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "refreshedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_plan_baseline_actuals" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_plan_baseline_actuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_plan_audits" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "userId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_plan_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demand_forecast_methods_planId_idx" ON "demand_forecast_methods"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "demand_forecast_methods_planId_channel_skuSettingId_key" ON "demand_forecast_methods"("planId", "channel", "skuSettingId");

-- CreateIndex
CREATE INDEX "demand_plan_landed_costs_planId_skuSettingId_effectiveFrom_idx" ON "demand_plan_landed_costs"("planId", "skuSettingId", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_landed_costs_planId_skuSettingId_effectiveFrom_key" ON "demand_plan_landed_costs"("planId", "skuSettingId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "demand_plan_channel_prices_planId_skuSettingId_channel_effe_idx" ON "demand_plan_channel_prices"("planId", "skuSettingId", "channel", "effectiveFrom" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_channel_prices_planId_skuSettingId_channel_effe_key" ON "demand_plan_channel_prices"("planId", "skuSettingId", "channel", "effectiveFrom");

-- CreateIndex
CREATE INDEX "demand_plan_entries_planId_period_idx" ON "demand_plan_entries"("planId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_entries_planId_channel_skuSettingId_period_key" ON "demand_plan_entries"("planId", "channel", "skuSettingId", "period");

-- CreateIndex
CREATE INDEX "demand_actuals_skuSettingId_period_idx" ON "demand_actuals"("skuSettingId", "period");

-- CreateIndex
CREATE INDEX "demand_actuals_period_idx" ON "demand_actuals"("period");

-- CreateIndex
CREATE UNIQUE INDEX "demand_actuals_channel_skuSettingId_period_key" ON "demand_actuals"("channel", "skuSettingId", "period");

-- CreateIndex
CREATE INDEX "demand_plan_baseline_actuals_planId_period_idx" ON "demand_plan_baseline_actuals"("planId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_baseline_actuals_planId_channel_skuSettingId_pe_key" ON "demand_plan_baseline_actuals"("planId", "channel", "skuSettingId", "period");

-- CreateIndex
CREATE INDEX "demand_plan_audits_planId_createdAt_idx" ON "demand_plan_audits"("planId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "demand_forecast_methods" ADD CONSTRAINT "demand_forecast_methods_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast_methods" ADD CONSTRAINT "demand_forecast_methods_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_landed_costs" ADD CONSTRAINT "demand_plan_landed_costs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_landed_costs" ADD CONSTRAINT "demand_plan_landed_costs_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_channel_prices" ADD CONSTRAINT "demand_plan_channel_prices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_channel_prices" ADD CONSTRAINT "demand_plan_channel_prices_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_entries" ADD CONSTRAINT "demand_plan_entries_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_entries" ADD CONSTRAINT "demand_plan_entries_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_entries" ADD CONSTRAINT "demand_plan_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_actuals" ADD CONSTRAINT "demand_actuals_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_baseline_actuals" ADD CONSTRAINT "demand_plan_baseline_actuals_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_baseline_actuals" ADD CONSTRAINT "demand_plan_baseline_actuals_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_audits" ADD CONSTRAINT "demand_plan_audits_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plan_audits" ADD CONSTRAINT "demand_plan_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
