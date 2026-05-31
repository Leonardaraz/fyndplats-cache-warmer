// Delade typer för LLM-routern (lib/llm/router.ts).
//
// Provider-namnet (claude/gemini) loggas till /admin/llm-usage så Leonard kan se
// vilken som faktiskt hanterade ett anrop. Båda providers returnerar samma form
// så resten av import-koden inte bryr sig.

export type LlmProvider = "claude" | "gemini";

/** Hur många input/output-tokens ett anrop förbrukade — driver kostnadsberäkningen. */
export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  /**
   * Antal cached input-tokens (Anthropic prompt caching). Räknas billigare i
   * pricing.ts. Gemini har ingen direkt motsvarighet — alltid 0 där.
   */
  cachedInputTokens?: number;
}

export interface LlmCallStats {
  provider: LlmProvider;
  model: string;
  usage: LlmUsage;
  costUsd: number;
  /** Latens i ms — användbart för att se om Gemini håller jämn takt. */
  latencyMs: number;
}

/** Specifika fel-klasser så routern kan känna igen fallback-värdiga fel. */
export class CreditBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditBalanceError";
  }
}

export class BudgetCapExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetCapExceededError";
  }
}

/** 4xx från Anthropic som inte är 429 — typiskt invalid_request_error etc. */
export class ProviderClientError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ProviderClientError";
  }
}
