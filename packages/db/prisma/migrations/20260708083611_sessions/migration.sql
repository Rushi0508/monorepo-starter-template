/*
  Warnings:

  - You are about to drop the `shopify_analytics_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "shopify_analytics_snapshots";

-- CreateTable
CREATE TABLE "shopify_sessions_daily" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "completedCheckouts" INTEGER NOT NULL,
    "conversionRate" DOUBLE PRECISION,

    CONSTRAINT "shopify_sessions_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_sessions_daily_date_key" ON "shopify_sessions_daily"("date");
