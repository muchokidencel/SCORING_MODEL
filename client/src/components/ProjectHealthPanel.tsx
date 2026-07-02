import { useEffect, useState } from "react";
import { HealthHistoryChart } from "@/components/HealthHistoryChart";
import { ProgressScorecardBreakdown } from "@/components/ProgressScorecardBreakdown";
import { ProjectHealthForm } from "@/components/ProjectHealthForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { getHealthHistory } from "@/lib/health-api";
import type { ProjectMetricSnapshot } from "@/types/health";

export const ProjectHealthPanel = ({ clientId }: { clientId: string }) => {
  const { user } = useAuth();
  const canScore = user?.role === "SCORER" || user?.role === "ADMIN";

  const [snapshots, setSnapshots] = useState<ProjectMetricSnapshot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // guard prevents a stale request (e.g. from a StrictMode double-invoked
  // mount effect) from clobbering fresher state if it resolves late.
  const load = (guard?: { cancelled: boolean }) => {
    getHealthHistory(clientId)
      .then((res) => {
        if (!guard?.cancelled) setSnapshots(res.snapshots);
      })
      .catch((err) => {
        if (!guard?.cancelled) setError(err instanceof ApiError ? err.message : "Failed to load history.");
      });
  };

  useEffect(() => {
    const guard = { cancelled: false };
    load(guard);
    return () => {
      guard.cancelled = true;
    };
  }, [clientId]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!snapshots) {
    return <Skeleton className="h-64 w-full" />;
  }

  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  return (
    <div className="flex flex-col gap-6">
      {canScore && <ProjectHealthForm clientId={clientId} onSaved={load} />}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">SPI / CPI history</h3>
          <HealthHistoryChart snapshots={snapshots} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Latest progress scorecard
          </h3>
          <ProgressScorecardBreakdown latest={latest} />
        </div>
      </div>
    </div>
  );
};
