// Live-smoke för Anthropic Message Batches (#8). Skickar in EN riktig produkt som
// en batch, pollar status och (om batchen hinner bli klar) hämtar + normaliserar
// svaret. Bevisar att request-formen accepteras av API:t end-to-end.
//
//   node_modules/.bin/vitest run --config vitest.smoke.config.ts
//
// Kräver ANTHROPIC_API_KEY (läses ur .env.local). Kostar några ören.

import { beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { submitProductContentBatch, getBatchStatus, fetchBatchResults } from "../lib/claude/batch.ts";
import type { AliExpressProduct } from "../lib/import/types.ts";
import type { CollectionOption } from "../lib/claude/types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

beforeAll(() => {
  try {
    const raw = readFileSync(path.join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas.");
});

const COLLECTIONS: CollectionOption[] = [
  { slug: "kok", name: "Kök & Husgeråd" },
  { slug: "elektronik", name: "Elektronik & Tillbehör" },
];

const PRODUCT: AliExpressProduct = {
  supplierProductId: "SMOKE-1",
  sourceUrl: "https://www.aliexpress.com/item/smoke.html",
  rawTitle: "Digital Kitchen Scale 5kg Stainless Steel LCD",
  rawDescription: "High precision digital kitchen scale 5kg/1g, stainless steel, LCD backlight, tare function.",
  imageUrls: ["https://x/1.jpg", "https://x/2.jpg"],
  specifications: { Material: "Stainless steel", Capacity: "5kg" },
  features: ["LCD backlight", "Tare function"],
  packageContents: ["1 x Scale", "1 x Manual"],
  variants: [{ supplierVariantId: "v1", options: { Color: "Silver" }, costUsd: 5, included: true }],
};

it("submit → poll → (ev.) fetch en riktig batch", async () => {
  const batchId = await submitProductContentBatch([
    { customId: PRODUCT.supplierProductId, product: PRODUCT, collections: COLLECTIONS },
  ]);
  console.log(`[smoke] batch inskickad: ${batchId}`);
  expect(batchId).toMatch(/^msgbatch_/);

  // Polla upp till ~4 min (270s × cache-vänliga intervaller). Batchar är oftast
  // klara på några minuter; hinner den inte → vi har ändå bevisat submit+status.
  let ended = false;
  const deadline = 240_000;
  const start = Date.now();
  while (Date.now() - start < deadline) {
    const s = await getBatchStatus(batchId);
    console.log(`[smoke] status=${s.processingStatus} succeeded=${s.counts.succeeded} processing=${s.counts.processing}`);
    if (s.ended) {
      ended = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }

  if (ended) {
    const ctx = new Map([[PRODUCT.supplierProductId, { product: PRODUCT, collections: COLLECTIONS }]]);
    const out = await fetchBatchResults(batchId, ctx);
    const content = out.get(PRODUCT.supplierProductId);
    console.log(`[smoke] resultat hämtat: title="${content?.seo.title}" faq=${content?.tabs.faq.length}`);
    expect(content).toBeTruthy();
    expect(content!.seo.descriptionHtml.length).toBeGreaterThan(50);
    expect(content!.tabs.faq.length).toBeGreaterThanOrEqual(3);
  } else {
    console.log("[smoke] batchen hann inte bli klar inom tidsgränsen — submit+status verifierat (fetch testas i enhetstest).");
  }
}, 300_000);
