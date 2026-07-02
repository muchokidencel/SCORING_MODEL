import { describe, expect, it } from "vitest";
import {
  bandForScore,
  compositeScore,
  normalizeLevel,
  qualitativeScore,
} from "../src/services/composite.service.js";

// TDD: written before composite.service.ts exists.

describe("normalizeLevel — 1/3/5 maturity level to 0-100 scale", () => {
  it("maps each valid level to its percentage equivalent", () => {
    expect(normalizeLevel(1)).toBe(20);
    expect(normalizeLevel(3)).toBe(60);
    expect(normalizeLevel(5)).toBe(100);
  });
});

describe("qualitativeScore — equal-weight average of the 3 dimensions", () => {
  it("returns 100 when every dimension is rated at the top level", () => {
    expect(qualitativeScore([5, 5, 5])).toBe(100);
  });

  it("returns 20 when every dimension is rated at the bottom level", () => {
    expect(qualitativeScore([1, 1, 1])).toBe(20);
  });

  it("averages a mixed set of ratings", () => {
    // normalized: 100, 60, 20 -> average 60
    expect(qualitativeScore([5, 3, 1])).toBeCloseTo(60, 9);
  });
});

describe("compositeScore — 60% quantitative + 40% qualitative", () => {
  it("matches the hand-worked example from the BDD spec (80/60 -> 72)", () => {
    expect(compositeScore(80, 60)).toBeCloseTo(72, 9);
  });

  it("returns 100 when both halves are perfect", () => {
    expect(compositeScore(100, 100)).toBeCloseTo(100, 9);
  });

  it("returns 0 when both halves are zero", () => {
    expect(compositeScore(0, 0)).toBe(0);
  });
});

describe("bandForScore — boundaries tested on both sides", () => {
  it("resolves the High risk / Average boundary at 50", () => {
    expect(bandForScore(49.99)).toBe("High risk");
    expect(bandForScore(50)).toBe("Average");
  });

  it("resolves the Average / Strong boundary at 70", () => {
    expect(bandForScore(69.99)).toBe("Average");
    expect(bandForScore(70)).toBe("Strong");
  });

  it("resolves the Strong / Excellent boundary at 85", () => {
    expect(bandForScore(84.99)).toBe("Strong");
    expect(bandForScore(85)).toBe("Excellent");
  });

  it("handles the extremes", () => {
    expect(bandForScore(0)).toBe("High risk");
    expect(bandForScore(100)).toBe("Excellent");
  });
});
