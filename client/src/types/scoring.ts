export type BenchmarkDirection = "AT_LEAST" | "AT_MOST";

export interface LatestMetricScore {
  rawMeasurement: number;
  computedScore: number;
  period: string;
  scoredAt: string;
}

export interface QuantitativeScoreCategory {
  id: string;
  name: string;
  metricKpi: string;
  targetBenchmark: string;
  benchmarkValue: number;
  benchmarkDirection: BenchmarkDirection;
  weight: number;
  latestScore: LatestMetricScore | null;
}

export interface QuantitativeScoreResponse {
  categories: QuantitativeScoreCategory[];
  departmentalScore: number | null;
}

export interface HistoricalMetricScore {
  id: string;
  clientId: string;
  evaluationCategoryId: string;
  period: string;
  rawMeasurement: number;
  computedScore: number;
  weightSnapshot: number;
  scoredById: string;
  createdAt: string;
  scoredBy: {
    name: string;
  };
}

