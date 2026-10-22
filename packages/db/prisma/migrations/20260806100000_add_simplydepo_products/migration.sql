-- CreateTable
CREATE TABLE "simplydepo_products" (
    "id" UUID NOT NULL,
    "simplydepoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "tags" TEXT[],
    "description" TEXT,
    "wholesalePrice" DOUBLE PRECISION,
    "retailPrice" DOUBLE PRECISION,
    "costPrice" DOUBLE PRECISION,
    "itemsPerCase" INTEGER,
    "inventoryOnHand" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simplydepo_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simplydepo_products_simplydepoId_key" ON "simplydepo_products"("simplydepoId");

-- CreateIndex
CREATE INDEX "simplydepo_products_sku_idx" ON "simplydepo_products"("sku");
