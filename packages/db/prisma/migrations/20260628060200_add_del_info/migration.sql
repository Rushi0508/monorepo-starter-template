-- AlterTable
ALTER TABLE "shopify_fulfillments" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "inTransitAt" TIMESTAMP(3);
