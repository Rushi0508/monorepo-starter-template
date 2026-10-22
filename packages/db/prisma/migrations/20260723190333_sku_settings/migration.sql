/*
  Warnings:

  - You are about to drop the column `leadTime` on the `sku_settings` table. All the data in the column will be lost.
  - You are about to drop the column `moq` on the `sku_settings` table. All the data in the column will be lost.
  - You are about to drop the column `safetyStock` on the `sku_settings` table. All the data in the column will be lost.
  - You are about to drop the column `targetDoh` on the `sku_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sku_settings" DROP COLUMN "leadTime",
DROP COLUMN "moq",
DROP COLUMN "safetyStock",
DROP COLUMN "targetDoh",
ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "sku_columns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_columns_pkey" PRIMARY KEY ("id")
);
