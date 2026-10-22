-- CreateTable
CREATE TABLE "sku_settings" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "targetDoh" INTEGER NOT NULL DEFAULT 0,
    "leadTime" INTEGER NOT NULL DEFAULT 0,
    "moq" INTEGER NOT NULL DEFAULT 0,
    "cogsPerCase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sku_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sku_settings_sku_key" ON "sku_settings"("sku");
