import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const monitoringRouter = Router();

monitoringRouter.use(requireAuth);
monitoringRouter.use(requireRole("ADMIN"));

monitoringRouter.get(
  "/system-health",
  asyncHandler(async (req, res) => {
    // 1. Check database connectivity
    let dbStatus = "HEALTHY";
    let dbError: string | null = null;
    const dbStart = Date.now();
    let dbLatencyMs = 0;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = "UNHEALTHY";
      dbError = err.message ?? "Unknown database error";
    }

    // 2. Fetch memory usage
    const memUsage = process.memoryUsage();

    // 3. Process status details
    const healthData = {
      status: dbStatus === "HEALTHY" ? "OK" : "DEGRADED",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      process: {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
          external: Math.round(memUsage.external / 1024 / 1024) + " MB",
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      cronJobs: {
        recalculationCron: {
          schedule: process.env.CRON_SCHEDULE ?? "0 0 */14 * *",
          status: "ACTIVE",
        },
      },
    };

    res.json(healthData);
  }),
);

monitoringRouter.post(
  "/trigger-cron",
  asyncHandler(async (req, res) => {
    const { runSyncCron } = await import("../services/cron-jobs.js");
    await runSyncCron();
    res.json({ success: true, message: "System recalculation and integration sync triggered." });
  }),
);
