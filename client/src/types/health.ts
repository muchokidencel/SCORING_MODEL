export interface ProjectMetricSnapshot {
  id: string;
  clientId: string;
  period: string;
  pv: number;
  ac: number;
  ev: number;
  clientSignoff: boolean;
  resourceUtilization: number;
  spi: number;
  cpi: number;
  scorecardPoints: number;
  createdAt: string;
}

export interface HealthSnapshotInput {
  pv: number;
  ac: number;
  ev: number;
  clientSignoff: boolean;
  resourceUtilization: number;
}
