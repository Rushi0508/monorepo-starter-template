-- AlterTable
ALTER TABLE "gmail_connections" ADD COLUMN     "lastHistoryId" TEXT;

-- CreateTable
CREATE TABLE "pod_emails" (
    "id" UUID NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT,
    "subject" TEXT,
    "snippet" TEXT,
    "body" TEXT,
    "receivedAt" TIMESTAMP(3),
    "filename" TEXT,
    "mimeType" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pod_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pod_emails_isProcessed_idx" ON "pod_emails"("isProcessed");

-- CreateIndex
CREATE INDEX "pod_emails_receivedAt_idx" ON "pod_emails"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "pod_emails_gmailMessageId_attachmentId_key" ON "pod_emails"("gmailMessageId", "attachmentId");
