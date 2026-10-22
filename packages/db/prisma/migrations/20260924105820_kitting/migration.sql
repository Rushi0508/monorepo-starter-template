-- AlterTable
ALTER TABLE "production_runs" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "bluebox_kit_orders" (
    "id" UUID NOT NULL,
    "blueboxId" INTEGER NOT NULL,
    "kitConfigId" INTEGER,
    "kitDescription" TEXT,
    "versionNumber" INTEGER,
    "billableCost" DOUBLE PRECISION,
    "workflowStep" TEXT,
    "workflowStatus" TEXT,
    "priority" INTEGER,
    "laneName" TEXT,
    "physicalWarehouseId" INTEGER,
    "physicalWarehouseName" TEXT,
    "quantity" INTEGER NOT NULL,
    "quantityBuilt" INTEGER NOT NULL,
    "percentComplete" DOUBLE PRECISION,
    "rawVirtualWarehouseName" TEXT,
    "finalVirtualWarehouseName" TEXT,
    "fulfillmentOrderIds" INTEGER[],
    "createdDate" TIMESTAMP(3),
    "requestedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "canceledDate" TIMESTAMP(3),
    "inventoryReserveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_kit_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_kit_order_final_items" (
    "id" UUID NOT NULL,
    "kitOrderId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "upc" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "quantityBuilt" INTEGER NOT NULL,

    CONSTRAINT "bluebox_kit_order_final_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_kit_order_raw_items" (
    "id" UUID NOT NULL,
    "kitOrderId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "upc" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "quantityReserved" INTEGER NOT NULL,
    "quantityConsumed" INTEGER NOT NULL,
    "requiredLotNumber" TEXT,
    "requiredExpirationDate" TIMESTAMP(3),
    "consumeMethod" TEXT,

    CONSTRAINT "bluebox_kit_order_raw_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bluebox_kit_orders_blueboxId_key" ON "bluebox_kit_orders"("blueboxId");

-- CreateIndex
CREATE INDEX "bluebox_kit_order_final_items_kitOrderId_idx" ON "bluebox_kit_order_final_items"("kitOrderId");

-- CreateIndex
CREATE INDEX "bluebox_kit_order_final_items_sku_idx" ON "bluebox_kit_order_final_items"("sku");

-- CreateIndex
CREATE INDEX "bluebox_kit_order_raw_items_kitOrderId_idx" ON "bluebox_kit_order_raw_items"("kitOrderId");

-- CreateIndex
CREATE INDEX "bluebox_kit_order_raw_items_sku_idx" ON "bluebox_kit_order_raw_items"("sku");

-- AddForeignKey
ALTER TABLE "bluebox_kit_order_final_items" ADD CONSTRAINT "bluebox_kit_order_final_items_kitOrderId_fkey" FOREIGN KEY ("kitOrderId") REFERENCES "bluebox_kit_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bluebox_kit_order_raw_items" ADD CONSTRAINT "bluebox_kit_order_raw_items_kitOrderId_fkey" FOREIGN KEY ("kitOrderId") REFERENCES "bluebox_kit_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
