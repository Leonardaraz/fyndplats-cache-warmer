// Daglig statistik-aggregator för /admin/llm-usage.
//
// Per call sparas en stats-rad i FyndplatsLlmStats:
//   { day, provider, op, success, cacheHit, costUsd, latencyMs, at }
//
// Admin-sidan summerar dagsvis (sista 30 dagarna).

import { LLM_COLLECTIONS, llmQuery, llmSave } from "./storage";
import { todayKey } from "./budget";
import type { LlmProvider } from "./types";
import crypto from "node:crypto";

export interface CallStatRecord {
  /** Unikt rad-id (= dokumentid). */
  id: string;
  day: string;
  provider: LlmProvider | "cache";
  op: string;
  success: boolean;
  cacheHit: boolean;
  costUsd: number;
  latencyMs: number;
  at: string;
  /** Frivillig kort detalj — t.ex. "credit_balance_too_low" vid fel. */
  detail?: string;
}

export async function recordCall(input: Omit<CallStatRecord, "id" | "day" | "at"> & { at?: Date }): Promise<void> {
  const at = input.at ?? new Date();
  const id = `${at.toISOString()}-${crypto.randomBytes(4).toString("hex")}`;
  const record: CallStatRecord = {
    id,
    day: todayKey(at),
    provider: input.provider,
    op: input.op,
    success: input.success,
    cacheHit: input.cacheHit,
    costUsd: input.costUsd,
    latencyMs: input.latencyMs,
    at: at.toISOString(),
    detail: input.detail,
  };
  await llmSave(LLM_COLLECTIONS.stats, id, record as unknown as Record<string, unknown>);
}

export interface DailyStats {
  day: string;
  totals: { calls: number; cacheHits: number; failures: number; costUsd: number };
  byProvider: Partial<Record<LlmProvider | "cache", { calls: number; failures: number; costUsd: number; avgLatencyMs: number }>>;
}

export async function getDailyStats(days = 30): Promise<DailyStats[]> {
  const all = await llmQuery<CallStatRecord>(LLM_COLLECTIONS.stats, undefined, [{ fieldName: "at", order: "DESC" }], 5000);
  const byDay = new Map<string, CallStatRecord[]>();
  for (const r of all) {
    if (!r.day) continue;
    const arr = byDay.get(r.day) ?? [];
    arr.push(r);
    byDay.set(r.day, arr);
  }
  const sortedDays = [...byDay.keys()].sort().reverse().slice(0, days);
  return sortedDays.map((day) => summarize(day, byDay.get(day) ?? []));
}

function summarize(day: string, rows: CallStatRecord[]): DailyStats {
  let calls = 0;
  let cacheHits = 0;
  let failures = 0;
  let costUsd = 0;
  const byProvider: DailyStats["byProvider"] = {};
  for (const r of rows) {
    calls++;
    costUsd += r.costUsd;
    if (r.cacheHit) cacheHits++;
    if (!r.success) failures++;
    const p = r.provider;
    const cur = byProvider[p] ?? { calls: 0, failures: 0, costUsd: 0, avgLatencyMs: 0 };
    const newCalls = cur.calls + 1;
    byProvider[p] = {
      calls: newCalls,
      failures: cur.failures + (r.success ? 0 : 1),
      costUsd: round6(cur.costUsd + r.costUsd),
      avgLatencyMs: Math.round((cur.avgLatencyMs * cur.calls + r.latencyMs) / newCalls),
    };
  }
  return {
    day,
    totals: {
      calls,
      cacheHits,
      failures,
      costUsd: round6(costUsd),
    },
    byProvider,
  };
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
