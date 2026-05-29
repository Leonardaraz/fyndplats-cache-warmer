"use server";

import { listAllV3Products, getV3ProductFull, patchV3ProductSeo } from "@/lib/wix/v3-products";
import { generateMissingSeoTags, type V3ProductForEnrich } from "@/lib/seo/enrich";

export interface EnrichActionResult {
  ok: boolean;
  dryRun: boolean;
  /** ID:n som processats hittills (för fortsättningsläge). */
  cursor?: number;
  isDone?: boolean;
  stats?: {
    total: number;
    patched: number;
    skipped: number;
    failed: number;
    /** Hur långt vi nått i listan (1-indexerat). */
    processedSoFar: number;
  };
  firstErrors?: string[];
  error?: string;
}

const CHUNK_SIZE = 25;
const CONCURRENCY = 10;

/**
 * Chunkad enrichment: processar CHUNK_SIZE produkter per anrop, startar från
 * fromIndex (0 = början). Returnerar nästa cursor + isDone så UI kan auto-
 * progressa via repeterade anrop. Detta kringgår Vercel-timeout för stora
 * kataloger (varje chunk på ~10s passar i alla tier).
 */
export async function enrichAllV3Action(
  dryRun: boolean,
  baseUrl: string,
  newPathPrefix: string,
  fromIndex = 0,
  prevStats?: { patched: number; skipped: number; failed: number; firstErrors: string[] },
): Promise<EnrichActionResult> {
  try {
    const cfg = {
      baseUrl: baseUrl || "https://www.fyndplats.se",
      newPathPrefix: newPathPrefix || "/products/",
    };

    const all = await listAllV3Products();
    const chunk = all.slice(fromIndex, fromIndex + CHUNK_SIZE);

    let patched = prevStats?.patched ?? 0;
    let skipped = prevStats?.skipped ?? 0;
    let failed = prevStats?.failed ?? 0;
    const firstErrors: string[] = [...(prevStats?.firstErrors ?? [])];

    for (let i = 0; i < chunk.length; i += CONCURRENCY) {
      const slice = chunk.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (summary) => {
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
            if (firstErrors.length < 10) {
              firstErrors.push(
                `${summary.name.slice(0, 50)}: ${err instanceof Error ? err.message.slice(0, 120) : "fel"}`,
              );
            }
          }
        }),
      );
    }

    const nextIndex = fromIndex + chunk.length;
    const isDone = nextIndex >= all.length;

    return {
      ok: true,
      dryRun,
      cursor: nextIndex,
      isDone,
      stats: {
        total: all.length,
        patched,
        skipped,
        failed,
        processedSoFar: nextIndex,
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
