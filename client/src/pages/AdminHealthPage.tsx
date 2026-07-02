import { PageHeader } from "@/components/PageHeader";
import { SystemHealthPanel } from "@/components/SystemHealthPanel";

export const AdminHealthPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Health Diagnostics"
        description="Admin dashboard displaying process diagnostics, database latency status, recalculation schedules, and offline sync metrics."
      />
      <SystemHealthPanel />
    </div>
  );
};
