import { useEffect, useState } from "react";
import { getDashboardData } from "@/lib/dashboard-api";
import { listEvaluationCategories } from "@/lib/clients-api";
import { DashboardMetricCards } from "@/components/DashboardMetricCards";
import { WeightedMetricsChart } from "@/components/WeightedMetricsChart";
import { MetricDrilldownDialog } from "@/components/MetricDrilldownDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { BarChart, Info } from "lucide-react";
import type { DashboardCategory, DashboardResponse } from "@/types/dashboard";
import type { EvaluationCategory } from "@/types/client";

export const DashboardTab = ({ clientId }: { clientId: string }) => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [categories, setCategories] = useState<EvaluationCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown dialog state
  const [selectedCat, setSelectedCat] = useState<DashboardCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getDashboardData(clientId), listEvaluationCategories()])
      .then(([dbRes, catRes]) => {
        if (!cancelled) {
          setData(dbRes);
          setCategories(catRes.categories);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        <h4 className="font-semibold text-sm mb-1">Error Loading Dashboard</h4>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No Dashboard Data</EmptyTitle>
          <EmptyDescription>Unable to fetch dashboard details.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const quantScoredCount = data.quantitative.categories.filter(
    (c) => c.computedScore !== null
  ).length;
  const qualScoredCount = data.qualitative.dimensions.filter(
    (d) => d.currentLevel !== null
  ).length;

  const isCompletelyUnscored = quantScoredCount === 0 && qualScoredCount === 0;

  if (isCompletelyUnscored) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <BarChart className="size-12 text-muted-foreground mx-auto mb-4" />
          <EmptyTitle>Client Not Scored Yet</EmptyTitle>
          <EmptyDescription>
            This dashboard displays aggregate calculations and point breakdowns once scoring is underway. 
            Navigate to the **Scoring** tab to start entering scores.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Find matching full EvaluationCategory detail for the drill-down modal
  const fullCategory =
    selectedCat && categories
      ? categories.find((c) => c.id === selectedCat.id) || null
      : null;

  return (
    <div className="space-y-6">
      {/* Partial Scoring Warning Banner */}
      {(quantScoredCount < 7 || qualScoredCount < 3) && (
        <div className="flex gap-2.5 items-start rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          <Info className="size-4 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold mb-0.5">Partial Scoring In Progress</h4>
            <p className="text-xs">
              Composite score and bands will resolve once all 7 quantitative metrics (scored:{" "}
              {quantScoredCount}/7) and all 3 qualitative dimensions (scored: {qualScoredCount}/3) are
              completed.
            </p>
          </div>
        </div>
      )}

      {/* 1. Metric Cards Row */}
      <DashboardMetricCards data={data} />

      {/* 2. Charts & Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weighted Metrics Horizontal Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Weighted Quantitative Metrics</CardTitle>
            <CardDescription>
              Earned points vs weight ceiling. Click on any bar to drill down into scoring history.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            {quantScoredCount > 0 ? (
              <WeightedMetricsChart
                categories={data.quantitative.categories}
                onMetricClick={(cat) => {
                  setSelectedCat(cat);
                  setDialogOpen(true);
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-10">No quantitative metrics scored yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Qualitative Dimensions Cards */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Qualitative Maturity Dimensions</CardTitle>
            <CardDescription>
              Evaluation of maturity levels across key organizational focus areas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {data.qualitative.dimensions.map((dim) => (
              <div
                key={dim.key}
                className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{dim.label}</span>
                  {dim.currentLevel !== null ? (
                    <Badge className="bg-primary text-primary-foreground font-semibold">
                      Level {dim.currentLevel}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unrated</Badge>
                  )}
                </div>
                {dim.notes ? (
                  <p className="text-xs text-muted-foreground italic mt-1 leading-relaxed">
                    "{dim.notes}"
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic mt-1">No notes recorded.</p>
                )}
                {dim.ratedAt && (
                  <span className="text-[10px] text-muted-foreground/75 mt-1 block self-end">
                    Rated on {new Date(dim.ratedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. Drill-down Dialog */}
      <MetricDrilldownDialog
        clientId={clientId}
        category={selectedCat}
        fullCategory={fullCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
