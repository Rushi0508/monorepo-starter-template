/*
  Warnings:

  - You are about to drop the column `label` on the `folk_tracked_groups` table. All the data in the column will be lost.
  - Added the required column `name` to the `folk_tracked_groups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "folk_tracked_groups" DROP COLUMN "label",
ADD COLUMN     "name" TEXT NOT NULL;
