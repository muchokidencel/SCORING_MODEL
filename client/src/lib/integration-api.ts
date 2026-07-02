import { apiRequest } from "@/lib/api";
import type {
  IntegrationConfig,
  IntegrationResponse,
  SimulatedErrorType,
} from "@/types/integration";

export const getIntegration = (clientId: string) =>
  apiRequest<IntegrationResponse>(`/clients/${clientId}/integration`);

export const connectIntegration = (clientId: string, provider: "JIRA" | "ASANA", authCode: string) =>
  apiRequest<{ config: IntegrationConfig }>(`/clients/${clientId}/integration/connect`, {
    method: "POST",
    body: { provider, authCode },
  });

export const saveIntegrationMapping = (
  clientId: string,
  mapping: {
    pvField: string;
    acField: string;
    evField: string;
    jiraProjectKey?: string;
    asanaWorkspaceId?: string;
  },
) =>
  apiRequest<{ config: IntegrationConfig }>(`/clients/${clientId}/integration/mapping`, {
    method: "PATCH",
    body: mapping,
  });

export const disconnectIntegration = (clientId: string) =>
  apiRequest<{ success: boolean }>(`/clients/${clientId}/integration`, {
    method: "DELETE",
  });

export const syncIntegration = (clientId: string) =>
  apiRequest<{ snapshot: any; config: IntegrationConfig }>(
    `/clients/${clientId}/integration/sync`,
    {
      method: "POST",
    },
  );

export const simulateIntegrationError = (clientId: string, errorType: SimulatedErrorType) =>
  apiRequest<{ success: boolean; simulatedError: SimulatedErrorType }>(
    `/clients/${clientId}/integration/simulate-error`,
    {
      method: "POST",
      body: { errorType },
    },
  );
