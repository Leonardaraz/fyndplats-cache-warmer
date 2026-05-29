"use server";

import { listAllV3Products, getV3ProductFull, patchV3ProductSeo } from "@/lib/wix/v3-products";
import { generateMissingSeoTags, type V3ProductForEnrich } from "@/lib/seo/enrich";

export interface EnrichActionResult {
  ok: boolean;
  dryRun: boolean;
  stats?: {
    total: number;
    patched: number;
    skipped: number;
    failed: number;
  };
  firstErrors?: string[];
  error?: string;
}

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
    let patched = 0;
    let skipped = 0;
    let failed = 0;
    const firstErrors: string[] = [];

    // Bearbeta i parallella batches om 5 — håller Wix-rate-limit nere men
    // bär sig inom Vercel-timeout (~42s vid 207 produkter × ~1s/PATCH).
    const CONCURRENCY = 5;
    for (let i = 0; i < all.length; i += CONCURRENCY) {
      const chunk = all.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (summary) => {
          try {
            const product = await getV3ProductFull(summary.id);
            const newTags = generateMissingSeoTags(product as V3ProductForEnrich, cfg);

            if (newTags.length === 0) {
              skipped++;
              return;
            }

            if (dryRun) {
              patched++;
              return;
            }

            const existing = product.seoData?.tags ?? [];
            const merged = [...existing, ...(newTags as unknown as Array<Record<string, unknown>>)];
            await patchV3ProductSeo(product.id, product.revision, merged);
            patched++;
          } catch (err) {
            failed++;
            if (firstErrors.length < 5) {
              firstErrors.push(
                `${summary.name.slice(0, 50)}: ${err instanceof Error ? err.message.slice(0, 120) : "fel"}`,
              );
            }
          }
        }),
      );
    }

    return {
      ok: true,
      dryRun,
      stats: { total: all.length, patched, skipped, failed },
      firstErrors,
    };
  } catch (err) {
    return {
      ok: false,
      dryRun,
      error: err instanceof Error ? err.message : "okänt fel",
    };
  }
}
