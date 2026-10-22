-- AlterTable
ALTER TABLE "replenishment_orders" ADD COLUMN     "pickupConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pickupGmailThreadId" TEXT;
