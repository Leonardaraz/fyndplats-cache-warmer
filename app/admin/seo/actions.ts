"use server";

import { listAllV3Products, bulkUpdateV3ProductSeo, type WixV3ProductSummary } from "@/lib/wix/v3-products";
import { generateMissingSeoTags, type V3ProductForEnrich } from "@/lib/seo/enrich";

export interface EnrichActionResult {
  ok: boolean;
  dryRun: boolean;
  isDone?: boolean;
  stats?: {
    total: number;
    patched: number;
    skipped: number;
    failed: number;
    processedSoFar: number;
  };
  firstErrors?: string[];
  error?: string;
}

/**
 * Bulk-enricha alla V3-produkter med saknade SEO-taggar (JSON-LD + OG + canonical).
 * Använder Wix V3 bulk-update endpoint (upp till 100 produkter per call) — 207
 * produkter blir 3 API-calls totalt = ~5-10s, väl inom Vercel-timeout.
 *
 * Idempotent: produkter som redan har og:title hoppas över. listAllV3Products
 * returnerar nu all enrichment-data direkt så vi slipper N+1 GETs.
 */
export async function enrichAllV3Action(
  dryRun: boolean,
  baseUrl: string,
  newPathPrefix: string,
): Promise<EnrichActionResult> {
  try {
    const cfg = {
      baseUrl: baseUrl || "https://www.fyndplats.se",
      newPathPrefix: newPathPrefix || "/products/",
    };

    const all = await listAllV3Products();
    const total = all.length;

    // Bygg enrich-payloads för produkter som behöver det
    const toUpdate: Array<{ id: string; revision: string; tags: Array<Record<string, unknown>>; name: string }> = [];
    let skipped = 0;

    for (const summary of all) {
      if (!summary.revision) {
        // Produkt utan revision kan inte updateras — Wix kräver det för opt. concurrency
        skipped++;
        continue;
      }
      // Skapa V3-product-objekt för generateMissingSeoTags
      const productForEnrich: V3ProductForEnrich = {
        id: summary.id,
        name: summary.name,
        slug: summary.slug,
        brand: summary.brandName ? { name: summary.brandName } : undefined,
        media: summary.imageUrl ? { main: { image: { url: summary.imageUrl } } } : undefined,
        actualPriceRange: summary.priceMin ? { minValue: { amount: summary.priceMin } } : undefined,
        inventory: { availabilityStatus: summary.inStock ? "IN_STOCK" : "OUT_OF_STOCK" },
        seoTitle: summary.seoTitle,
        seoDescription: summary.seoDescription,
        seoData: { tags: summary.existingTags as never },
        handle: summary.handle,
      };
      const newTags = generateMissingSeoTags(productForEnrich, cfg);
      if (newTags.length === 0) {
        skipped++;
        continue;
      }
      const merged = [
        ...(summary.existingTags ?? []),
        ...(newTags as unknown as Array<Record<string, unknown>>),
      ];
      toUpdate.push({
        id: summary.id,
        revision: summary.revision,
        tags: merged,
        name: summary.name,
      });
    }

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        isDone: true,
        stats: {
          total,
          patched: toUpdate.length,
          skipped,
          failed: 0,
          processedSoFar: total,
        },
      };
    }

    // Bulka i grupper om 100
    let patched = 0;
    let failed = 0;
    const firstErrors: string[] = [];
    for (let i = 0; i < toUpdate.length; i += 100) {
      const batch = toUpdate.slice(i, i + 100);
      try {
        const result = await bulkUpdateV3ProductSeo(batch);
        patched += result.successes;
        failed += result.failures;
        for (const e of result.firstErrors) {
          if (firstErrors.length < 5) firstErrors.push(e);
        }
      } catch (err) {
        failed += batch.length;
        if (firstErrors.length < 5) {
          firstErrors.push(`batch ${i / 100 + 1}: ${err instanceof Error ? err.message.slice(0, 120) : "fel"}`);
        }
      }
    }

    return {
      ok: true,
      dryRun: false,
      isDone: true,
      stats: {
        total,
        patched,
        skipped,
        failed,
        processedSoFar: total,
      },
      firstErrors,
    };
  } catch (err) {
    return {
      ok: false,
      dryRun,
      error: err instanceof Error ? `${err.name}: ${err.message}` : "okänt fel",
    };
  }
}
