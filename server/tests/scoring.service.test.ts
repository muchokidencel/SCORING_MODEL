import { describe, expect, it } from "vitest";
import { departmentalScore, normalizeScore, scoreMetric } from "../src/services/scoring.service.js";

// TDD: written before scoring.service.ts exists. Formula correctness is the
// highest-risk item in the system (per the implementation plan's
// cross-cutting note), so every band boundary is tested on both sides.

describe("scoreMetric — AT_LEAST direction (higher is better, benchmark is a floor)", () => {
  const benchmark = 100;

  it("scores 5 when measurement meets or exceeds the benchmark", () => {
    expect(scoreMetric(100, benchmark, "AT_LEAST")).toBe(5);
    expect(scoreMetric(150, benchmark, "AT_LEAST")).toBe(5);
  });

  it("scores 4 within the 0%-5% shortfall band, both boundaries", () => {
    expect(scoreMetric(99.99, benchmark, "AT_LEAST")).toBe(4);
    expect(scoreMetric(95, benchmark, "AT_LEAST")).toBe(4); // exactly 5% short — inclusive
  });

  it("scores 3 just past the 5% boundary through the 10% boundary", () => {
    expect(scoreMetric(94.99, benchmark, "AT_LEAST")).toBe(3);
    expect(scoreMetric(90, benchmark, "AT_LEAST")).toBe(3); // exactly 10% short — inclusive
  });

  it("scores 2 just past the 10% boundary through the 15% boundary", () => {
    expect(scoreMetric(89.99, benchmark, "AT_LEAST")).toBe(2);
    expect(scoreMetric(85, benchmark, "AT_LEAST")).toBe(2); // exactly 15% short — inclusive
  });

  it("scores 1 beyond the 15% shortfall", () => {
    expect(scoreMetric(84.99, benchmark, "AT_LEAST")).toBe(1);
    expect(scoreMetric(50, benchmark, "AT_LEAST")).toBe(1);
  });
});

describe("scoreMetric — AT_MOST direction (lower is better, benchmark is a ceiling)", () => {
  const benchmark = 100;

  it("scores 5 when measurement meets or is under the benchmark", () => {
    expect(scoreMetric(100, benchmark, "AT_MOST")).toBe(5);
    expect(scoreMetric(50, benchmark, "AT_MOST")).toBe(5);
  });

  it("scores 4 within the 0%-5% overage band, both boundaries", () => {
    expect(scoreMetric(100.01, benchmark, "AT_MOST")).toBe(4);
    expect(scoreMetric(105, benchmark, "AT_MOST")).toBe(4); // exactly 5% over — inclusive
  });

  it("scores 3 just past the 5% boundary through the 10% boundary", () => {
    expect(scoreMetric(105.01, benchmark, "AT_MOST")).toBe(3);
    expect(scoreMetric(110, benchmark, "AT_MOST")).toBe(3); // exactly 10% over — inclusive
  });

  it("scores 2 just past the 10% boundary through the 15% boundary", () => {
    expect(scoreMetric(110.01, benchmark, "AT_MOST")).toBe(2);
    expect(scoreMetric(115, benchmark, "AT_MOST")).toBe(2); // exactly 15% over — inclusive
  });

  it("scores 1 beyond the 15% overage", () => {
    expect(scoreMetric(115.01, benchmark, "AT_MOST")).toBe(1);
    expect(scoreMetric(200, benchmark, "AT_MOST")).toBe(1);
  });
});

describe("scoreMetric — benchmark of zero (division-by-zero guard)", () => {
  it("scores 5 when measurement also hits zero exactly", () => {
    expect(scoreMetric(0, 0, "AT_MOST")).toBe(5);
    expect(scoreMetric(0, 0, "AT_LEAST")).toBe(5);
  });

  it("never returns NaN or throws for a non-zero measurement against a zero benchmark", () => {
    expect(scoreMetric(5, 0, "AT_MOST")).toBe(1);
    expect(Number.isFinite(scoreMetric(5, 0, "AT_MOST"))).toBe(true);
  });
});

describe("normalizeScore — 1-5 band to 0-100 scale", () => {
  it("maps every band to its percentage equivalent", () => {
    expect(normalizeScore(5)).toBe(100);
    expect(normalizeScore(4)).toBe(80);
    expect(normalizeScore(3)).toBe(60);
    expect(normalizeScore(2)).toBe(40);
    expect(normalizeScore(1)).toBe(20);
  });
});

describe("departmentalScore — Σ(normalized score × weight)", () => {
  it("returns 100 when every metric scores 5 and weights sum to 1", () => {
    const allFives = [0.15, 0.15, 0.15, 0.1, 0.2, 0.15, 0.1].map((weight) => ({
      score: 5,
      weight,
    }));
    expect(departmentalScore(allFives)).toBeCloseTo(100, 9);
  });

  it("returns 20 when every metric scores 1 and weights sum to 1", () => {
    const allOnes = [0.15, 0.15, 0.15, 0.1, 0.2, 0.15, 0.1].map((weight) => ({
      score: 1,
      weight,
    }));
    expect(departmentalScore(allOnes)).toBeCloseTo(20, 9);
  });

  it("matches a hand-worked mixed example using the real 7 metric weights", () => {
    // scores: 5,4,3,5,2,4,5 against weights 0.15,0.15,0.15,0.10,0.20,0.15,0.10
    // normalized: 100,80,60,100,40,80,100
    // weighted:   15 + 12 + 9 + 10 + 8 + 12 + 10 = 76
    const mixed = [
      { score: 5, weight: 0.15 },
      { score: 4, weight: 0.15 },
      { score: 3, weight: 0.15 },
      { score: 5, weight: 0.1 },
      { score: 2, weight: 0.2 },
      { score: 4, weight: 0.15 },
      { score: 5, weight: 0.1 },
    ];
    expect(departmentalScore(mixed)).toBeCloseTo(76, 9);
  });

  it("returns 0 for an empty list rather than NaN", () => {
    expect(departmentalScore([])).toBe(0);
  });
});
