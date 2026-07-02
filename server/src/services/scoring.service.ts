import type { BenchmarkDirection } from "@prisma/client";

/// Placeholder variance bands (0%/5%/10%/15%) applied uniformly across all
/// metrics until the real per-metric thresholds from the source scoring-model
/// doc are available. Replace VARIANCE_BANDS with real per-category bands
/// once known — the shape of scoreMetric() below won't need to change, only
/// this table.
const VARIANCE_BANDS: { maxVariance: number; score: 5 | 4 | 3 | 2 | 1 }[] = [
  { maxVariance: 0, score: 5 },
  { maxVariance: 0.05, score: 4 },
  { maxVariance: 0.1, score: 3 },
  { maxVariance: 0.15, score: 2 },
];

/// Scores a single metric 1-5 by how far the raw measurement varies from its
/// benchmark, in the direction that matters for that metric (AT_LEAST: higher
/// is better, benchmark is a floor; AT_MOST: lower is better, benchmark is a
/// ceiling).
export const scoreMetric = (
  rawMeasurement: number,
  benchmarkValue: number,
  direction: BenchmarkDirection,
): 1 | 2 | 3 | 4 | 5 => {
  if (benchmarkValue === 0) {
    return rawMeasurement === 0 ? 5 : 1;
  }

  const variance =
    direction === "AT_LEAST"
      ? (benchmarkValue - rawMeasurement) / benchmarkValue
      : (rawMeasurement - benchmarkValue) / benchmarkValue;

  for (const band of VARIANCE_BANDS) {
    if (variance <= band.maxVariance) return band.score;
  }
  return 1;
};

/// Converts a 1-5 metric score to a 0-100 scale so it composes with the
/// composite-score bands (Excellent 85-100 / Strong 70-84 / ...), which only
/// make sense against a 0-100 quantitative score.
export const normalizeScore = (score: number): number => (score / 5) * 100;

/// Final Departmental Score = Σ(normalized metric score × weight).
/// Weights are expected to sum to 1 across the full set (verified at seed
/// time), so an all-5s input yields exactly 100.
export const departmentalScore = (scores: { score: number; weight: number }[]): number =>
  scores.reduce((sum, { score, weight }) => sum + normalizeScore(score) * weight, 0);
