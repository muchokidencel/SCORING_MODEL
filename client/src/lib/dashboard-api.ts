import { apiRequest } from "@/lib/api";
import type { DashboardResponse } from "@/types/dashboard";

export const getDashboardData = (clientId: string) =>
  apiRequest<DashboardResponse>(`/clients/${clientId}/dashboard`);
