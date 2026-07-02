import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardCategory } from "@/types/dashboard";

interface WeightedMetricsChartProps {
  categories: DashboardCategory[];
  onMetricClick: (category: DashboardCategory) => void;
}

export const WeightedMetricsChart = ({
  categories,
  onMetricClick,
}: WeightedMetricsChartProps) => {
  const data = categories.map((cat) => ({
    name: cat.name,
    Earned: cat.earnedPoints !== null ? Number(cat.earnedPoints.toFixed(2)) : 0,
    Ceiling: Number(cat.ceilingPoints.toFixed(2)),
    Remaining: Number((cat.ceilingPoints - (cat.earnedPoints ?? 0)).toFixed(2)),
    raw: cat,
  }));

  return (
    <div className="h-96 w-full cursor-pointer">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
          onClick={(state: any) => {
            if (state && state.activePayload && state.activePayload.length > 0) {
              const clickedCategory = state.activePayload[0].payload.raw as DashboardCategory;
              onMetricClick(clickedCategory);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
          <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11 }}
            width={120}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              return [`${value} pts`, name];
            }}
          />
          <Legend />
          <Bar dataKey="Earned" name="Earned Points" stackId="a" fill="var(--chart-1)" maxBarSize={28} />
          <Bar dataKey="Remaining" name="Gap to Ceiling" stackId="a" fill="var(--muted)" radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

