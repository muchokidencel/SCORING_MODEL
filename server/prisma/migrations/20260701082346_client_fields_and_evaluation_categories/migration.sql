-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "accountManager" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "evaluation_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metricKpi" TEXT NOT NULL,
    "measurementFormula" TEXT NOT NULL,
    "targetBenchmark" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_categories_name_key" ON "evaluation_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_categories_sortOrder_key" ON "evaluation_categories"("sortOrder");
