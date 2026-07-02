import { apiRequest } from "@/lib/api";
import type { AuditLog } from "@/types/audit";

export const getAuditLogs = (clientId: string) =>
  apiRequest<{ logs: AuditLog[] }>(`/clients/${clientId}/audit-logs`);
