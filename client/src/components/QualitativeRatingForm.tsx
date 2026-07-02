import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { getCompositeScore, submitMaturityRating } from "@/lib/composite-api";
import { queueOfflineRequest } from "@/lib/offlineSync";
import type { MaturityLevel, QualitativeDimension } from "@/types/composite";

interface RowState {
  level: MaturityLevel | null;
  notes: string;
  isSaving: boolean;
  error: string | null;
}

const LEVELS: MaturityLevel[] = [1, 3, 5];

export const QualitativeRatingForm = ({
  clientId,
  onSaved,
}: {
  clientId: string;
  onSaved?: () => void;
}) => {
  const { user } = useAuth();
  const canScore = user?.role === "SCORER" || user?.role === "ADMIN";

  const [dimensions, setDimensions] = useState<QualitativeDimension[] | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCompositeScore(clientId)
      .then((res) => {
        if (cancelled) return;
        setDimensions(res.qualitative.dimensions);
        setRows(
          Object.fromEntries(
            res.qualitative.dimensions.map((d) => [
              d.key,
              { level: d.currentLevel, notes: d.notes ?? "", isSaving: false, error: null },
            ]),
          ),
        );
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "Failed to load ratings.");
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

  if (!dimensions) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const setRow = (key: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleSave = async (dimension: QualitativeDimension) => {
    const row = rows[dimension.key];
    if (row.level === null) {
      setRow(dimension.key, { error: "Choose a level" });
      return;
    }

    setRow(dimension.key, { error: null, isSaving: true });
    try {
      await submitMaturityRating(clientId, dimension.key, row.level, row.notes || undefined);
      setRow(dimension.key, { isSaving: false });
      onSaved?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        queueOfflineRequest(
          `/clients/${clientId}/dimensions/${dimension.key}/rating`,
          "POST",
          { level: row.level, notes: row.notes || undefined },
          `Submit Level ${row.level} rating for ${dimension.label}`
        );
        setRow(dimension.key, { isSaving: false });
        onSaved?.();
      } else {
        setRow(dimension.key, {
          isSaving: false,
          error: err instanceof ApiError ? err.message : "Failed to save rating.",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!canScore && (
        <Empty className="py-6">
          <EmptyTitle>Read-only</EmptyTitle>
          <EmptyDescription>Only scorers and admins can enter ratings.</EmptyDescription>
        </Empty>
      )}

      {dimensions.map((dimension) => {
        const row = rows[dimension.key];
        return (
          <Card key={dimension.key}>
            <CardContent className="flex flex-col gap-3">
              <fieldset>
                <legend className="mb-2 font-medium">{dimension.label}</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {LEVELS.map((level) => (
                    <label
                      key={level}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                        "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                        !canScore && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        name={`dimension-${dimension.key}`}
                        value={level}
                        checked={row.level === level}
                        disabled={!canScore}
                        onChange={() => setRow(dimension.key, { level, error: null })}
                        className="sr-only"
                      />
                      <span className="font-medium">Level {level}</span>
                      <span className="text-muted-foreground">{dimension.levels[level]}</span>
                    </label>
                  ))}
                </div>
                {row.error && (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {row.error}
                  </p>
                )}
              </fieldset>

              {canScore && (
                <div className="flex items-end gap-2">
                  <Input
                    placeholder="Notes (optional)"
                    value={row.notes}
                    onChange={(e) => setRow(dimension.key, { notes: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    disabled={row.isSaving}
                    onClick={() => handleSave(dimension)}
                  >
                    {row.isSaving ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
