-- CreateTable
CREATE TABLE "folk_tracked_groups" (
    "id" UUID NOT NULL,
    "folkGroupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folk_tracked_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folk_tracked_groups_folkGroupId_key" ON "folk_tracked_groups"("folkGroupId");
