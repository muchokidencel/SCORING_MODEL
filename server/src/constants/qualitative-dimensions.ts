import type { MaturityDimension } from "@prisma/client";

/// Fixed rubric content from the scoring-model doc. No per-client
/// configuration, so this lives as a code constant rather than a seeded
/// reference table (unlike EvaluationCategory, which has per-category
/// weights/benchmarks worth persisting).
export interface QualitativeDimensionDef {
  key: MaturityDimension;
  label: string;
  levels: { 1: string; 3: string; 5: string };
}

export const QUALITATIVE_DIMENSIONS: QualitativeDimensionDef[] = [
  {
    key: "SYSTEM_ADOPTION",
    label: "Client System Adoption Maturity",
    levels: {
      1: "Resists EDRMS.",
      3: "Uses EDRMS but workflow still uses paper or emails.",
      5: "Complete digital transformation.",
    },
  },
  {
    key: "DATA_PRIVACY_COMPLIANCE",
    label: "Data Privacy and Compliance Alignment",
    levels: {
      1: "No data masking.",
      3: "Basic access but routed audit logs.",
      5: "End to End encryption.",
    },
  },
  {
    key: "CHANGE_MANAGEMENT_ONBOARDING",
    label: "Change Management and Onboarding Quality",
    levels: {
      1: "Train the trainer and hands on support.",
      3: "Standard documentation provided.",
      5: "Comprehensive onboarding with video modules, department champions and continuous engagement surveys.",
    },
  },
];

export const isValidDimension = (value: string): value is MaturityDimension =>
  QUALITATIVE_DIMENSIONS.some((d) => d.key === value);
