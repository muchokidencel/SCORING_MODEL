import { getQuantitativeScore } from "./metric-score.service.js";
import { getQualitativeScore } from "./maturity-rating.service.js";

export type MaturityLevel = 1 | 3 | 5;
export type Band = "Excellent" | "Strong" | "Average" | "High risk";

/// Converts a 1/3/5 maturity rating to the same 0-100 scale used for
/// quantitative metric scores, so the two halves compose meaningfully.
export const normalizeLevel = (level: MaturityLevel): number => (level / 5) * 100;

/// Qualitative score = equal-weight average across the 3 dimensions (the
/// source doc gives no per-dimension weighting, unlike the 7 quantitative
/// metrics).
export const qualitativeScore = (levels: MaturityLevel[]): number =>
  levels.reduce((sum, level) => sum + normalizeLevel(level), 0) / levels.length;

/// Total Composite = 60% Quantitative + 40% Qualitative.
export const compositeScore = (quantitative: number, qualitative: number): number =>
  quantitative * 0.6 + qualitative * 0.4;

/// Excellent 85-100 / Strong 70-84 / Average 50-69 / High risk <50.
export const bandForScore = (score: number): Band => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Average";
  return "High risk";
};

/// Composite is null until both halves are fully scored (all 7 quantitative
/// metrics and all 3 qualitative dimensions) — a partial composite would
/// misrepresent a client as worse than they are just because scoring isn't
/// finished yet.
export const getCompositeScoreForClient = async (clientId: string) => {
  const [quantitative, qualitative] = await Promise.all([
    getQuantitativeScore(clientId),
    getQualitativeScore(clientId),
  ]);

  const composite =
    quantitative.departmentalScore !== null && qualitative.score !== null
      ? compositeScore(quantitative.departmentalScore, qualitative.score)
      : null;

  return {
    quantitative,
    qualitative,
    composite,
    band: composite !== null ? bandForScore(composite) : null,
  };
};
