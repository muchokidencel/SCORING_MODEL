/// Minimal in-memory TTL cache for the dashboard aggregation endpoint (per
/// the plan's note: "avoid recomputing the formula on every request if
/// scores haven't changed"). Callers invalidate on write for immediate
/// consistency; the TTL is just a safety net, not the primary mechanism.
/// A single-process Map is fine at this stage — revisit if the app ever
/// runs multiple server instances behind a load balancer.
const store = new Map<string, { value: unknown; expiresAt: number }>();

export const getCached = <T>(key: string): T | undefined => {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
};

export const setCached = (key: string, value: unknown, ttlMs: number): void => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const invalidateCached = (key: string): void => {
  store.delete(key);
};
