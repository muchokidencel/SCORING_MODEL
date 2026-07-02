import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  benchTimePoints,
  budgetHealthPoints,
  scheduleHealthPoints,
  signoffPoints,
} from "@/lib/health-formula";
import type { ProjectMetricSnapshot } from "@/types/health";

const Row = ({ label, points, max }: { label: string; points: number; max: number }) => (
  <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">
      {points} / {max}
    </span>
  </div>
);

export const ProgressScorecardBreakdown = ({
  latest,
}: {
  latest: ProjectMetricSnapshot | null;
}) => {
  if (!latest) {
    return (
      <Empty className="py-10">
        <EmptyTitle>No snapshot yet</EmptyTitle>
        <EmptyDescription>Save a PV/AC/EV snapshot to see the scorecard breakdown.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <Card>
      <CardContent>
        <Row label="Schedule health (SPI)" points={scheduleHealthPoints(latest.spi)} max={30} />
        <Row label="Budget health (CPI)" points={budgetHealthPoints(latest.cpi)} max={30} />
        <Row label="Client signoff" points={signoffPoints(latest.clientSignoff)} max={20} />
        <Row
          label="Resource utilization"
          points={benchTimePoints(latest.resourceUtilization)}
          max={20}
        />
        <div className="mt-2 flex items-center justify-between pt-2 text-sm font-semibold">
          <span>Total</span>
          <span>{latest.scorecardPoints} / 100</span>
        </div>
      </CardContent>
    </Card>
  );
};
