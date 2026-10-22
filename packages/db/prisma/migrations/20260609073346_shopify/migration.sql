-- CreateTable
CREATE TABLE "shopify_customers" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "displayName" TEXT,
    "state" TEXT,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_customer_addresses" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "name" TEXT,
    "provinceCode" TEXT,
    "countryCode" TEXT,
    "countryName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_products" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "status" TEXT,
    "tags" TEXT,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_product_variants" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "productId" UUID NOT NULL,
    "barcode" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "sku" TEXT,
    "title" TEXT,
    "inventoryQuantity" INTEGER,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_orders" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "customerId" UUID,
    "orderNumber" INTEGER NOT NULL,
    "financialStatus" TEXT,
    "fulfillmentStatus" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "note" TEXT,
    "noteAttributes" JSONB,
    "tags" TEXT[],
    "subtotalPrice" DOUBLE PRECISION,
    "totalDiscounts" DOUBLE PRECISION,
    "totalShippingPrice" DOUBLE PRECISION,
    "totalTax" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "currency" TEXT,
    "paymentTerms" TEXT,
    "paymentGatewayNames" TEXT[],
    "shipName" TEXT,
    "shipAddress1" TEXT,
    "shipAddress2" TEXT,
    "shipCity" TEXT,
    "shipProvinceCode" TEXT,
    "shipZip" TEXT,
    "shipCountryCode" TEXT,
    "shipPhone" TEXT,
    "billName" TEXT,
    "billAddress1" TEXT,
    "billAddress2" TEXT,
    "billCity" TEXT,
    "billProvinceCode" TEXT,
    "billZip" TEXT,
    "billCountryCode" TEXT,
    "billPhone" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_order_line_items" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID,
    "variantId" UUID,
    "sku" TEXT,
    "title" TEXT,
    "variantTitle" TEXT,
    "vendor" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "totalDiscount" DOUBLE PRECISION,
    "discountAllocations" JSONB,
    "fulfillmentStatus" TEXT,
    "requiresShipping" BOOLEAN,
    "taxable" BOOLEAN,
    "giftCard" BOOLEAN,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_refunds" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "orderId" UUID NOT NULL,
    "note" TEXT,
    "restock" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_refund_line_items" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "refundId" UUID NOT NULL,
    "lineItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION,
    "totalTax" DOUBLE PRECISION,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_refund_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_refund_transactions" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "refundId" UUID NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "gateway" TEXT,
    "status" TEXT,
    "kind" TEXT,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_refund_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_fulfillments" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "orderId" UUID NOT NULL,
    "status" TEXT,
    "shipmentStatus" TEXT,
    "trackingCompany" TEXT,
    "trackingNumber" TEXT,
    "trackingNumbers" TEXT[],
    "trackingUrl" TEXT,
    "trackingUrls" TEXT[],
    "estimatedDeliveryAt" TIMESTAMP(3),
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_fulfillment_line_items" (
    "id" UUID NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "fulfillmentId" UUID NOT NULL,
    "lineItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "shopifyCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_fulfillment_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_customers_shopifyId_key" ON "shopify_customers"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_customer_addresses_customerId_idx" ON "shopify_customer_addresses"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_customer_addresses_shopifyId_key" ON "shopify_customer_addresses"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_products_shopifyId_key" ON "shopify_products"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_product_variants_productId_idx" ON "shopify_product_variants"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_variants_shopifyId_key" ON "shopify_product_variants"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_orders_customerId_idx" ON "shopify_orders"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_orders_shopifyId_key" ON "shopify_orders"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_order_line_items_orderId_idx" ON "shopify_order_line_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_order_line_items_shopifyId_key" ON "shopify_order_line_items"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_refunds_orderId_idx" ON "shopify_refunds"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_refunds_shopifyId_key" ON "shopify_refunds"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_refund_line_items_refundId_idx" ON "shopify_refund_line_items"("refundId");

-- CreateIndex
CREATE INDEX "shopify_refund_line_items_lineItemId_idx" ON "shopify_refund_line_items"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_refund_line_items_shopifyId_key" ON "shopify_refund_line_items"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_refund_transactions_refundId_idx" ON "shopify_refund_transactions"("refundId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_refund_transactions_shopifyId_key" ON "shopify_refund_transactions"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_fulfillments_orderId_idx" ON "shopify_fulfillments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_fulfillments_shopifyId_key" ON "shopify_fulfillments"("shopifyId");

-- CreateIndex
CREATE INDEX "shopify_fulfillment_line_items_fulfillmentId_idx" ON "shopify_fulfillment_line_items"("fulfillmentId");

-- CreateIndex
CREATE INDEX "shopify_fulfillment_line_items_lineItemId_idx" ON "shopify_fulfillment_line_items"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_fulfillment_line_items_shopifyId_key" ON "shopify_fulfillment_line_items"("shopifyId");

-- AddForeignKey
ALTER TABLE "shopify_customer_addresses" ADD CONSTRAINT "shopify_customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "shopify_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_variants" ADD CONSTRAINT "shopify_product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shopify_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_orders" ADD CONSTRAINT "shopify_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "shopify_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_order_line_items" ADD CONSTRAINT "shopify_order_line_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "shopify_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_refunds" ADD CONSTRAINT "shopify_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "shopify_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_refund_line_items" ADD CONSTRAINT "shopify_refund_line_items_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "shopify_refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_refund_line_items" ADD CONSTRAINT "shopify_refund_line_items_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "shopify_order_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_refund_transactions" ADD CONSTRAINT "shopify_refund_transactions_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "shopify_refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_fulfillments" ADD CONSTRAINT "shopify_fulfillments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "shopify_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_fulfillment_line_items" ADD CONSTRAINT "shopify_fulfillment_line_items_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "shopify_fulfillments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_fulfillment_line_items" ADD CONSTRAINT "shopify_fulfillment_line_items_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "shopify_order_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
