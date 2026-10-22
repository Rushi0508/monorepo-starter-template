-- CreateTable
CREATE TABLE "bluebox_inventory" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "warehouseCode" TEXT,
    "rop" INTEGER,
    "onHand" INTEGER,
    "committed" INTEGER,
    "available" INTEGER,
    "backordered" INTEGER,
    "quarantined" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_inventory_by_lot" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "shortDescription" TEXT,
    "qty" INTEGER,
    "lotNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "physicalWarehouseId" INTEGER,
    "warehouseCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_inventory_by_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_asns" (
    "id" UUID NOT NULL,
    "blueboxId" INTEGER NOT NULL,
    "customerNumber" TEXT,
    "status" TEXT,
    "description" TEXT,
    "longDescription" TEXT,
    "expectedDate" TIMESTAMP(3),
    "actualArriveDate" TIMESTAMP(3),
    "completeDate" TIMESTAMP(3),
    "countedDate" TIMESTAMP(3),
    "isExpedited" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT,
    "notes" TEXT,
    "trackingNumber" TEXT,
    "shipper" TEXT,
    "warehouseCode" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "cartonCount" INTEGER,
    "palletCount" INTEGER,
    "additionalHandling" TEXT,
    "shipToCompanyName" TEXT,
    "shipToFirstName" TEXT,
    "shipToLastName" TEXT,
    "shipToAddress1" TEXT,
    "shipToAddress2" TEXT,
    "shipToCity" TEXT,
    "shipToState" TEXT,
    "shipToZip" TEXT,
    "shipToCountry" TEXT,
    "shipToPhone" TEXT,
    "shipToEmail" TEXT,
    "shipFromCompanyName" TEXT,
    "shipFromFirstName" TEXT,
    "shipFromLastName" TEXT,
    "shipFromAddress1" TEXT,
    "shipFromAddress2" TEXT,
    "shipFromCity" TEXT,
    "shipFromState" TEXT,
    "shipFromZip" TEXT,
    "shipFromCountry" TEXT,
    "shipFromPhone" TEXT,
    "shipFromEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_asns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_asn_items" (
    "id" UUID NOT NULL,
    "asnId" UUID NOT NULL,
    "blueboxId" INTEGER,
    "skuId" INTEGER,
    "sku" TEXT NOT NULL,
    "upc" TEXT,
    "description" TEXT,
    "quantitySent" INTEGER,
    "quantityDamaged" INTEGER,
    "quantityReceived" INTEGER,
    "quantityShelved" INTEGER,
    "expiration" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "carton" TEXT,
    "notes" TEXT,
    "lot" TEXT,
    "externalId" TEXT,
    "poNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_asn_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_orders" (
    "id" UUID NOT NULL,
    "blueboxId" INTEGER NOT NULL,
    "orderNumber" TEXT,
    "customerOrderNumber" TEXT,
    "customerNumber" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "orderSource" TEXT,
    "status" TEXT,
    "workflowStatus" TEXT,
    "deliveryStatus" TEXT,
    "trackingNumber" TEXT,
    "masterTracking" TEXT,
    "shippingCompany" TEXT,
    "shippingService" TEXT,
    "shippingCost" DOUBLE PRECISION,
    "physicalWarehouse" TEXT,
    "paymentStatus" TEXT,
    "paymentMethod" TEXT,
    "paidAmount" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "memo" TEXT,
    "poNumber" TEXT,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "isRushOrder" BOOLEAN NOT NULL DEFAULT false,
    "dateOrderReceived" TIMESTAMP(3),
    "dateOrderShipped" TIMESTAMP(3),
    "dateOrderDelivered" TIMESTAMP(3),
    "dateOrderPicked" TIMESTAMP(3),
    "dateOrderPacked" TIMESTAMP(3),
    "createDateTime" TIMESTAMP(3),
    "shipToCompanyName" TEXT,
    "shipToFirstName" TEXT,
    "shipToLastName" TEXT,
    "shipToAddress1" TEXT,
    "shipToAddress2" TEXT,
    "shipToCity" TEXT,
    "shipToState" TEXT,
    "shipToZip" TEXT,
    "shipToCountry" TEXT,
    "shipToPhone" TEXT,
    "shipToEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_order_checkpoints" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "checkpointTime" TIMESTAMP(3),
    "slug" TEXT,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "countryRegion" TEXT,
    "zip" TEXT,
    "tag" TEXT,
    "message" TEXT,
    "carrier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bluebox_order_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_outbound_shipments" (
    "id" UUID NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "created" TIMESTAMP(3),
    "readyForLabels" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_outbound_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bluebox_outbound_shipment_orders" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "blueboxOrderId" INTEGER,
    "orderNumber" TEXT,
    "customerOrderNumber" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "status" TEXT,
    "trackingNumber" TEXT,
    "shippingCompany" TEXT,
    "shippingService" TEXT,
    "shippingCost" DOUBLE PRECISION,
    "dateOrderShipped" TIMESTAMP(3),
    "dateOrderDelivered" TIMESTAMP(3),
    "dateOrderReceived" TIMESTAMP(3),
    "shipToFirstName" TEXT,
    "shipToLastName" TEXT,
    "shipToAddress1" TEXT,
    "shipToAddress2" TEXT,
    "shipToCity" TEXT,
    "shipToState" TEXT,
    "shipToZip" TEXT,
    "shipToCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bluebox_outbound_shipment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bluebox_inventory_sku_idx" ON "bluebox_inventory"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "bluebox_inventory_sku_warehouseCode_key" ON "bluebox_inventory"("sku", "warehouseCode");

-- CreateIndex
CREATE INDEX "bluebox_inventory_by_lot_sku_idx" ON "bluebox_inventory_by_lot"("sku");

-- CreateIndex
CREATE INDEX "bluebox_inventory_by_lot_lotNumber_idx" ON "bluebox_inventory_by_lot"("lotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bluebox_inventory_by_lot_sku_lotNumber_warehouseCode_key" ON "bluebox_inventory_by_lot"("sku", "lotNumber", "warehouseCode");

-- CreateIndex
CREATE INDEX "bluebox_asns_status_idx" ON "bluebox_asns"("status");

-- CreateIndex
CREATE INDEX "bluebox_asns_externalId_idx" ON "bluebox_asns"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "bluebox_asns_blueboxId_key" ON "bluebox_asns"("blueboxId");

-- CreateIndex
CREATE INDEX "bluebox_asn_items_asnId_idx" ON "bluebox_asn_items"("asnId");

-- CreateIndex
CREATE INDEX "bluebox_asn_items_sku_idx" ON "bluebox_asn_items"("sku");

-- CreateIndex
CREATE INDEX "bluebox_orders_externalId_idx" ON "bluebox_orders"("externalId");

-- CreateIndex
CREATE INDEX "bluebox_orders_orderNumber_idx" ON "bluebox_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "bluebox_orders_status_idx" ON "bluebox_orders"("status");

-- CreateIndex
CREATE INDEX "bluebox_orders_workflowStatus_idx" ON "bluebox_orders"("workflowStatus");

-- CreateIndex
CREATE UNIQUE INDEX "bluebox_orders_blueboxId_key" ON "bluebox_orders"("blueboxId");

-- CreateIndex
CREATE INDEX "bluebox_order_checkpoints_orderId_idx" ON "bluebox_order_checkpoints"("orderId");

-- CreateIndex
CREATE INDEX "bluebox_order_checkpoints_tag_idx" ON "bluebox_order_checkpoints"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "bluebox_outbound_shipments_shipmentId_key" ON "bluebox_outbound_shipments"("shipmentId");

-- CreateIndex
CREATE INDEX "bluebox_outbound_shipment_orders_shipmentId_idx" ON "bluebox_outbound_shipment_orders"("shipmentId");

-- CreateIndex
CREATE INDEX "bluebox_outbound_shipment_orders_externalId_idx" ON "bluebox_outbound_shipment_orders"("externalId");

-- CreateIndex
CREATE INDEX "bluebox_outbound_shipment_orders_orderNumber_idx" ON "bluebox_outbound_shipment_orders"("orderNumber");

-- AddForeignKey
ALTER TABLE "bluebox_asn_items" ADD CONSTRAINT "bluebox_asn_items_asnId_fkey" FOREIGN KEY ("asnId") REFERENCES "bluebox_asns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bluebox_order_checkpoints" ADD CONSTRAINT "bluebox_order_checkpoints_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "bluebox_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bluebox_outbound_shipment_orders" ADD CONSTRAINT "bluebox_outbound_shipment_orders_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "bluebox_outbound_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
