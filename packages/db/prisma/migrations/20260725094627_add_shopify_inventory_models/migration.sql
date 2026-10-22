-- CreateTable
CREATE TABLE "shopify_locations" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "zip" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_inventory_items" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "sku" TEXT,
    "tracked" BOOLEAN NOT NULL DEFAULT true,
    "unitCostAmount" DOUBLE PRECISION,
    "unitCostCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_inventory_levels" (
    "id" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "committed" INTEGER NOT NULL DEFAULT 0,
    "incoming" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "qualityControl" INTEGER NOT NULL DEFAULT 0,
    "shopifyUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_inventory_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_locations_shopifyId_key" ON "shopify_locations"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_inventory_items_shopifyId_key" ON "shopify_inventory_items"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_inventory_items_sku_idx" ON "shopify_inventory_items"("sku");

-- CreateIndex
CREATE INDEX "shopify_inventory_levels_locationId_idx" ON "shopify_inventory_levels"("locationId");

-- CreateIndex
CREATE INDEX "shopify_inventory_levels_inventoryItemId_idx" ON "shopify_inventory_levels"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_inventory_levels_inventoryItemId_locationId_key" ON "shopify_inventory_levels"("inventoryItemId", "locationId");

-- AddForeignKey
ALTER TABLE "shopify_inventory_levels" ADD CONSTRAINT "shopify_inventory_levels_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "shopify_inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_inventory_levels" ADD CONSTRAINT "shopify_inventory_levels_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "shopify_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
