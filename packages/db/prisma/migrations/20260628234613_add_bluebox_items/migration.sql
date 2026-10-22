-- CreateTable
CREATE TABLE "bluebox_order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "blueboxId" INTEGER,
    "sku" TEXT,
    "quantity" INTEGER,
    "upc" TEXT,
    "quantityCancelled" INTEGER,
    "price" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "weight" DOUBLE PRECISION,
    "description" TEXT,
    "lot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bluebox_order_items_orderId_idx" ON "bluebox_order_items"("orderId");

-- AddForeignKey
ALTER TABLE "bluebox_order_items" ADD CONSTRAINT "bluebox_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "bluebox_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
