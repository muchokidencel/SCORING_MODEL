export type IntegrationProvider = "JIRA" | "ASANA";
export type SyncStatus = "SUCCESS" | "FAILED" | "SYNCING";
export type SimulatedErrorType = "TOKEN_EXPIRED" | "RATE_LIMIT" | "PERMISSION_DENIED" | "NONE";

export interface IntegrationConfig {
  id: string;
  clientId: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  jiraProjectKey: string | null;
  asanaWorkspaceId: string | null;
  pvField: string;
  acField: string;
  evField: string;
  lastSyncStatus: SyncStatus | null;
  lastSyncError: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationResponse {
  config: IntegrationConfig | null;
  simulatedError: SimulatedErrorType;
}
