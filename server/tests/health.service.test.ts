import { describe, expect, it } from "vitest";
import {
  benchTimePoints,
  budgetHealthPoints,
  cpi,
  progressScorecard,
  scheduleHealthPoints,
  signoffPoints,
  spi,
} from "../src/services/health.service.js";

// TDD: written before health.service.ts exists.

describe("spi — Schedule Performance Index (EV ÷ PV)", () => {
  it("matches the EVM formula for the BDD worked example", () => {
    // PV=100,000 AC=90,000 EV=95,000 -> SPI = 0.95
    expect(spi(95_000, 100_000)).toBeCloseTo(0.95, 9);
  });

  it("returns 0 rather than Infinity/NaN when PV is 0", () => {
    expect(spi(50, 0)).toBe(0);
    expect(Number.isFinite(spi(50, 0))).toBe(true);
  });
});

describe("cpi — Cost Performance Index (EV ÷ AC)", () => {
  it("matches the EVM formula for the BDD worked example", () => {
    // PV=100,000 AC=90,000 EV=95,000 -> CPI ≈ 1.0556
    expect(cpi(95_000, 90_000)).toBeCloseTo(1.0556, 4);
  });

  it("returns 0 rather than Infinity/NaN when AC is 0", () => {
    expect(cpi(50, 0)).toBe(0);
    expect(Number.isFinite(cpi(50, 0))).toBe(true);
  });
});

describe("scheduleHealthPoints — SPI bands (30/15/0)", () => {
  it("awards 30 at and above the on-schedule boundary", () => {
    expect(scheduleHealthPoints(1.0)).toBe(30);
    expect(scheduleHealthPoints(1.2)).toBe(30);
  });

  it("awards 15 for a minor slip, both boundaries", () => {
    expect(scheduleHealthPoints(0.99)).toBe(15);
    expect(scheduleHealthPoints(0.9)).toBe(15);
  });

  it("awards 0 for a major slip just past the 0.9 boundary", () => {
    expect(scheduleHealthPoints(0.89)).toBe(0);
    expect(scheduleHealthPoints(0.5)).toBe(0);
  });
});

describe("budgetHealthPoints — CPI bands (30/15/0, same shape as SPI)", () => {
  it("awards 30 at and above the on-budget boundary", () => {
    expect(budgetHealthPoints(1.0)).toBe(30);
    expect(budgetHealthPoints(1.5)).toBe(30);
  });

  it("awards 15 for a minor overrun, both boundaries", () => {
    expect(budgetHealthPoints(0.99)).toBe(15);
    expect(budgetHealthPoints(0.9)).toBe(15);
  });

  it("awards 0 for a major overrun just past the 0.9 boundary", () => {
    expect(budgetHealthPoints(0.89)).toBe(0);
  });
});

describe("signoffPoints — binary 20/0", () => {
  it("awards 20 when signed off, 0 otherwise", () => {
    expect(signoffPoints(true)).toBe(20);
    expect(signoffPoints(false)).toBe(0);
  });
});

describe("benchTimePoints — placeholder 20/10 utilization bands", () => {
  it("awards 20 at and above the 90% utilization boundary", () => {
    expect(benchTimePoints(0.9)).toBe(20);
    expect(benchTimePoints(1.0)).toBe(20);
  });

  it("awards 10 below the boundary", () => {
    expect(benchTimePoints(0.89)).toBe(10);
    expect(benchTimePoints(0)).toBe(10);
  });
});

describe("progressScorecard — sums all four sub-scores, capped at 100", () => {
  it("matches a full worked example (SPI 0.95, CPI 1.0556, signed off, 92% utilization)", () => {
    // schedule: 15 (0.9 <= 0.95 < 1.0), budget: 30 (1.0556 >= 1.0),
    // signoff: 20, bench: 20 (0.92 >= 0.9) -> total 85
    const result = progressScorecard({
      spiValue: 0.95,
      cpiValue: 1.0556,
      signoff: true,
      resourceUtilization: 0.92,
    });
    expect(result).toBe(85);
  });

  it("never exceeds 100 when every sub-score is maxed", () => {
    const result = progressScorecard({
      spiValue: 1.2,
      cpiValue: 1.2,
      signoff: true,
      resourceUtilization: 1.0,
    });
    expect(result).toBe(100);
  });

  it("returns the minimum possible total when every sub-score is at its floor", () => {
    // schedule 0 + budget 0 + signoff 0 + bench 10 (bench has no 0 tier) = 10
    const result = progressScorecard({
      spiValue: 0.5,
      cpiValue: 0.5,
      signoff: false,
      resourceUtilization: 0,
    });
    expect(result).toBe(10);
  });
});
