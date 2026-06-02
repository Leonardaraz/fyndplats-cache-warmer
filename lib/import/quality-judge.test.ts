import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { normalizeVerdict, qualityThreshold } from "./quality-judge";

describe("quality-judge — normalizeVerdict", () => {
  it("godkänner vid score ≥ tröskel", () => {
    const v = normalizeVerdict({ score: 9.6, feedback: "bra" }, 9.5);
    expect(v.passed).toBe(true);
    expect(v.score).toBe(9.6);
  });

  it("underkänner vid score < tröskel", () => {
    const v = normalizeVerdict({ score: 8.0, feedback: "svaga hooks" }, 9.5);
    expect(v.passed).toBe(false);
    expect(v.feedback).toContain("svaga");
  });

  it("klampar score till 0–10 och hanterar skräp", () => {
    expect(normalizeVerdict({ score: 99 }, 9.5).score).toBe(10);
    expect(normalizeVerdict({ score: -5 }, 9.5).score).toBe(0);
    expect(normalizeVerdict({ score: NaN }, 9.5).score).toBe(0);
    expect(normalizeVerdict({}, 9.5).score).toBe(0);
  });

  it("bevarar breakdown om objekt", () => {
    const v = normalizeVerdict({ score: 9.5, breakdown: { hook: 9 } }, 9.5);
    expect(v.breakdown).toEqual({ hook: 9 });
  });
});

describe("quality-judge — qualityThreshold", () => {
  const prev = process.env.PREMIUM_QUALITY_THRESHOLD;
  beforeEach(() => delete process.env.PREMIUM_QUALITY_THRESHOLD);
  afterEach(() => {
    if (prev === undefined) delete process.env.PREMIUM_QUALITY_THRESHOLD;
    else process.env.PREMIUM_QUALITY_THRESHOLD = prev;
  });

  it("defaultar till 9.5", () => {
    expect(qualityThreshold()).toBe(9.5);
  });
  it("läser giltig env-override", () => {
    process.env.PREMIUM_QUALITY_THRESHOLD = "9";
    expect(qualityThreshold()).toBe(9);
  });
  it("ignorerar ogiltig env-override", () => {
    process.env.PREMIUM_QUALITY_THRESHOLD = "20";
    expect(qualityThreshold()).toBe(9.5);
    process.env.PREMIUM_QUALITY_THRESHOLD = "abc";
    expect(qualityThreshold()).toBe(9.5);
  });
});
