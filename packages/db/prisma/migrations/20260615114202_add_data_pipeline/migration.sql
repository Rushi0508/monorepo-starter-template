-- CreateTable
CREATE TABLE "data_pipelines" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "cadenceType" TEXT NOT NULL,
    "cadence" TEXT,
    "description" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "lastSyncDurationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_pipelines_name_key" ON "data_pipelines"("name");
