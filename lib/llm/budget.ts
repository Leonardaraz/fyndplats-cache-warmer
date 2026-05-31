// Daglig budgetcap för Anthropic-trafik.
//
// Spårar spend per UTC-dag och bryter Claude-anrop när dagens cap nåtts.
// Routern (lib/llm/router.ts) faller då tillbaka till Gemini om tillgängligt.
//
// OBS: Gemini-anrop räknas inte mot capen — pricing.ts sätter 0 för Gemini-
// modeller, så addSpend() blir no-op för dem.

import { LLM_COLLECTIONS, llmGet, llmSave } from "./storage";
import type { LlmProvider } from "./types";

const DEFAULT_CAP_USD = 2.0;

interface SpendRecord {
  /** YYYY-MM-DD i UTC. Också dokument-id. */
  day: string;
  /** Totalt spend för dagen i USD. */
  totalUsd: number;
  /** Antal anrop per provider — bra för /admin/llm-usage. */
  callsByProvider: Record<LlmProvider, number>;
  updatedAt: string;
}

export function getBudgetCapUsd(): number {
  const raw = process.env.ANTHROPIC_DAILY_BUDGET_USD;
  if (!raw) return DEFAULT_CAP_USD;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return DEFAULT_CAP_USD;
  return n;
}

/** YYYY-MM-DD i UTC — stabil oavsett server-tidzon. */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function getTodaysSpend(now: Date = new Date()): Promise<SpendRecord> {
  const day = todayKey(now);
  const existing = await llmGet<SpendRecord>(LLM_COLLECTIONS.spend, day);
  if (existing) return existing;
  return {
    day,
    totalUsd: 0,
    callsByProvider: { claude: 0, gemini: 0 },
    updatedAt: new Date().toISOString(),
  };
}

export async function addSpend(provider: LlmProvider, costUsd: number, now: Date = new Date()): Promise<void> {
  const day = todayKey(now);
  const existing = await getTodaysSpend(now);
  const updated: SpendRecord = {
    ...existing,
    day,
    totalUsd: round6(existing.totalUsd + Math.max(0, costUsd)),
    callsByProvider: {
      ...existing.callsByProvider,
      [provider]: (existing.callsByProvider[provider] ?? 0) + 1,
    },
    updatedAt: new Date().toISOString(),
  };
  await llmSave(LLM_COLLECTIONS.spend, day, updated as unknown as Record<string, unknown>);
}

export async function isBudgetExceeded(now: Date = new Date()): Promise<boolean> {
  const cap = getBudgetCapUsd();
  if (cap <= 0) return true; // cap=0 = stäng av Claude helt
  const spend = await getTodaysSpend(now);
  return spend.totalUsd >= cap;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
