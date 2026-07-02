import { apiRequest } from "@/lib/api";
import type { CompositeScoreResponse, MaturityDimensionKey } from "@/types/composite";

export const getCompositeScore = (clientId: string) =>
  apiRequest<CompositeScoreResponse>(`/clients/${clientId}/composite-score`);

export const submitMaturityRating = (
  clientId: string,
  dimension: MaturityDimensionKey,
  level: 1 | 3 | 5,
  notes?: string,
) =>
  apiRequest<{ rating: { level: number } }>(`/clients/${clientId}/dimensions/${dimension}/rating`, {
    method: "POST",
    body: { level, notes },
  });
