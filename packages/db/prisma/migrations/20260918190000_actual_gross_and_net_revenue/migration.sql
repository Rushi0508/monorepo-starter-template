-- AlterTable
ALTER TABLE "demand_actuals" DROP COLUMN "revenue",
ADD COLUMN     "grossRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "netRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "demand_plan_baseline_actuals" DROP COLUMN "revenue",
ADD COLUMN     "grossRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "netRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

