/// Mirrors server/src/services/health.service.ts exactly, for live preview
/// (Doherty threshold: feedback well under 400ms, no round trip needed).
/// Keep these two files in lockstep if the bands ever change.

export const spi = (ev: number, pv: number): number => (pv === 0 ? 0 : ev / pv);

export const cpi = (ev: number, ac: number): number => (ac === 0 ? 0 : ev / ac);

export const scheduleHealthPoints = (spiValue: number): number => {
  if (spiValue >= 1.0) return 30;
  if (spiValue >= 0.9) return 15;
  return 0;
};

export const budgetHealthPoints = (cpiValue: number): number => {
  if (cpiValue >= 1.0) return 30;
  if (cpiValue >= 0.9) return 15;
  return 0;
};

export const signoffPoints = (signoff: boolean): number => (signoff ? 20 : 0);

export const benchTimePoints = (resourceUtilization: number): number =>
  resourceUtilization >= 0.9 ? 20 : 10;

export const progressScorecard = (params: {
  spiValue: number;
  cpiValue: number;
  signoff: boolean;
  resourceUtilization: number;
}): number =>
  scheduleHealthPoints(params.spiValue) +
  budgetHealthPoints(params.cpiValue) +
  signoffPoints(params.signoff) +
  benchTimePoints(params.resourceUtilization);
