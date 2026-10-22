/*
  Warnings:

  - You are about to drop the column `cardUrl` on the `folk_company_mappings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[saueroCode]` on the table `shopify_customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "folk_company_mappings" DROP COLUMN "cardUrl";

-- AlterTable
ALTER TABLE "shopify_customers" ADD COLUMN     "saueroCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shopify_customers_saueroCode_key" ON "shopify_customers"("saueroCode");
