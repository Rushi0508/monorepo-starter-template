-- CreateTable
CREATE TABLE "configurations" (
    "id" UUID NOT NULL,
    "d2cMaxTransitDays" INTEGER NOT NULL DEFAULT 0,
    "b2bMaxTransitDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);
