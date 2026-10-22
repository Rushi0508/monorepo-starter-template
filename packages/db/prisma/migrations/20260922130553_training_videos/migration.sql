-- CreateTable
CREATE TABLE "training_videos" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_videos_createdAt_idx" ON "training_videos"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "training_videos" ADD CONSTRAINT "training_videos_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
