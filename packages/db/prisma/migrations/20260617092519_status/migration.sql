/*
  Warnings:

  - The `lastSyncStatus` column on the `data_pipelines` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PipelineSyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "data_pipelines" DROP COLUMN "lastSyncStatus",
ADD COLUMN     "lastSyncStatus" "PipelineSyncStatus";
