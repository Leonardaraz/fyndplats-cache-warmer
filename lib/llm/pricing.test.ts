import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "./pricing";

describe("estimateCostUsd", () => {
  it("Haiku 4.5 — 1M input + 200k output = $1 + $1 = $2", () => {
    const cost = estimateCostUsd("claude-haiku-4-5-20251001", {
      inputTokens: 1_000_000,
      outputTokens: 200_000,
    });
    expect(cost).toBeCloseTo(2.0, 4);
  });

  it("Sonnet 4.5 — same usage costs 3x more", () => {
    const cost = estimateCostUsd("claude-sonnet-4-5", {
      inputTokens: 1_000_000,
      outputTokens: 200_000,
    });
    // 1M * $3 + 200k * $15 = $3 + $3 = $6
    expect(cost).toBeCloseTo(6.0, 4);
  });

  it("Gemini models are priced at 0 (free tier)", () => {
    expect(estimateCostUsd("gemini-2.0-flash-lite", { inputTokens: 999_999, outputTokens: 999_999 })).toBe(0);
    expect(estimateCostUsd("gemini-2.0-flash", { inputTokens: 999_999, outputTokens: 999_999 })).toBe(0);
  });

  it("cached input tokens use the 10x cheaper cache-read price", () => {
    const cached = estimateCostUsd("claude-haiku-4-5-20251001", {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cachedInputTokens: 1_000_000,
    });
    // 1M cached @ $0.10/M = $0.10
    expect(cached).toBeCloseTo(0.1, 4);
  });

  it("unknown model falls back to Sonnet-equivalent pricing (worst-case)", () => {
    const cost = estimateCostUsd("unknown-model", { inputTokens: 1_000_000, outputTokens: 0 });
    expect(cost).toBeCloseTo(3.0, 4);
  });

  it("batch:true applies the 50% Message Batches discount", () => {
    const usage = { inputTokens: 1_000_000, outputTokens: 200_000 };
    const realtime = estimateCostUsd("claude-haiku-4-5-20251001", usage);
    const batch = estimateCostUsd("claude-haiku-4-5-20251001", usage, { batch: true });
    expect(realtime).toBeCloseTo(2.0, 4);
    expect(batch).toBeCloseTo(1.0, 4); // 50% off
    expect(batch).toBeCloseTo(realtime / 2, 6);
  });
});
