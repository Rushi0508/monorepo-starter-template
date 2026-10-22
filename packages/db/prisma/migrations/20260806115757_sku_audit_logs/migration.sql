/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropTable
DROP TABLE "audit_logs";

-- DropEnum
DROP TYPE "AuditLogCategory";

-- CreateTable
CREATE TABLE "sku_settings_audit_logs" (
    "id" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "userId" UUID,
    "skuSettingId" UUID,
    "columnId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_settings_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sku_settings_audit_logs_updatedAt_idx" ON "sku_settings_audit_logs"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "sku_settings_audit_logs_skuSettingId_idx" ON "sku_settings_audit_logs"("skuSettingId");

-- CreateIndex
CREATE INDEX "sku_settings_audit_logs_userId_skuSettingId_columnId_update_idx" ON "sku_settings_audit_logs"("userId", "skuSettingId", "columnId", "updatedAt");

-- AddForeignKey
ALTER TABLE "sku_settings_audit_logs" ADD CONSTRAINT "sku_settings_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
