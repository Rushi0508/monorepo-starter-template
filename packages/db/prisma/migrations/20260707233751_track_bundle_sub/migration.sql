-- AlterTable
ALTER TABLE "shopify_orders" ADD COLUMN     "isBundleOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSubscriptionOrder" BOOLEAN NOT NULL DEFAULT false;
