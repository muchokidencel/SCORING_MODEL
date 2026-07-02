import { apiRequest } from "@/lib/api";

export interface SystemHealthResponse {
  status: "OK" | "DEGRADED";
  uptimeSeconds: number;
  timestamp: string;
  database: {
    status: "HEALTHY" | "UNHEALTHY";
    latencyMs: number;
    error: string | null;
  };
  process: {
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
    nodeVersion: string;
    platform: string;
    pid: number;
  };
  cronJobs: {
    recalculationCron: {
      schedule: string;
      status: "ACTIVE" | "INACTIVE";
    };
  };
}

export const getSystemHealth = () =>
  apiRequest<SystemHealthResponse>("/admin/system-health");

export const triggerSystemRecalculation = () =>
  apiRequest<{ success: boolean; message: string }>("/admin/trigger-cron", {
    method: "POST",
  });
