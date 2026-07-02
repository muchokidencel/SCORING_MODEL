-- CreateEnum
CREATE TYPE "MaturityDimension" AS ENUM ('SYSTEM_ADOPTION', 'DATA_PRIVACY_COMPLIANCE', 'CHANGE_MANAGEMENT_ONBOARDING');

-- CreateTable
CREATE TABLE "maturity_ratings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dimension" "MaturityDimension" NOT NULL,
    "level" INTEGER NOT NULL,
    "notes" TEXT,
    "ratedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maturity_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maturity_ratings_clientId_dimension_createdAt_idx" ON "maturity_ratings"("clientId", "dimension", "createdAt");

-- AddForeignKey
ALTER TABLE "maturity_ratings" ADD CONSTRAINT "maturity_ratings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maturity_ratings" ADD CONSTRAINT "maturity_ratings_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
