-- CreateTable
CREATE TABLE "shopify_analytics_snapshots" (
    "id" UUID NOT NULL,
    "metric" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopify_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_analytics_snapshots_metric_key" ON "shopify_analytics_snapshots"("metric");
