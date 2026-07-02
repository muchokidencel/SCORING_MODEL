import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { getQuantitativeScore, submitMetricScore } from "@/lib/scoring-api";
import { normalizeScore, scoreMetric } from "@/lib/scoring-formula";
import { queueOfflineRequest } from "@/lib/offlineSync";
import type { QuantitativeScoreCategory } from "@/types/scoring";

interface RowState {
  input: string;
  error: string | null;
  isSaving: boolean;
  savedScore: number | null;
}

const buildRowState = (category: QuantitativeScoreCategory): RowState => ({
  input: category.latestScore ? String(category.latestScore.rawMeasurement) : "",
  error: null,
  isSaving: false,
  savedScore: category.latestScore?.computedScore ?? null,
});

export const QuantitativeScoringForm = ({
  clientId,
  onSaved,
}: {
  clientId: string;
  onSaved?: () => void;
}) => {
  const { user } = useAuth();
  const canScore = user?.role === "SCORER" || user?.role === "ADMIN";

  const [categories, setCategories] = useState<QuantitativeScoreCategory[] | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQuantitativeScore(clientId)
      .then((res) => {
        if (cancelled) return;
        setCategories(res.categories);
        setRows(Object.fromEntries(res.categories.map((c) => [c.id, buildRowState(c)])));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "Failed to load scores.");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {loadError}
      </p>
    );
  }

  if (!categories) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const scoredCount = categories.filter((c) => rows[c.id]?.savedScore !== null).length;
  const allScored = scoredCount === categories.length;
  // Derived from local state rather than re-fetched, so rapid successive
  // saves can never race with a stale in-flight GET clobbering fresher state.
  const departmentalScore = allScored
    ? categories.reduce(
        (sum, c) => sum + normalizeScore(rows[c.id].savedScore!) * c.weight,
        0,
      )
    : null;

  const setRow = (id: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const liveScore = (category: QuantitativeScoreCategory, input: string) => {
    const value = Number(input);
    if (input.trim() === "" || !Number.isFinite(value) || value < 0) return null;
    return scoreMetric(value, category.benchmarkValue, category.benchmarkDirection);
  };

  const handleSave = async (category: QuantitativeScoreCategory) => {
    const row = rows[category.id];
    const value = Number(row.input);
    const previewValue = liveScore(category, row.input);

    if (row.input.trim() === "" || !Number.isFinite(value) || value < 0) {
      setRow(category.id, { error: "Enter a non-negative number" });
      return;
    }

    setRow(category.id, { error: null, isSaving: true });
    try {
      const { score } = await submitMetricScore(clientId, category.id, value);
      setRow(category.id, { isSaving: false, savedScore: score.computedScore });
      onSaved?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        const computedPreview = previewValue ?? 1;
        queueOfflineRequest(
          `/clients/${clientId}/metrics/${category.id}/score`,
          "POST",
          { rawMeasurement: value },
          `Submit score of ${value} for ${category.name}`
        );
        setRow(category.id, { isSaving: false, savedScore: computedPreview });
        onSaved?.();
      } else {
        setRow(category.id, {
          isSaving: false,
          error: err instanceof ApiError ? err.message : "Failed to save score.",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Departmental score</p>
            <p className="text-2xl font-bold tracking-tight">
              {departmentalScore !== null ? departmentalScore.toFixed(1) : "—"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{scoredCount} of {categories.length} scored</p>
        </CardContent>
      </Card>

      {!canScore && (
        <Empty className="py-6">
          <EmptyTitle>Read-only</EmptyTitle>
          <EmptyDescription>Only scorers and admins can enter measurements.</EmptyDescription>
        </Empty>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const row = rows[category.id];
          const preview = liveScore(category, row.input);
          return (
            <Card key={category.id}>
              <CardContent className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{category.name}</p>
                    <Badge variant="secondary">{(category.weight * 100).toFixed(0)}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {category.metricKpi} · target {category.targetBenchmark}
                  </p>
                </div>

                <Field data-invalid={!!row.error} className="w-40 shrink-0">
                  <FieldLabel htmlFor={`metric-${category.id}`} className="sr-only">
                    Raw measurement for {category.name}
                  </FieldLabel>
                  <Input
                    id={`metric-${category.id}`}
                    type="number"
                    step="any"
                    disabled={!canScore}
                    aria-invalid={!!row.error}
                    value={row.input}
                    onChange={(e) => setRow(category.id, { input: e.target.value, error: null })}
                  />
                  <FieldError errors={row.error ? [{ message: row.error }] : undefined} />
                </Field>

                <Badge className="shrink-0" variant={preview ? "default" : "outline"}>
                  {preview ?? "—"}/5
                </Badge>

                {canScore && (
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={row.isSaving}
                    onClick={() => handleSave(category)}
                  >
                    {row.isSaving ? "Saving…" : "Save"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
