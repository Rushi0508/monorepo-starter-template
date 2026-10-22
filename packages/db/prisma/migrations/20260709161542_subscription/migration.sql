-- CreateTable
CREATE TABLE "shopify_subscriptions" (
    "id" UUID NOT NULL,
    "contractId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "nextBillingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopify_subscriptions_customerId_idx" ON "shopify_subscriptions"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_subscriptions_contractId_key" ON "shopify_subscriptions"("contractId");

-- AddForeignKey
ALTER TABLE "shopify_subscriptions" ADD CONSTRAINT "shopify_subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "shopify_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
