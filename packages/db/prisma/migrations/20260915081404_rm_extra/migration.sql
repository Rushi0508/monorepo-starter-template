/*
  Warnings:

  - You are about to drop the column `b2bFulfillmentCostPerCase` on the `configurations` table. All the data in the column will be lost.
  - You are about to drop the column `d2cFulfillmentCostPerCase` on the `configurations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "configurations" DROP COLUMN "b2bFulfillmentCostPerCase",
DROP COLUMN "d2cFulfillmentCostPerCase";
