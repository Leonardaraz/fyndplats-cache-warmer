// Anthropic Message Batches API (#8) — 50 % rabatt på all token-trafik mot att
// svaret levereras inom upp till 24 h (i praktiken oftast 5–15 min).
//
// Används ENDAST för BAKGRUNDS-importer (bulk-CSV / sync-re-runs) där latensen är
// ok — realtidsimporter (extension-knappen) använder fortsatt det direkta anropet
// för omedelbar respons. Gatas av USE_BATCH_API (default av).
//
// Prompten är IDENTISK med det direkta sammanslagna anropet: vi återanvänder
// buildBatchRequest + normalizeProductContent + isComplete från lib/import/generate.ts
// så att kvaliteten blir densamma oavsett transport.

import type Anthropic from "@anthropic-ai/sdk";
import { getClaude } from "./client";
import {
  buildBatchRequest,
  isComplete,
  normalizeProductContent,
  type ProductContent,
  type RawBatch,
} from "../import/generate";
import type { AliExpressProduct } from "../import/types";
import type { CollectionOption } from "./types";

export interface BatchInputItem {
  /** Stabil nyckel som matchar svaret tillbaka till källraden (t.ex. bulk-item-id). */
  customId: string;
  product: AliExpressProduct;
  collections: CollectionOption[];
}

export type BatchProcessingStatus = "in_progress" | "canceling" | "ended";

export interface BatchStatus {
  id: string;
  processingStatus: BatchProcessingStatus;
  counts: { processing: number; succeeded: number; errored: number; canceled: number; expired: number };
  ended: boolean;
}

/** Skickar in N produkt-genereringar som EN batch. Returnerar message_batch_id. */
export async function submitProductContentBatch(items: BatchInputItem[]): Promise<string> {
  if (items.length === 0) throw new Error("submitProductContentBatch: inga items.");
  const claude = getClaude();
  const requests = items.map((it) => {
    const req = buildBatchRequest(it.product, it.collections);
    return {
      custom_id: it.customId,
      params: {
        model: req.model,
        max_tokens: req.maxTokens,
        // Prompt caching gäller även i batch — den statiska system-prompten cachas.
        system: [{ type: "text" as const, text: req.system, cache_control: { type: "ephemeral" as const } }],
        messages: [{ role: "user" as const, content: req.user }],
      },
    };
  });
  const batch = await claude.messages.batches.create({ requests });
  return batch.id;
}

/** Pollar batch-status. ended=true när hela batchen är klar (oavsett per-rad-utfall). */
export async function getBatchStatus(batchId: string): Promise<BatchStatus> {
  const claude = getClaude();
  const b = await claude.messages.batches.retrieve(batchId);
  return {
    id: b.id,
    processingStatus: b.processing_status,
    counts: {
      processing: b.request_counts.processing,
      succeeded: b.request_counts.succeeded,
      errored: b.request_counts.errored,
      canceled: b.request_counts.canceled,
      expired: b.request_counts.expired,
    },
    ended: b.processing_status === "ended",
  };
}

/**
 * Hämtar resultaten för en färdig batch och normaliserar varje lyckat svar till
 * ProductContent. `context` mappar custom_id → produkt+kollektioner (krävs för
 * normaliseringen). Rader som failade/var ofullständiga utelämnas ur resultatet
 * (anroparen får falla tillbaka på direkt generering för dem).
 */
export async function fetchBatchResults(
  batchId: string,
  context: Map<string, { product: AliExpressProduct; collections: CollectionOption[] }>,
): Promise<Map<string, ProductContent>> {
  const claude = getClaude();
  const out = new Map<string, ProductContent>();
  const stream = await claude.messages.batches.results(batchId);
  for await (const entry of stream) {
    if (entry.result.type !== "succeeded") continue;
    const ctx = context.get(entry.custom_id);
    if (!ctx) continue;
    const text = extractText(entry.result.message);
    const raw = tryParse(text);
    if (raw && isComplete(raw)) {
      out.set(entry.custom_id, normalizeProductContent(raw, ctx.product, ctx.collections));
    }
  }
  return out;
}

export function isBatchApiEnabled(): boolean {
  return (process.env.USE_BATCH_API ?? "false").toLowerCase() === "true";
}

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function tryParse(text: string): RawBatch | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const clean = fence ? fence[1].trim() : text;
  try {
    return JSON.parse(clean) as RawBatch;
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as RawBatch;
      } catch {
        return null;
      }
    }
    return null;
  }
}
