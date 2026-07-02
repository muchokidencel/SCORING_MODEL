import { useEffect, useState } from "react";
import { getSystemHealth, triggerSystemRecalculation, type SystemHealthResponse } from "@/lib/monitoring-api";
import { getOfflineQueue, flushOfflineQueue, type QueuedRequest } from "@/lib/offlineSync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Activity,
  Cpu,
  Database,
  Globe,
  HardDrive,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { ApiError } from "@/lib/api";

export const SystemHealthPanel = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<QueuedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const loadData = () => {
    setLoading(true);
    getSystemHealth()
      .then((res) => {
        setHealth(res);
      })
      .catch((err) => {
        console.error("Failed to load system diagnostics:", err);
      })
      .finally(() => {
        setLoading(false);
        setOfflineQueue(getOfflineQueue());
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      getSystemHealth()
        .then(setHealth)
        .catch(console.error);
    }, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleForceRecalculation = async () => {
    setTriggering(true);
    try {
      const res = await triggerSystemRecalculation();
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : "Trigger failed");
    } finally {
      setTriggering(false);
    }
  };

  const handleManualOfflineFlush = async () => {
    setSyncingOffline(true);
    try {
      await flushOfflineQueue();
      setOfflineQueue([]);
    } catch {
      toast.error("Offline sync failed");
    } finally {
      setSyncingOffline(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full animate-pulse" />;
  }

  if (!health) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="text-center py-10 text-destructive">
          Failed to fetch server metrics. Check if server is running.
        </CardContent>
      </Card>
    );
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Status */}
        <Card className="shadow-xs">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">System Status</p>
              <h4 className="text-2xl font-bold tracking-tight mt-1">{health.status}</h4>
            </div>
            <Server className={`size-8 ${health.status === "OK" ? "text-green-500" : "text-amber-500 animate-pulse"}`} />
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card className="shadow-xs">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Database Status</p>
              <h4 className="text-2xl font-bold tracking-tight mt-1">
                {health.database.latencyMs} <span className="text-xs font-normal text-muted-foreground">ms</span>
              </h4>
            </div>
            <Database className="size-8 text-blue-500" />
          </CardContent>
        </Card>

        {/* Memory RSS */}
        <Card className="shadow-xs">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Memory Usage</p>
              <h4 className="text-2xl font-bold tracking-tight mt-1">{health.process.memory.heapUsed}</h4>
            </div>
            <HardDrive className="size-8 text-purple-500" />
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className="shadow-xs">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">System Uptime</p>
              <h4 className="text-xl font-bold mt-2">{formatUptime(health.uptimeSeconds)}</h4>
            </div>
            <Cpu className="size-8 text-orange-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recalculation Engine Settings */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              Recalculation & Cron Scheduler
            </CardTitle>
            <CardDescription>
              Details of active background recalculation loops and system-wide PM sync tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Job Name</span>
              <span className="font-semibold text-foreground">bi-weekly-sync-recalculate</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Cron Cadence</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {health.cronJobs.recalculationCron.schedule}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">State</span>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-semibold">
                {health.cronJobs.recalculationCron.status}
              </Badge>
            </div>

            <div className="pt-2">
              <Button onClick={handleForceRecalculation} disabled={triggering} className="gap-2">
                <RefreshCw className={`size-4 ${triggering ? "animate-spin" : ""}`} />
                Force System-Wide Recalculation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Offline Queue diagnostics */}
        <Card className="shadow-xs border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-muted-foreground" />
              Offline Sync Buffer
            </CardTitle>
            <CardDescription>
              Actions queued locally due to network outages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">Buffered Operations</span>
              <span className="font-bold text-foreground">{offlineQueue.length} pending</span>
            </div>

            {offlineQueue.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {offlineQueue.map((item) => (
                  <div key={item.id} className="text-xs bg-muted/50 border rounded-lg p-2 flex justify-between gap-2">
                    <span className="font-medium text-foreground">{item.description}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                <Button
                  onClick={handleManualOfflineFlush}
                  disabled={syncingOffline}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  Force Flush Sync Queue
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Sync buffer empty. All client actions are synchronized with server.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics details */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Server Architecture Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h5 className="font-semibold text-muted-foreground mb-2">Memory breakdown</h5>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between"><dt>Resident Set Size (RSS):</dt><dd className="font-medium">{health.process.memory.rss}</dd></div>
              <div className="flex justify-between"><dt>Heap Total Capacity:</dt><dd className="font-medium">{health.process.memory.heapTotal}</dd></div>
              <div className="flex justify-between"><dt>Heap Active Usage:</dt><dd className="font-medium">{health.process.memory.heapUsed}</dd></div>
            </dl>
          </div>
          <div>
            <h5 className="font-semibold text-muted-foreground mb-2">Process runtime</h5>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between"><dt>Node version:</dt><dd className="font-medium font-mono">{health.process.nodeVersion}</dd></div>
              <div className="flex justify-between"><dt>Operating System Platform:</dt><dd className="font-medium capitalize">{health.process.platform}</dd></div>
              <div className="flex justify-between"><dt>Process ID (PID):</dt><dd className="font-medium font-mono">{health.process.pid}</dd></div>
            </dl>
          </div>
          <div>
            <h5 className="font-semibold text-muted-foreground mb-2">System timestamp</h5>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between"><dt>Server Time UTC:</dt><dd className="font-medium">{new Date(health.timestamp).toLocaleTimeString()}</dd></div>
              <div className="flex justify-between"><dt>Server Date UTC:</dt><dd className="font-medium">{new Date(health.timestamp).toLocaleDateString()}</dd></div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
