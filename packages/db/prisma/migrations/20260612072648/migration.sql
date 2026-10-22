-- AlterTable
ALTER TABLE "bluebox_inventory" ALTER COLUMN "warehouseCode" DROP NOT NULL,
ALTER COLUMN "warehouseCode" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bluebox_inventory_by_lot" ALTER COLUMN "lotNumber" DROP NOT NULL,
ALTER COLUMN "lotNumber" DROP DEFAULT,
ALTER COLUMN "warehouseCode" DROP NOT NULL,
ALTER COLUMN "warehouseCode" DROP DEFAULT;
