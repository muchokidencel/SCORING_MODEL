import { apiRequest } from "@/lib/api";
import type { HealthSnapshotInput, ProjectMetricSnapshot } from "@/types/health";

export const getHealthHistory = (clientId: string) =>
  apiRequest<{ snapshots: ProjectMetricSnapshot[] }>(`/clients/${clientId}/health-history`);

export const submitHealthSnapshot = (clientId: string, input: HealthSnapshotInput) =>
  apiRequest<{ snapshot: ProjectMetricSnapshot }>(`/clients/${clientId}/health-snapshots`, {
    method: "POST",
    body: input,
  });
