-- CreateTable
CREATE TABLE "order_email_flows" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "deliveryRequestSentAt" TIMESTAMP(3),
    "podReceivedAt" TIMESTAMP(3),
    "podProcessedAt" TIMESTAMP(3),
    "gmailThreadId" TEXT,
    "gmailMessageId" TEXT,
    "podEmailId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_email_flows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_email_flows_orderId_key" ON "order_email_flows"("orderId");

-- CreateIndex
CREATE INDEX "order_email_flows_podEmailId_idx" ON "order_email_flows"("podEmailId");

-- AddForeignKey
ALTER TABLE "order_email_flows" ADD CONSTRAINT "order_email_flows_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "shopify_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_email_flows" ADD CONSTRAINT "order_email_flows_podEmailId_fkey" FOREIGN KEY ("podEmailId") REFERENCES "pod_emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
