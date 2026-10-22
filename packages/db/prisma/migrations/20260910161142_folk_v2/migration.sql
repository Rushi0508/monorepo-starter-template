/*
  Warnings:

  - The values [FOLK_DELETED,NEEDS_REVIEW,LEFT_GROUP] on the enum `FolkMappingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `folkDeletedAt` on the `folk_company_mappings` table. All the data in the column will be lost.
  - You are about to drop the column `lastVerifiedAt` on the `folk_company_mappings` table. All the data in the column will be lost.
  - You are about to drop the column `metricsPushedAt` on the `folk_company_mappings` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FolkMappingStatus_new" AS ENUM ('PENDING_REVIEW', 'MAPPED', 'UNMAPPED');
ALTER TABLE "public"."folk_company_mappings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "folk_company_mappings" ALTER COLUMN "status" TYPE "FolkMappingStatus_new" USING ("status"::text::"FolkMappingStatus_new");
ALTER TYPE "FolkMappingStatus" RENAME TO "FolkMappingStatus_old";
ALTER TYPE "FolkMappingStatus_new" RENAME TO "FolkMappingStatus";
DROP TYPE "public"."FolkMappingStatus_old";
ALTER TABLE "folk_company_mappings" ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW';
COMMIT;

-- AlterTable
ALTER TABLE "folk_company_mappings" DROP COLUMN "folkDeletedAt",
DROP COLUMN "lastVerifiedAt",
DROP COLUMN "metricsPushedAt";
