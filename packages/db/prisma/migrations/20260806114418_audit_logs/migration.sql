-- CreateEnum
CREATE TYPE "AuditLogCategory" AS ENUM ('SKU_SETTINGS');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "activity" TEXT NOT NULL,
    "category" "AuditLogCategory" NOT NULL,
    "userId" UUID,
    "skuSettingId" UUID,
    "columnId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_category_updatedAt_idx" ON "audit_logs"("category", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_skuSettingId_idx" ON "audit_logs"("skuSettingId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_skuSettingId_columnId_updatedAt_idx" ON "audit_logs"("userId", "skuSettingId", "columnId", "updatedAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
