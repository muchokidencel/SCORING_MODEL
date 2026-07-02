import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMetricHistory } from "@/lib/scoring-api";
import type { HistoricalMetricScore } from "@/types/scoring";
import type { EvaluationCategory } from "@/types/client";
import type { DashboardCategory } from "@/types/dashboard";

interface MetricDrilldownDialogProps {
  clientId: string;
  category: DashboardCategory | null;
  fullCategory: EvaluationCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MetricDrilldownDialog = ({
  clientId,
  category,
  fullCategory,
  open,
  onOpenChange,
}: MetricDrilldownDialogProps) => {
  const [history, setHistory] = useState<HistoricalMetricScore[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !category) {
      setHistory(null);
      return;
    }

    setLoading(true);
    getMetricHistory(clientId, category.id)
      .then((res) => {
        setHistory(res.history);
      })
      .catch((err) => {
        console.error("Failed to load metric history:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId, category, open]);

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category.name}</DialogTitle>
          <DialogDescription>
            Detailed analysis, formulas, and historical entries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {fullCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4 text-xs">
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  KPI Metric
                </h4>
                <p className="text-sm font-medium text-foreground">{fullCategory.metricKpi}</p>
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Target Benchmark
                </h4>
                <p className="text-sm font-medium text-foreground">{fullCategory.targetBenchmark}</p>
              </div>
              <div className="md:col-span-2 border-t pt-2 mt-1">
                <h4 className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Measurement Formula
                </h4>
                <code className="text-sm block bg-muted p-2 rounded-md font-mono text-foreground break-all whitespace-pre-wrap">
                  {fullCategory.measurementFormula}
                </code>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Score History</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : history === null ? (
              <p className="text-xs text-destructive py-4 text-center">Failed to load scoring history.</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No scores entered yet for this metric.</p>
            ) : (
              <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Raw Measurement</TableHead>
                      <TableHead>Computed Score</TableHead>
                      <TableHead>Scored By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.rawMeasurement}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full size-6 text-xs">
                            {item.computedScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {item.scoredBy?.name ?? "System"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
};
