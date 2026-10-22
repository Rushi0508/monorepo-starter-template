-- CreateTable
CREATE TABLE "production_runs" (
    "id" UUID NOT NULL,
    "runNumber" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_runs_runNumber_key" ON "production_runs"("runNumber");

-- CreateIndex
CREATE INDEX "production_runs_sku_idx" ON "production_runs"("sku");
