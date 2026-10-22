/*
  Warnings:

  - You are about to drop the column `countryName` on the `shopify_customer_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyCreatedAt` on the `shopify_customer_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `shopify_product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `restock` on the `shopify_refunds` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shopify_customer_addresses" DROP COLUMN "countryName",
DROP COLUMN "shopifyCreatedAt";

-- AlterTable
ALTER TABLE "shopify_product_variants" DROP COLUMN "currency";

-- AlterTable
ALTER TABLE "shopify_refunds" DROP COLUMN "restock";
