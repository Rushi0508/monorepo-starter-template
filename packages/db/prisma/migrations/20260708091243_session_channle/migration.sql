-- CreateTable
CREATE TABLE "shopify_sessions_channel_device_daily" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "referringChannel" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "completedCheckouts" INTEGER NOT NULL,

    CONSTRAINT "shopify_sessions_channel_device_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_sessions_channel_device_daily_date_referringChannel_key" ON "shopify_sessions_channel_device_daily"("date", "referringChannel", "deviceType");
