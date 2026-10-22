-- CreateTable
CREATE TABLE "replenishment_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNumber" TEXT NOT NULL,
    "blueboxOrderId" INTEGER,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replenishment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replenishment_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "replenishment_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "replenishment_orders_orderNumber_key" ON "replenishment_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "replenishment_orders_isProcessed_idx" ON "replenishment_orders"("isProcessed");

-- AddForeignKey
ALTER TABLE "replenishment_order_items" ADD CONSTRAINT "replenishment_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "replenishment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
