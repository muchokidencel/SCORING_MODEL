import { prisma } from "../lib/prisma.js";
import { IntegrationProvider, SyncStatus } from "@prisma/client";

export const findIntegrationConfigByClient = (clientId: string) =>
  prisma.integrationConfig.findUnique({
    where: { clientId },
  });

export const upsertIntegrationConfig = (params: {
  clientId: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}) =>
  prisma.integrationConfig.upsert({
    where: { clientId: params.clientId },
    update: {
      provider: params.provider,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      tokenExpiresAt: params.tokenExpiresAt,
      // Reset errors on reconnect
      lastSyncStatus: null,
      lastSyncError: null,
    },
    create: {
      clientId: params.clientId,
      provider: params.provider,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      tokenExpiresAt: params.tokenExpiresAt,
      pvField: "pv",
      acField: "ac",
      evField: "ev",
    },
  });

export const updateIntegrationMapping = (params: {
  clientId: string;
  pvField: string;
  acField: string;
  evField: string;
  jiraProjectKey?: string;
  asanaWorkspaceId?: string;
}) =>
  prisma.integrationConfig.update({
    where: { clientId: params.clientId },
    data: {
      pvField: params.pvField,
      acField: params.acField,
      evField: params.evField,
      jiraProjectKey: params.jiraProjectKey,
      asanaWorkspaceId: params.asanaWorkspaceId,
    },
  });

export const updateIntegrationSyncStatus = (params: {
  clientId: string;
  status: SyncStatus;
  error?: string;
}) =>
  prisma.integrationConfig.update({
    where: { clientId: params.clientId },
    data: {
      lastSyncStatus: params.status,
      lastSyncError: params.error ?? null,
      lastSyncedAt: params.status === SyncStatus.SUCCESS ? new Date() : undefined,
    },
  });

export const deleteIntegrationConfig = (clientId: string) =>
  prisma.integrationConfig.delete({
    where: { clientId },
  });
