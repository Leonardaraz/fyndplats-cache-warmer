import { beforeEach, describe, expect, it } from "vitest";
import { addSpend, getBudgetCapUsd, getTodaysSpend, isBudgetExceeded, todayKey } from "./budget";
import { __resetLlmMemoryStore } from "./storage";

beforeEach(() => {
  __resetLlmMemoryStore();
  delete process.env.ANTHROPIC_DAILY_BUDGET_USD;
});

describe("getBudgetCapUsd", () => {
  it("defaults to $2.00", () => {
    expect(getBudgetCapUsd()).toBe(2.0);
  });
  it("reads ANTHROPIC_DAILY_BUDGET_USD", () => {
    process.env.ANTHROPIC_DAILY_BUDGET_USD = "5.50";
    expect(getBudgetCapUsd()).toBe(5.5);
  });
  it("falls back to default on invalid value", () => {
    process.env.ANTHROPIC_DAILY_BUDGET_USD = "not-a-number";
    expect(getBudgetCapUsd()).toBe(2.0);
  });
});

describe("todayKey", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(todayKey(new Date("2026-05-31T23:59:59Z"))).toBe("2026-05-31");
    expect(todayKey(new Date("2026-06-01T00:00:01Z"))).toBe("2026-06-01");
  });
});

describe("addSpend + isBudgetExceeded", () => {
  it("accumulates spend across calls", async () => {
    await addSpend("claude", 0.5);
    await addSpend("claude", 0.3);
    const s = await getTodaysSpend();
    expect(s.totalUsd).toBeCloseTo(0.8, 4);
    expect(s.callsByProvider.claude).toBe(2);
  });

  it("isBudgetExceeded flips once cumulative spend ≥ cap", async () => {
    process.env.ANTHROPIC_DAILY_BUDGET_USD = "1.00";
    await addSpend("claude", 0.4);
    expect(await isBudgetExceeded()).toBe(false);
    await addSpend("claude", 0.7);
    expect(await isBudgetExceeded()).toBe(true);
  });

  it("treats cap=0 as fully disabled (always exceeded)", async () => {
    process.env.ANTHROPIC_DAILY_BUDGET_USD = "0";
    expect(await isBudgetExceeded()).toBe(true);
  });
});
