import type { QuantitativeScoreResponse } from "@/types/scoring";

export type MaturityDimensionKey =
  | "SYSTEM_ADOPTION"
  | "DATA_PRIVACY_COMPLIANCE"
  | "CHANGE_MANAGEMENT_ONBOARDING";

export type MaturityLevel = 1 | 3 | 5;

export interface QualitativeDimension {
  key: MaturityDimensionKey;
  label: string;
  levels: { 1: string; 3: string; 5: string };
  currentLevel: MaturityLevel | null;
  notes: string | null;
  ratedAt: string | null;
}

export interface QualitativeScoreResponse {
  dimensions: QualitativeDimension[];
  score: number | null;
}

export type Band = "Excellent" | "Strong" | "Average" | "High risk";

export interface CompositeScoreResponse {
  quantitative: QuantitativeScoreResponse;
  qualitative: QualitativeScoreResponse;
  composite: number | null;
  band: Band | null;
}
