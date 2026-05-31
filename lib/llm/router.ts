// LLM-router: orchestrerar cache-lookup → budgetcheck → Claude → Gemini-fallback.
//
// Flöde per operation:
//   1. Slå upp i persistent cache. Träff = inget provider-anrop alls.
//   2. Hämta provider-mode (auto / claude / gemini). Override från Wix går före env.
//   3. Om mode=auto eller claude OCH ingen budget cap → försök Claude.
//      Vid fel som är "credit balance"/4xx/budget → loggas, fortsätt.
//   4. Om mode=auto eller gemini OCH Gemini-nyckel finns → försök Gemini.
//   5. Båda failade → returnera failOpen-värdet.
//
// Resultatet cachas (oavsett provider) så nästa identiska anrop blir gratis.

import { addSpend, isBudgetExceeded } from "./budget";
import { estimateCostUsd } from "./pricing";
import { getProviderMode, isClaudeAvailable, isGeminiAvailable } from "./provider";
import { recordCall } from "./stats";
import { getCachedResult, setCachedResult } from "./cache";
import {
  BudgetCapExceededError,
  CreditBalanceError,
  ProviderClientError,
  type LlmProvider,
  type LlmUsage,
} from "./types";

export interface ProviderCallResult<T> {
  result: T;
  usage: LlmUsage;
  model: string;
}

export interface RunOptions<T> {
  /** Operation-namn för stats + cache-nyckel (t.ex. "suggestCategory"). */
  op: string;
  /** Stabil cache-key. null = hoppa över cache (operationen är inte cachebar). */
  cacheKey: string | null;
  /** TTL för cache-träff (ms). Default i cache.ts om utelämnad. */
  ttlMs?: number;
  /** Anrop mot Claude. Får inte anropas om budget cap nåtts. */
  claudeCall?: () => Promise<ProviderCallResult<T>>;
  /** Anrop mot Gemini (gratis fallback). */
  geminiCall?: () => Promise<ProviderCallResult<T>>;
  /** Värde som returneras om båda providers failar. Saknas = kasta. */
  failOpen?: T;
}

export interface RunResult<T> {
  result: T;
  provider: LlmProvider | "cache" | "fail-open";
  cacheHit: boolean;
}

export async function runOperation<T>(opts: RunOptions<T>): Promise<RunResult<T>> {
  // --- 1. Cache --------------------------------------------------------
  if (opts.cacheKey) {
    const cached = await getCachedResult<T>(opts.cacheKey);
    if (cached) {
      await recordCall({
        provider: "cache",
        op: opts.op,
        success: true,
        cacheHit: true,
        costUsd: 0,
        latencyMs: 0,
      });
      return { result: cached.value, provider: "cache", cacheHit: true };
    }
  }

  // --- 2. Provider-val -------------------------------------------------
  const mode = await getProviderMode();
  const claudeOk = isClaudeAvailable() && opts.claudeCall && mode !== "gemini";
  const geminiOk = isGeminiAvailable() && opts.geminiCall && mode !== "claude";

  // --- 3. Claude (om tillåtet och inom budget) -------------------------
  if (claudeOk) {
    const overBudget = await isBudgetExceeded().catch(() => false);
    if (overBudget) {
      await recordCall({
        provider: "claude",
        op: opts.op,
        success: false,
        cacheHit: false,
        costUsd: 0,
        latencyMs: 0,
        detail: "budget_cap_exceeded",
      });
      // Fall igenom till Gemini.
    } else {
      const tried = await tryClaude(opts);
      if (tried.ok) return await persistAndReturn(opts, tried.value);
      // Tried.error loggades redan i tryClaude. Fortsätt till Gemini.
    }
  }

  // --- 4. Gemini-fallback ---------------------------------------------
  if (geminiOk) {
    const tried = await tryGemini(opts);
    if (tried.ok) return await persistAndReturn(opts, tried.value);
  }

  // --- 5. Båda failade — failOpen eller kasta --------------------------
  if (opts.failOpen !== undefined) {
    return { result: opts.failOpen, provider: "fail-open", cacheHit: false };
  }
  throw new Error(`[llm-router] ${opts.op}: alla providers failade och inget failOpen-värde.`);
}

interface ProviderAttempt<T> {
  ok: true;
  value: { result: T; provider: LlmProvider; model: string };
}
interface ProviderFailure {
  ok: false;
  error: Error;
}

async function tryClaude<T>(opts: RunOptions<T>): Promise<ProviderAttempt<T> | ProviderFailure> {
  if (!opts.claudeCall) return { ok: false, error: new Error("no claudeCall") };
  const start = Date.now();
  try {
    const { result, usage, model } = await opts.claudeCall();
    const cost = estimateCostUsd(model, usage);
    await addSpend("claude", cost);
    await recordCall({
      provider: "claude",
      op: opts.op,
      success: true,
      cacheHit: false,
      costUsd: cost,
      latencyMs: Date.now() - start,
    });
    return { ok: true, value: { result, provider: "claude", model } };
  } catch (err) {
    const detail = errorDetail(err);
    await recordCall({
      provider: "claude",
      op: opts.op,
      success: false,
      cacheHit: false,
      costUsd: 0,
      latencyMs: Date.now() - start,
      detail,
    });
    // Endast specifika fel-typer rättfärdigar fallback. Andra fel (t.ex.
    // nätverk timeout) loggas men returneras inte som "ok=false" — det är
    // fortfarande en failure, men routern försöker Gemini ändå för att
    // skydda import-flödet.
    if (
      err instanceof CreditBalanceError ||
      err instanceof BudgetCapExceededError ||
      err instanceof ProviderClientError ||
      err instanceof Error
    ) {
      console.warn(`[llm-router] Claude ${opts.op} failed: ${detail}`);
      return { ok: false, error: err as Error };
    }
    throw err;
  }
}

async function tryGemini<T>(opts: RunOptions<T>): Promise<ProviderAttempt<T> | ProviderFailure> {
  if (!opts.geminiCall) return { ok: false, error: new Error("no geminiCall") };
  const start = Date.now();
  try {
    const { result, usage, model } = await opts.geminiCall();
    const cost = estimateCostUsd(model, usage);
    // Gemini-pris är 0 i pricing.ts — addSpend blir effektivt no-op men vi
    // ökar callsByProvider.gemini-räknaren.
    await addSpend("gemini", cost);
    await recordCall({
      provider: "gemini",
      op: opts.op,
      success: true,
      cacheHit: false,
      costUsd: cost,
      latencyMs: Date.now() - start,
    });
    return { ok: true, value: { result, provider: "gemini", model } };
  } catch (err) {
    const detail = errorDetail(err);
    await recordCall({
      provider: "gemini",
      op: opts.op,
      success: false,
      cacheHit: false,
      costUsd: 0,
      latencyMs: Date.now() - start,
      detail,
    });
    console.warn(`[llm-router] Gemini ${opts.op} failed: ${detail}`);
    return { ok: false, error: err as Error };
  }
}

async function persistAndReturn<T>(
  opts: RunOptions<T>,
  value: { result: T; provider: LlmProvider; model: string },
): Promise<RunResult<T>> {
  if (opts.cacheKey) {
    try {
      await setCachedResult(opts.cacheKey, opts.op, value.result, value.provider, opts.ttlMs);
    } catch (err) {
      console.warn(`[llm-router] cache write failed for ${opts.op}: ${errorDetail(err)}`);
    }
  }
  return { result: value.result, provider: value.provider, cacheHit: false };
}

function errorDetail(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 200);
  return String(err).slice(0, 200);
}
