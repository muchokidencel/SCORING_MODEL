export interface DashboardCategory {
  id: string;
  name: string;
  weight: number;
  computedScore: number | null;
  earnedPoints: number | null;
  ceilingPoints: number;
}

export interface DashboardDimension {
  key: string;
  label: string;
  currentLevel: number | null;
  notes: string | null;
  ratedAt: string | null;
}

export interface DashboardProgress {
  scorecardPoints: number | null;
  spi: number | null;
  cpi: number | null;
  period: string | null;
}

export interface DashboardResponse {
  composite: {
    score: number | null;
    band: "Excellent" | "Strong" | "Average" | "High risk" | null;
  };
  quantitative: {
    departmentalScore: number | null;
    categories: DashboardCategory[];
  };
  qualitative: {
    score: number | null;
    dimensions: DashboardDimension[];
  };
  progress: DashboardProgress;
}
