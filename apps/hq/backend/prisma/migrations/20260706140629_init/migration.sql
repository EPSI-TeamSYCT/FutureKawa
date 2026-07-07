-- CreateTable
CREATE TABLE "CountrySnapshot" (
    "country" TEXT NOT NULL,
    "lots" JSONB NOT NULL,
    "measures" JSONB NOT NULL,
    "alerts" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountrySnapshot_pkey" PRIMARY KEY ("country")
);
