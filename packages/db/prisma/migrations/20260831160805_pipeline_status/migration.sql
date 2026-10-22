/*
  Warnings:

  - You are about to drop the column `lastSyncStatus` on the `data_pipelines` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PAUSED');

-- AlterTable
ALTER TABLE "data_pipelines" DROP COLUMN "lastSyncStatus",
ADD COLUMN     "status" "PipelineStatus";

-- DropEnum
DROP TYPE "PipelineSyncStatus";
