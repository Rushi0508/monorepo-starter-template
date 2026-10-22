-- CreateTable
CREATE TABLE "gmail_connections" (
    "id" UUID NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "connectedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmail_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gmail_connections_googleAccountId_key" ON "gmail_connections"("googleAccountId");
