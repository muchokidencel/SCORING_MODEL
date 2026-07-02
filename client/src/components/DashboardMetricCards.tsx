import { Card, CardContent } from "@/components/ui/card";
import { BandBadge } from "@/components/BandBadge";
import type { DashboardResponse } from "@/types/dashboard";
import { Activity, Award, BarChart3, TrendingUp } from "lucide-react";

export const DashboardMetricCards = ({ data }: { data: DashboardResponse }) => {
  const { composite, quantitative, qualitative, progress } = data;

  const cards = [
    {
      title: "Composite score",
      value: composite.score !== null ? composite.score.toFixed(1) : "—",
      subtext: composite.band ? <BandBadge band={composite.band} /> : "Incomplete",
      icon: Award,
      color: "text-primary",
    },
    {
      title: "Quantitative score",
      value: quantitative.departmentalScore !== null ? quantitative.departmentalScore.toFixed(1) : "—",
      subtext: "7 metrics aggregated",
      icon: BarChart3,
      color: "text-chart-1",
    },
    {
      title: "Qualitative average",
      value: qualitative.score !== null ? qualitative.score.toFixed(1) : "—",
      subtext: "3 maturity dimensions",
      icon: TrendingUp,
      color: "text-chart-3",
    },
    {
      title: "Project health points",
      value: progress.scorecardPoints !== null ? `${progress.scorecardPoints} / 100` : "—",
      subtext: progress.spi !== null && progress.cpi !== null 
        ? `SPI: ${progress.spi.toFixed(2)} | CPI: ${progress.cpi.toFixed(2)}`
        : "No snapshot yet",
      icon: Activity,
      color: "text-chart-2",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card key={i} className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-in-out">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                <div className="text-xs text-muted-foreground mt-1">{card.subtext}</div>
              </div>
              <div className={`p-3 rounded-xl bg-muted/60 ${card.color}`}>
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
