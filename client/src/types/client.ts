export type ClientStatus = "ACTIVE" | "INACTIVE";

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  contactEmail: string | null;
  accountManager: string | null;
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  status?: ClientStatus;
  contactEmail?: string;
  accountManager?: string;
  onboardedAt?: string;
}

export interface EvaluationCategory {
  id: string;
  name: string;
  metricKpi: string;
  measurementFormula: string;
  targetBenchmark: string;
  weight: number;
  sortOrder: number;
}
