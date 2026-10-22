-- AlterTable
ALTER TABLE "configurations" ADD COLUMN     "b2bFulfillmentCostPerCase" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "d2cFulfillmentCostPerCase" DOUBLE PRECISION NOT NULL DEFAULT 0;
