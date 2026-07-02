import { useEffect, useState } from "react";
import { BandBadge } from "@/components/BandBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { getCompositeScore } from "@/lib/composite-api";
import type { CompositeScoreResponse } from "@/types/composite";

/// Self-contained: fetches its own data so it can be dropped onto the client
/// detail page now and the scoring dashboard later (Epic 4) without wiring.
/// Pass refreshKey (e.g. a counter bumped by sibling forms' onSaved) to
/// re-fetch after a metric or rating is saved elsewhere on the page.
export const CompositeScoreCard = ({
  clientId,
  refreshKey,
}: {
  clientId: string;
  refreshKey?: number;
}) => {
  const [data, setData] = useState<CompositeScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCompositeScore(clientId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load score.");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, refreshKey]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!data) {
    return <Skeleton className="h-20 w-full" />;
  }

  const quantScored = data.quantitative.departmentalScore !== null;
  const qualScored = data.qualitative.score !== null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Composite score</p>
          <p className="text-2xl font-bold tracking-tight">
            {data.composite !== null ? data.composite.toFixed(1) : "—"}
          </p>
        </div>
        {data.band ? (
          <BandBadge band={data.band} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {!quantScored && !qualScored
              ? "No scores entered yet"
              : !quantScored
                ? "Quantitative scoring incomplete"
                : "Qualitative rating incomplete"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
