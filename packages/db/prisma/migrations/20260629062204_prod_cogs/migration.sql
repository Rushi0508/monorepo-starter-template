/*
  Warnings:

  - You are about to drop the column `cogsPerCase` on the `sku_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "production_runs" ADD COLUMN     "cogsPerCase" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sku_settings" DROP COLUMN "cogsPerCase";
