-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('JIRA', 'ASANA');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'SYNCING');

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "jiraProjectKey" TEXT,
    "asanaWorkspaceId" TEXT,
    "pvField" TEXT NOT NULL,
    "acField" TEXT NOT NULL,
    "evField" TEXT NOT NULL,
    "lastSyncStatus" "SyncStatus",
    "lastSyncError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_clientId_key" ON "integration_configs"("clientId");

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
