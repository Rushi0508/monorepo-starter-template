-- CreateTable
CREATE TABLE "sku_aliases" (
    "id" UUID NOT NULL,
    "skuSettingId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sku_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sku_aliases_sku_key" ON "sku_aliases"("sku");

-- CreateIndex
CREATE INDEX "sku_aliases_skuSettingId_idx" ON "sku_aliases"("skuSettingId");

-- AddForeignKey
ALTER TABLE "sku_aliases" ADD CONSTRAINT "sku_aliases_skuSettingId_fkey" FOREIGN KEY ("skuSettingId") REFERENCES "sku_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
