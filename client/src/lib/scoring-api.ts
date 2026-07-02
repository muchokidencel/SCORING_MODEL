import { apiRequest } from "@/lib/api";
import type { HistoricalMetricScore, QuantitativeScoreResponse } from "@/types/scoring";

export const getQuantitativeScore = (clientId: string) =>
  apiRequest<QuantitativeScoreResponse>(`/clients/${clientId}/quantitative-score`);

export const submitMetricScore = (clientId: string, categoryId: string, rawMeasurement: number) =>
  apiRequest<{ score: { computedScore: number } }>(
    `/clients/${clientId}/metrics/${categoryId}/score`,
    { method: "POST", body: { rawMeasurement } },
  );

export const getMetricHistory = (clientId: string, categoryId: string) =>
  apiRequest<{ history: HistoricalMetricScore[] }>(
    `/clients/${clientId}/metrics/${categoryId}/history`,
  );

