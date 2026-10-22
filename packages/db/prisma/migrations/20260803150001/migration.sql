/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `pod_emails` table. All the data in the column will be lost.
  - You are about to drop the column `filename` on the `pod_emails` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `pod_emails` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gmailMessageId]` on the table `pod_emails` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "pod_emails_gmailMessageId_attachmentId_key";

-- AlterTable
ALTER TABLE "pod_emails" DROP COLUMN "attachmentId",
DROP COLUMN "filename",
DROP COLUMN "mimeType",
ADD COLUMN     "attachmentIds" TEXT[],
ADD COLUMN     "filenames" TEXT[],
ADD COLUMN     "mimeTypes" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "pod_emails_gmailMessageId_key" ON "pod_emails"("gmailMessageId");
