// Orkestrering av auto-mappning: går igenom alla omappade Wix-produkter,
// kör AI-matchningen och antingen auto-mappar (high confidence) eller sparar
// ett förslag för manuell bekräftelse (medium/low).
//
// Körs server-side via /api/aliexpress/auto-map eller admin-knappen. Kräver
// AliExpress-API (sök) + ANTHROPIC_API_KEY (sökord) + Wix-token.

import { listAllV3Products } from "../wix/v3-products";
import { getStore } from "../store/factory";
import { buildAndSaveMapping } from "../import/create-mapping";
import { matchProduct } from "./auto-map";

export interface AutoMapSummary {
  totalProducts: number;
  alreadyMapped: number;
  unmapped: number;
  processed: number;
  autoMapped: number;
  suggested: number;
  errors: Array<{ wixProductId: string; name: string; error: string }>;
}

export interface AutoMapOptions {
  /** Begränsa antal produkter som behandlas denna körning (för test/batchning). */
  limit?: number;
  /** Auto-skapa mappning vid high confidence. Default true. */
  autoCreateHighConfidence?: boolean;
  /** Millisekunder paus mellan produkter (AliExpress rate-limit). Default 350. */
  throttleMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function autoMapUnmapped(opts: AutoMapOptions = {}): Promise<AutoMapSummary> {
  const autoCreate = opts.autoCreateHighConfidence ?? true;
  const throttleMs = opts.throttleMs ?? 350;

  const store = getStore();
  const [products, mappings] = await Promise.all([listAllV3Products(), store.listMappings()]);
  const mappedSet = new Set(mappings.map((m) => m.wixProductId));
  const unmapped = products.filter((p) => !mappedSet.has(p.id));
  const batch = opts.limit ? unmapped.slice(0, opts.limit) : unmapped;

  const summary: AutoMapSummary = {
    totalProducts: products.length,
    alreadyMapped: mappedSet.size,
    unmapped: unmapped.length,
    processed: 0,
    autoMapped: 0,
    suggested: 0,
    errors: [],
  };

  for (const p of batch) {
    try {
      const match = await matchProduct(p.id, p.name);

      if (autoCreate && match.confidence === "high" && match.best) {
        await buildAndSaveMapping(p.id, match.best.productId);
        // Rensa ev. tidigare förslag för produkten — den är nu mappad.
        await store.deleteSuggestion(p.id);
        summary.autoMapped++;
      } else {
        await store.saveSuggestion({
          wixProductId: p.id,
          wixProductName: p.name,
          searchQuery: match.searchQuery,
          confidence: match.confidence,
          candidates: match.candidates.slice(0, 6).map((c) => ({
            productId: c.productId,
            title: c.title,
            imageUrl: c.imageUrl,
            priceUsd: c.priceUsd,
            productUrl: c.productUrl,
            score: Number(c.score.toFixed(3)),
          })),
          createdAt: new Date().toISOString(),
        });
        summary.suggested++;
      }
      summary.processed++;
    } catch (err) {
      summary.errors.push({
        wixProductId: p.id,
        name: p.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    if (throttleMs > 0) await sleep(throttleMs);
  }

  return summary;
}

/**
 * Bekräftar ett förslag: skapar mappningen mot vald AliExpress-produkt och tar
 * bort förslaget. Används av admin-bekräftelseknappen.
 */
export async function confirmSuggestion(
  wixProductId: string,
  supplierProductId: string,
): Promise<{ pairedVariants: number; wixVariantCount: number; aeVariantCount: number }> {
  const res = await buildAndSaveMapping(wixProductId, supplierProductId);
  await getStore().deleteSuggestion(wixProductId);
  return {
    pairedVariants: res.pairedVariants,
    wixVariantCount: res.wixVariantCount,
    aeVariantCount: res.aeVariantCount,
  };
}

/** Avfärdar ett förslag utan att mappa (operatorn vill mappa manuellt/senare). */
export async function dismissSuggestion(wixProductId: string): Promise<void> {
  await getStore().deleteSuggestion(wixProductId);
}
