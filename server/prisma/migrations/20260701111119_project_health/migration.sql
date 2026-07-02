-- CreateTable
CREATE TABLE "project_metric_snapshots" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pv" DOUBLE PRECISION NOT NULL,
    "ac" DOUBLE PRECISION NOT NULL,
    "ev" DOUBLE PRECISION NOT NULL,
    "clientSignoff" BOOLEAN NOT NULL,
    "resourceUtilization" DOUBLE PRECISION NOT NULL,
    "spi" DOUBLE PRECISION NOT NULL,
    "cpi" DOUBLE PRECISION NOT NULL,
    "scorecardPoints" INTEGER NOT NULL,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_metric_snapshots_clientId_createdAt_idx" ON "project_metric_snapshots"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "project_metric_snapshots" ADD CONSTRAINT "project_metric_snapshots_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_metric_snapshots" ADD CONSTRAINT "project_metric_snapshots_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
