-- AlterTable
ALTER TABLE "folk_company_mappings" ADD COLUMN     "shopifyPushError" TEXT,
ADD COLUMN     "shopifyPushedAt" TIMESTAMP(3);
