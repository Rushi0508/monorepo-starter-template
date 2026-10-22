-- CreateTable
CREATE TABLE "exception_logs" (
    "id" UUID NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exception_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exception_logs_severity_idx" ON "exception_logs"("severity");

-- CreateIndex
CREATE INDEX "exception_logs_createdAt_idx" ON "exception_logs"("createdAt");
