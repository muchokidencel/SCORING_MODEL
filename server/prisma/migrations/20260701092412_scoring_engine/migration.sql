/*
  Warnings:

  - Added the required column `benchmarkDirection` to the `evaluation_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `benchmarkValue` to the `evaluation_categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BenchmarkDirection" AS ENUM ('AT_LEAST', 'AT_MOST');

-- AlterTable
ALTER TABLE "evaluation_categories" ADD COLUMN     "benchmarkDirection" "BenchmarkDirection" NOT NULL,
ADD COLUMN     "benchmarkValue" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "metric_scores" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "evaluationCategoryId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawMeasurement" DOUBLE PRECISION NOT NULL,
    "computedScore" INTEGER NOT NULL,
    "weightSnapshot" DOUBLE PRECISION NOT NULL,
    "scoredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_scores_clientId_evaluationCategoryId_createdAt_idx" ON "metric_scores"("clientId", "evaluationCategoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "metric_scores" ADD CONSTRAINT "metric_scores_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_scores" ADD CONSTRAINT "metric_scores_evaluationCategoryId_fkey" FOREIGN KEY ("evaluationCategoryId") REFERENCES "evaluation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_scores" ADD CONSTRAINT "metric_scores_scoredById_fkey" FOREIGN KEY ("scoredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
