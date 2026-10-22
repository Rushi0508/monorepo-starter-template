-- CreateEnum
CREATE TYPE "DemandPlanKind" AS ENUM ('BASE', 'SCENARIO');

-- CreateEnum
CREATE TYPE "DemandPlanStatus" AS ENUM ('DRAFT', 'SAVED', 'FINAL');

-- CreateTable
CREATE TABLE "demand_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "DemandPlanKind" NOT NULL DEFAULT 'BASE',
    "status" "DemandPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "planMonth" TEXT NOT NULL,
    "horizonEnd" TEXT NOT NULL,
    "basePlanId" UUID,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" UUID,
    "savedAt" TIMESTAMP(3),
    "savedById" UUID,
    "finalizedAt" TIMESTAMP(3),
    "finalizedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demand_plans_kind_status_idx" ON "demand_plans"("kind", "status");

-- CreateIndex
CREATE INDEX "demand_plans_planMonth_idx" ON "demand_plans"("planMonth");

-- CreateIndex
CREATE INDEX "demand_plans_basePlanId_idx" ON "demand_plans"("basePlanId");

-- AddForeignKey
ALTER TABLE "demand_plans" ADD CONSTRAINT "demand_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plans" ADD CONSTRAINT "demand_plans_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_plans" ADD CONSTRAINT "demand_plans_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
