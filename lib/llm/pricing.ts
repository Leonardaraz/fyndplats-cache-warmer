// Prissättning per modell — USD per miljon tokens.
//
// Hämtat 2026-05 från https://www.anthropic.com/pricing (Claude) och
// https://ai.google.dev/pricing (Gemini). Cached input för Claude är 1/10 av
// vanlig input ($0.10/M för Haiku, $0.30/M för Sonnet) tack vare prompt caching.
//
// Justera priserna om Anthropic/Google ändrar — alla beräkningar går via
// estimateCostUsd(), så ändringen propagerar automatiskt till budgetcap +
// /admin/llm-usage.

import type { LlmUsage } from "./types";

interface ModelPrice {
  /** USD per miljon input-tokens. */
  inputPerMillion: number;
  /** USD per miljon output-tokens. */
  outputPerMillion: number;
  /** USD per miljon cached input-tokens (Anthropic prompt caching). */
  cachedInputPerMillion?: number;
}

const PRICES: Record<string, ModelPrice> = {
  // Claude — Haiku 4.5 är 3× billigare än Sonnet och plenty smart för
  // kategorisering + översättning. Sonnet behålls för bildanalys.
  "claude-haiku-4-5-20251001": {
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
    cachedInputPerMillion: 0.1,
  },
  "claude-sonnet-4-5": {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cachedInputPerMillion: 0.3,
  },
  "claude-sonnet-4-6": {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cachedInputPerMillion: 0.3,
  },

  // Gemini 2.0 — gratis-tier för input <128k. Vi sätter priserna till 0 så
  // budgetcap aldrig triggas av Gemini-trafik. Om Leonard senare flyttar till
  // paid tier behöver bara dessa rader uppdateras.
  "gemini-2.0-flash-lite": { inputPerMillion: 0, outputPerMillion: 0 },
  "gemini-2.0-flash": { inputPerMillion: 0, outputPerMillion: 0 },
};

/** Fallback för okänd modell — använder Sonnet-pris som worst-case skydd. */
const DEFAULT_PRICE: ModelPrice = {
  inputPerMillion: 3.0,
  outputPerMillion: 15.0,
  cachedInputPerMillion: 0.3,
};

/** Anthropic Message Batches-rabatt: 50 % på all token-trafik. */
export const BATCH_DISCOUNT = 0.5;

export interface CostOptions {
  /**
   * Anropet gick via Anthropic Message Batches API → 50 % rabatt på hela
   * token-kostnaden (input, cached input och output). Default false (realtid).
   */
  batch?: boolean;
}

export function estimateCostUsd(model: string, usage: LlmUsage, opts?: CostOptions): number {
  const price = PRICES[model] ?? DEFAULT_PRICE;
  const cached = usage.cachedInputTokens ?? 0;
  const uncachedInput = Math.max(0, usage.inputTokens - cached);
  const inputCost = (uncachedInput / 1_000_000) * price.inputPerMillion;
  const cachedCost = (cached / 1_000_000) * (price.cachedInputPerMillion ?? price.inputPerMillion);
  const outputCost = (usage.outputTokens / 1_000_000) * price.outputPerMillion;
  const total = inputCost + cachedCost + outputCost;
  // Batch API ger 50 % rabatt på alla rater (gäller även cachade tokens).
  return roundUsd(opts?.batch ? total * BATCH_DISCOUNT : total);
}

function roundUsd(n: number): number {
  // 6 decimaler — räcker för token-skala kostnader (en bråkdel av en cent).
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function getModelPrice(model: string): ModelPrice {
  return PRICES[model] ?? DEFAULT_PRICE;
}
