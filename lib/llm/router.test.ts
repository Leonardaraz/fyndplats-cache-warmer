import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runOperation } from "./router";
import { __clearMemCache } from "./cache";
import { __resetLlmMemoryStore } from "./storage";
import { CreditBalanceError, ProviderClientError } from "./types";

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  delete process.env.GEMINI_API_KEY;
  delete process.env.LLM_PROVIDER_DEFAULT;
  delete process.env.ANTHROPIC_DAILY_BUDGET_USD;
  __resetLlmMemoryStore();
  __clearMemCache();
});

afterEach(() => {
  vi.clearAllMocks();
});

const okResult = (label: string) => ({
  result: { label },
  usage: { inputTokens: 100, outputTokens: 20 },
  model: "claude-haiku-4-5-20251001",
});

describe("runOperation — cache layer", () => {
  it("returns cache on second call with same key, no provider re-invocation", async () => {
    const claudeCall = vi.fn().mockResolvedValue(okResult("claude"));
    const opts = {
      op: "test-op",
      cacheKey: "key-1",
      claudeCall,
    };

    const r1 = await runOperation<{ label: string }>(opts);
    const r2 = await runOperation<{ label: string }>(opts);

    expect(r1.provider).toBe("claude");
    expect(r2.provider).toBe("cache");
    expect(r2.cacheHit).toBe(true);
    expect(r2.result).toEqual({ label: "claude" });
    expect(claudeCall).toHaveBeenCalledTimes(1);
  });
});

describe("runOperation — credit balance fallback", () => {
  it("falls back to Gemini when Claude throws CreditBalanceError", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    const claudeCall = vi.fn().mockRejectedValue(new CreditBalanceError("balance too low"));
    const geminiCall = vi.fn().mockResolvedValue({
      result: { label: "gemini" },
      usage: { inputTokens: 50, outputTokens: 10 },
      model: "gemini-2.0-flash-lite",
    });

    const r = await runOperation<{ label: string }>({
      op: "fallback-test",
      cacheKey: "k",
      claudeCall,
      geminiCall,
    });

    expect(r.provider).toBe("gemini");
    expect(r.result).toEqual({ label: "gemini" });
    expect(claudeCall).toHaveBeenCalledTimes(1);
    expect(geminiCall).toHaveBeenCalledTimes(1);
  });

  it("falls back to Gemini on 4xx ProviderClientError", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    const claudeCall = vi.fn().mockRejectedValue(new ProviderClientError("invalid", 400));
    const geminiCall = vi.fn().mockResolvedValue({
      result: { label: "gemini-rescue" },
      usage: { inputTokens: 50, outputTokens: 10 },
      model: "gemini-2.0-flash-lite",
    });

    const r = await runOperation<{ label: string }>({
      op: "fallback-test-4xx",
      cacheKey: "k4xx",
      claudeCall,
      geminiCall,
    });
    expect(r.provider).toBe("gemini");
    expect(r.result.label).toBe("gemini-rescue");
  });

  it("returns failOpen when both Claude and Gemini fail", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    const claudeCall = vi.fn().mockRejectedValue(new CreditBalanceError("x"));
    const geminiCall = vi.fn().mockRejectedValue(new Error("Gemini quota exceeded"));

    const r = await runOperation<{ label: string }>({
      op: "both-fail",
      cacheKey: "k-both",
      claudeCall,
      geminiCall,
      failOpen: { label: "fallback" },
    });
    expect(r.provider).toBe("fail-open");
    expect(r.result).toEqual({ label: "fallback" });
  });
});

describe("runOperation — budget cap", () => {
  it("skips Claude when daily cap is 0 (effectively disabled), uses Gemini", async () => {
    process.env.ANTHROPIC_DAILY_BUDGET_USD = "0";
    process.env.GEMINI_API_KEY = "gem-test";

    const claudeCall = vi.fn().mockResolvedValue(okResult("should-not-be-called"));
    const geminiCall = vi.fn().mockResolvedValue({
      result: { label: "gemini" },
      usage: { inputTokens: 50, outputTokens: 10 },
      model: "gemini-2.0-flash-lite",
    });

    const r = await runOperation<{ label: string }>({
      op: "budget-test",
      cacheKey: "k-budget",
      claudeCall,
      geminiCall,
    });

    expect(claudeCall).not.toHaveBeenCalled();
    expect(geminiCall).toHaveBeenCalledTimes(1);
    expect(r.provider).toBe("gemini");
  });
});

describe("runOperation — provider mode override", () => {
  it("LLM_PROVIDER_DEFAULT=gemini forces Gemini (Claude never tried)", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    process.env.LLM_PROVIDER_DEFAULT = "gemini";

    const claudeCall = vi.fn();
    const geminiCall = vi.fn().mockResolvedValue({
      result: { label: "g" },
      usage: { inputTokens: 0, outputTokens: 0 },
      model: "gemini-2.0-flash-lite",
    });

    const r = await runOperation<{ label: string }>({
      op: "force-gemini",
      cacheKey: "k-force",
      claudeCall,
      geminiCall,
    });
    expect(claudeCall).not.toHaveBeenCalled();
    expect(r.provider).toBe("gemini");
  });

  it("LLM_PROVIDER_DEFAULT=claude won't fall back to Gemini even if Claude fails", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    process.env.LLM_PROVIDER_DEFAULT = "claude";

    const claudeCall = vi.fn().mockRejectedValue(new CreditBalanceError("balance low"));
    const geminiCall = vi.fn();

    const r = await runOperation<{ label: string }>({
      op: "claude-only",
      cacheKey: "k-claude",
      claudeCall,
      geminiCall,
      failOpen: { label: "fb" },
    });
    expect(geminiCall).not.toHaveBeenCalled();
    expect(r.provider).toBe("fail-open");
  });
});
