import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { syncIntegration } from "./integration.service.js";

let syncJob: cron.ScheduledTask | null = null;

export const startCronJobs = () => {
  const schedule = process.env.CRON_SCHEDULE ?? "0 0 */14 * *";

  syncJob = cron.schedule(schedule, async () => {
    console.log(`[Cron] Starting scheduled integrations sync: ${new Date().toISOString()}`);
    await runSyncCron();
  });

  console.log(`[Cron] Background sync scheduler started with schedule: "${schedule}"`);
};

export const stopCronJobs = () => {
  if (syncJob) {
    syncJob.stop();
    syncJob = null;
    console.log("[Cron] Background sync scheduler stopped.");
  }
};

export const runSyncCron = async () => {
  const configs = await prisma.integrationConfig.findMany();
  console.log(`[Cron] Found ${configs.length} active client integrations to sync.`);

  // Find a system user to attribute the cron snapshot to (foreign key safety)
  const systemUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  }) ?? await prisma.user.findFirst();

  if (!systemUser) {
    console.error("[Cron] Error: No users found in database to attribute the sync snapshots to.");
    return;
  }

  for (const config of configs) {
    try {
      console.log(`[Cron] Syncing client ${config.clientId}...`);
      await syncIntegration(config.clientId, systemUser.id);
      console.log(`[Cron] Sync succeeded for client ${config.clientId}`);
    } catch (err: any) {
      console.error(`[Cron] Sync failed for client ${config.clientId}:`, err.message ?? err);
    }
  }
};
