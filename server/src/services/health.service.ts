/// Schedule Performance Index = EV ÷ PV. 0 (not Infinity/NaN) when PV is 0.
export const spi = (ev: number, pv: number): number => (pv === 0 ? 0 : ev / pv);

/// Cost Performance Index = EV ÷ AC. 0 (not Infinity/NaN) when AC is 0.
export const cpi = (ev: number, ac: number): number => (ac === 0 ? 0 : ev / ac);

/// SPI ≥ 1.0: ahead of or on schedule -> 30. 0.9-0.99: minor slip -> 15.
/// Below 0.9: major slip -> 0.
export const scheduleHealthPoints = (spiValue: number): number => {
  if (spiValue >= 1.0) return 30;
  if (spiValue >= 0.9) return 15;
  return 0;
};

/// CPI ≥ 1.0: under or on budget -> 30. 0.9-0.99: minor overrun -> 15.
/// Below 0.9: major overrun -> 0. Same shape as scheduleHealthPoints.
export const budgetHealthPoints = (cpiValue: number): number => {
  if (cpiValue >= 1.0) return 30;
  if (cpiValue >= 0.9) return 15;
  return 0;
};

/// Binary: signed off -> 20, not signed off -> 0.
export const signoffPoints = (signoff: boolean): number => (signoff ? 20 : 0);

/// Placeholder pending the real bench-time/resource-utilization metric
/// definition from the source doc: ≥90% billable utilization -> 20, else 10.
export const benchTimePoints = (resourceUtilization: number): number =>
  resourceUtilization >= 0.9 ? 20 : 10;

/// Progress scorecard = schedule + budget + signoff + bench-time points.
/// Max 30+30+20+20 = 100 by construction.
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
