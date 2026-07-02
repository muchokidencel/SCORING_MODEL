import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { ProjectMetricSnapshot } from "@/types/health";

/// Single shared y-axis for both SPI and CPI (Handbook: no dual-axis
/// distortion) — both indices are unitless ratios centered on 1.0, so one
/// axis reads correctly for both.
export const HealthHistoryChart = ({ snapshots }: { snapshots: ProjectMetricSnapshot[] }) => {
  if (snapshots.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyTitle>No history yet</EmptyTitle>
        <EmptyDescription>SPI/CPI history appears once a snapshot is saved.</EmptyDescription>
      </Empty>
    );
  }

  const data = snapshots.map((s) => ({
    // date + time: multiple snapshots entered the same day (corrections,
    // testing) still land on distinct x-axis points.
    period: new Date(s.period).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }),
    SPI: Number(s.spi.toFixed(3)),
    CPI: Number(s.cpi.toFixed(3)),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, "auto"]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="SPI" stroke="var(--chart-1)" strokeWidth={2} dot />
          <Line type="monotone" dataKey="CPI" stroke="var(--chart-2)" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
