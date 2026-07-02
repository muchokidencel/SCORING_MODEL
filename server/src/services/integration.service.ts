import {
  deleteIntegrationConfig,
  findIntegrationConfigByClient,
  updateIntegrationMapping,
  updateIntegrationSyncStatus,
  upsertIntegrationConfig,
} from "../repositories/integration.repository.js";
import { submitHealthSnapshot } from "./project-health.service.js";
import { forbidden, notFound, unauthorized, badRequest, HttpError } from "../types/http-error.js";
import { IntegrationProvider, SyncStatus } from "@prisma/client";

// Global map to simulate integration errors (expired token, rate limit, permission denied)
const simulatedErrors = new Map<string, "TOKEN_EXPIRED" | "RATE_LIMIT" | "PERMISSION_DENIED" | "NONE">();

export const setSimulatedError = (
  clientId: string,
  errorType: "TOKEN_EXPIRED" | "RATE_LIMIT" | "PERMISSION_DENIED" | "NONE"
) => {
  if (errorType === "NONE") {
    simulatedErrors.delete(clientId);
  } else {
    simulatedErrors.set(clientId, errorType);
  }
};

export const getSimulatedError = (clientId: string) => {
  return simulatedErrors.get(clientId) ?? "NONE";
};

export const connectClientIntegration = async (params: {
  clientId: string;
  provider: IntegrationProvider;
  authCode: string;
}) => {
  if (!params.authCode) {
    throw badRequest("Authorization code is required");
  }

  const accessToken = `mock_access_token_${Math.random().toString(36).slice(2)}`;
  const refreshToken = `mock_refresh_token_${Math.random().toString(36).slice(2)}`;
  const tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

  return upsertIntegrationConfig({
    clientId: params.clientId,
    provider: params.provider,
    accessToken,
    refreshToken,
    tokenExpiresAt,
  });
};

export const saveClientIntegrationMapping = async (params: {
  clientId: string;
  pvField: string;
  acField: string;
  evField: string;
  jiraProjectKey?: string;
  asanaWorkspaceId?: string;
}) => {
  const config = await findIntegrationConfigByClient(params.clientId);
  if (!config) {
    throw notFound("No integration connected for this client");
  }

  return updateIntegrationMapping(params);
};

export const disconnectClientIntegration = async (clientId: string) => {
  const config = await findIntegrationConfigByClient(clientId);
  if (!config) {
    throw notFound("No integration connected for this client");
  }

  // Clear simulated error state on disconnect
  simulatedErrors.delete(clientId);

  return deleteIntegrationConfig(clientId);
};

export const syncIntegration = async (clientId: string, userId: string) => {
  const config = await findIntegrationConfigByClient(clientId);
  if (!config) {
    throw notFound("No integration connected for this client");
  }

  await updateIntegrationSyncStatus({ clientId, status: SyncStatus.SYNCING });

  try {
    const errorType = simulatedErrors.get(clientId);
    if (errorType) {
      if (errorType === "TOKEN_EXPIRED") {
        throw unauthorized("Integration OAuth token expired. Please reconnect.");
      }
      if (errorType === "RATE_LIMIT") {
        throw new HttpError(429, "Jira/Asana API rate limit exceeded");
      }
      if (errorType === "PERMISSION_DENIED") {
        throw forbidden("Permission denied: cannot access the mapped project/workspace");
      }
    }

    // Simulate downloading data from PM tool.
    // If JIRA: check project key; if ASANA: check workspace ID.
    // For mapping correctness verification:
    // We mock PV/AC/EV values based on mapped fields or preset logic.
    const pv = 100000 + Math.floor(Math.random() * 50000);
    const ac = 90000 + Math.floor(Math.random() * 40000);
    const ev = 95000 + Math.floor(Math.random() * 45000);
    const clientSignoff = true;
    const resourceUtilization = 0.95; // 95%

    const snapshot = await submitHealthSnapshot({
      clientId,
      pv,
      ac,
      ev,
      clientSignoff,
      resourceUtilization,
      enteredById: userId,
    });

    const updated = await updateIntegrationSyncStatus({
      clientId,
      status: SyncStatus.SUCCESS,
    });

    return { snapshot, config: updated };
  } catch (err: any) {
    const errorMsg = err.message ?? "Unknown integration sync failure";
    await updateIntegrationSyncStatus({
      clientId,
      status: SyncStatus.FAILED,
      error: errorMsg,
    });
    throw err;
  }
};
