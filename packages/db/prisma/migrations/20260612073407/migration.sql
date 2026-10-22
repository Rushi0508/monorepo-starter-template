/*
  Warnings:

  - Made the column `warehouseCode` on table `bluebox_inventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lotNumber` on table `bluebox_inventory_by_lot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouseCode` on table `bluebox_inventory_by_lot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bluebox_inventory" ALTER COLUMN "warehouseCode" SET NOT NULL,
ALTER COLUMN "warehouseCode" SET DEFAULT '';

-- AlterTable
ALTER TABLE "bluebox_inventory_by_lot" ALTER COLUMN "lotNumber" SET NOT NULL,
ALTER COLUMN "lotNumber" SET DEFAULT '',
ALTER COLUMN "warehouseCode" SET NOT NULL,
ALTER COLUMN "warehouseCode" SET DEFAULT '';
