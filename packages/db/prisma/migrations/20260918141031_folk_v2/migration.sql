-- AlterTable
ALTER TABLE "folk_company_mappings" ADD COLUMN     "rejectedCustomerId" UUID,
ALTER COLUMN "status" SET DEFAULT 'UNMAPPED';
