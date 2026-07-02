import { toast } from "sonner";
import { apiRequest } from "./api";

export interface QueuedRequest {
  id: string;
  url: string;
  method: "POST" | "PATCH" | "DELETE";
  body: any;
  createdAt: string;
  description: string;
}

const QUEUE_KEY = "COSEKE_OFFLINE_SYNC_QUEUE";

export const getOfflineQueue = (): QueuedRequest[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const queueOfflineRequest = (
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body: any,
  description: string,
) => {
  const queue = getOfflineQueue();
  const entry: QueuedRequest = {
    id: Math.random().toString(36).slice(2) + Date.now(),
    url,
    method,
    body,
    createdAt: new Date().toISOString(),
    description,
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  toast.warning(`Offline Queue: "${description}" cached.`, {
    description: "Will automatically sync when internet connection returns.",
    duration: 5000,
  });
};

export const flushOfflineQueue = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const count = queue.length;
  console.log(`[OfflineSync] Network re-established. Flushing ${count} queued items...`);
  const toastId = toast.loading(`Internet restored. Syncing ${count} pending actions...`);

  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await apiRequest(item.url, {
        method: item.method,
        body: item.body,
      });
      succeeded++;
    } catch (err) {
      console.error(`[OfflineSync] Failed to sync: ${item.description}`, err);
      failed++;
    }
  }

  // Clear queue
  localStorage.setItem(QUEUE_KEY, "[]");

  toast.dismiss(toastId);
  if (failed === 0) {
    toast.success(`Offline sync complete! Successfully updated ${succeeded} records.`);
  } else {
    toast.error(`Offline sync partial success: ${succeeded} synced, ${failed} failed.`);
  }
};
