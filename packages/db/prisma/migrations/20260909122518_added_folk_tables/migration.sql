-- CreateEnum
CREATE TYPE "FolkMappingStatus" AS ENUM ('PENDING_REVIEW', 'MAPPED', 'UNMAPPED', 'FOLK_DELETED', 'NEEDS_REVIEW', 'LEFT_GROUP');

-- AlterTable
ALTER TABLE "shopify_customers" ADD COLUMN     "folkCompanyMappingId" UUID;

-- CreateTable
CREATE TABLE "folk_company_mappings" (
    "id" UUID NOT NULL,
    "folkCompanyId" TEXT NOT NULL,
    "folkGroupId" TEXT NOT NULL,
    "sdCustomerId" TEXT,
    "folkCompanyName" TEXT NOT NULL,
    "status" "FolkMappingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "matchScore" DOUBLE PRECISION,
    "proposedCustomerId" UUID,
    "metricsPushedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "folkDeletedAt" TIMESTAMP(3),
    "pipelineStatus" TEXT,
    "customerType" TEXT,
    "cardUrl" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "lastContactType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folk_company_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folk_company_mappings_folkCompanyId_key" ON "folk_company_mappings"("folkCompanyId");

-- CreateIndex
CREATE INDEX "folk_company_mappings_status_idx" ON "folk_company_mappings"("status");

-- CreateIndex
CREATE INDEX "shopify_customers_folkCompanyMappingId_idx" ON "shopify_customers"("folkCompanyMappingId");

-- AddForeignKey
ALTER TABLE "shopify_customers" ADD CONSTRAINT "shopify_customers_folkCompanyMappingId_fkey" FOREIGN KEY ("folkCompanyMappingId") REFERENCES "folk_company_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
