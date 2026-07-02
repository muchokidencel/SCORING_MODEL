import type { BenchmarkDirection } from "@/types/scoring";

/// Mirrors server/src/services/scoring.service.ts exactly, so the score
/// shown while typing matches what the backend will compute on save
/// (Doherty threshold: feedback in well under 400ms, no round trip needed).
/// Keep these two files in lockstep if the banding rule ever changes.

const VARIANCE_BANDS: { maxVariance: number; score: 5 | 4 | 3 | 2 | 1 }[] = [
  { maxVariance: 0, score: 5 },
  { maxVariance: 0.05, score: 4 },
  { maxVariance: 0.1, score: 3 },
  { maxVariance: 0.15, score: 2 },
];

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

export const normalizeScore = (score: number): number => (score / 5) * 100;
