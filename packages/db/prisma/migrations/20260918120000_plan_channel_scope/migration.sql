-- AlterTable
ALTER TABLE "demand_plans" DROP COLUMN "channels",
DROP COLUMN "skuSettingIds";

-- CreateTable
CREATE TABLE "demand_plan_channel_scopes" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "skuSettingIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_plan_channel_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demand_plan_channel_scopes_planId_idx" ON "demand_plan_channel_scopes"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "demand_plan_channel_scopes_planId_channel_key" ON "demand_plan_channel_scopes"("planId", "channel");

-- AddForeignKey
ALTER TABLE "demand_plan_channel_scopes" ADD CONSTRAINT "demand_plan_channel_scopes_planId_fkey" FOREIGN KEY ("planId") REFERENCES "demand_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

