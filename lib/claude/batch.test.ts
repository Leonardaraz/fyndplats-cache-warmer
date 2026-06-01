import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocka @anthropic-ai/sdk med messages.batches.{create,retrieve,results}.
const mockCreate = vi.fn();
const mockRetrieve = vi.fn();
const mockResults = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = { batches: { create: mockCreate, retrieve: mockRetrieve, results: mockResults } };
    },
  };
});

import {
  submitProductContentBatch,
  getBatchStatus,
  fetchBatchResults,
  isBatchApiEnabled,
  type BatchInputItem,
} from "./batch";
import type { AliExpressProduct } from "../import/types";
import type { CollectionOption } from "./types";

const COLLECTIONS: CollectionOption[] = [{ slug: "kok", name: "Kök & Husgeråd" }];

function product(id = "AB-1"): AliExpressProduct {
  return {
    supplierProductId: id,
    sourceUrl: "https://www.aliexpress.com/item/1.html",
    rawTitle: "Digital kitchen scale 5kg stainless steel",
    rawDescription: "Precise digital kitchen scale 5kg with LCD and tare.",
    imageUrls: ["https://x/1.jpg", "https://x/2.jpg"],
    specifications: { Material: "Steel" },
    features: ["LCD"],
    packageContents: ["1 x Scale"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Black" }, costUsd: 4, included: true }],
  };
}

const MERGED_JSON = JSON.stringify({
  seo: {
    title: "Digital köksvåg 5 kg i rostfritt stål",
    metaDescription: "Precis köksvåg med LCD och tara, 5 kg kapacitet och hög noggrannhet för köket.",
    descriptionHtml: "<p>Väg exakt.</p><p>Smidig i köket.</p><ul><li>LCD</li><li>Tara</li></ul><p>Perfekt för bak.</p>",
    slug: "digital-koksvag",
    imageAltTexts: ["a", "b"],
  },
  category: { collection_slug: "kok", confidence: 0.9, reason: "köksvåg" },
  tabs: {
    specs: [{ label: "Material", value: "Rostfritt stål" }],
    packageContents: ["1 x Våg"],
    faq: [
      { q: "Vattentät?", a: "Tål stänk." },
      { q: "Batteri?", a: "AAA." },
      { q: "Tara?", a: "Ja." },
    ],
    careHtml: null,
  },
});

beforeEach(() => {
  mockCreate.mockReset();
  mockRetrieve.mockReset();
  mockResults.mockReset();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  delete process.env.CLAUDE_BATCH_MODEL;
  delete process.env.USE_BATCH_API;
});
afterEach(() => vi.clearAllMocks());

describe("submitProductContentBatch", () => {
  it("skickar in en request per item med rätt form och returnerar batch-id", async () => {
    mockCreate.mockResolvedValueOnce({ id: "msgbatch_123" });
    const items: BatchInputItem[] = [
      { customId: "AB-1", product: product("AB-1"), collections: COLLECTIONS },
      { customId: "AB-2", product: product("AB-2"), collections: COLLECTIONS },
    ];
    const id = await submitProductContentBatch(items);
    expect(id).toBe("msgbatch_123");

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.requests).toHaveLength(2);
    const r0 = arg.requests[0];
    expect(r0.custom_id).toBe("AB-1");
    expect(r0.params.model).toBe("claude-haiku-4-5-20251001");
    expect(r0.params.max_tokens).toBe(4000);
    expect(r0.params.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(typeof r0.params.messages[0].content).toBe("string");
  });

  it("kastar om inga items", async () => {
    await expect(submitProductContentBatch([])).rejects.toThrow();
  });
});

describe("getBatchStatus", () => {
  it("mappar processing_status=ended → ended:true", async () => {
    mockRetrieve.mockResolvedValueOnce({
      id: "b1",
      processing_status: "ended",
      request_counts: { processing: 0, succeeded: 2, errored: 0, canceled: 0, expired: 0 },
    });
    const s = await getBatchStatus("b1");
    expect(s.ended).toBe(true);
    expect(s.counts.succeeded).toBe(2);
  });

  it("in_progress → ended:false", async () => {
    mockRetrieve.mockResolvedValueOnce({
      id: "b1",
      processing_status: "in_progress",
      request_counts: { processing: 2, succeeded: 0, errored: 0, canceled: 0, expired: 0 },
    });
    expect((await getBatchStatus("b1")).ended).toBe(false);
  });
});

describe("fetchBatchResults", () => {
  it("normaliserar lyckade svar och hoppar över felade/okända", async () => {
    // for-await fungerar på en vanlig array (sync-iterable).
    mockResults.mockResolvedValueOnce([
      { custom_id: "AB-1", result: { type: "succeeded", message: { content: [{ type: "text", text: MERGED_JSON }] } } },
      { custom_id: "AB-2", result: { type: "errored", error: { type: "x" } } },
      { custom_id: "UNKNOWN", result: { type: "succeeded", message: { content: [{ type: "text", text: MERGED_JSON }] } } },
    ]);
    const ctx = new Map([["AB-1", { product: product("AB-1"), collections: COLLECTIONS }]]);
    const out = await fetchBatchResults("b1", ctx);

    expect([...out.keys()]).toEqual(["AB-1"]); // AB-2 felade, UNKNOWN saknar kontext
    const content = out.get("AB-1")!;
    expect(content.seo.title).toBe("Digital köksvåg 5 kg i rostfritt stål");
    expect(content.category.collectionSlug).toBe("kok");
    expect(content.tabs.faq).toHaveLength(3);
  });

  it("hoppar över ofullständig/trasig JSON", async () => {
    mockResults.mockResolvedValueOnce([
      { custom_id: "AB-1", result: { type: "succeeded", message: { content: [{ type: "text", text: '{"seo":{"title":"avhugget' }] } } },
    ]);
    const ctx = new Map([["AB-1", { product: product("AB-1"), collections: COLLECTIONS }]]);
    const out = await fetchBatchResults("b1", ctx);
    expect(out.size).toBe(0);
  });
});

describe("isBatchApiEnabled", () => {
  it("default av", () => {
    expect(isBatchApiEnabled()).toBe(false);
  });
  it("på när USE_BATCH_API=true", () => {
    process.env.USE_BATCH_API = "true";
    expect(isBatchApiEnabled()).toBe(true);
  });
});
