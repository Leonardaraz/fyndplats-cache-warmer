"use server";

import {
  listAllV3Products,
  bulkUpdateV3ProductSeo,
  bulkUpdateV3ProductDescriptions,
  type WixV3ProductSummary,
} from "@/lib/wix/v3-products";
import { listAllV1Products } from "@/lib/wix/v1-products";
import { generateMissingSeoTags, type V3ProductForEnrich } from "@/lib/seo/enrich";
import { normalizeName } from "@/lib/seo/migration";

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

export interface MigrateInfoSectionsResult {
  ok: boolean;
  dryRun: boolean;
  stats?: {
    v3Total: number;
    toMigrate: number;
    migrated: number;
    alreadyHad: number;
    noV1Sections: number;
    unmatched: number;
    failed: number;
  };
  firstErrors?: string[];
  error?: string;
}

/**
 * Migrerar V1:s additionalInfoSections (Specs/FAQ/Användning/Kontakt-flikar)
 * till V3 genom att appenda dem som H2-block till plainDescription. Wix V3
 * har 400-sektion-tak per site → 207 produkter × 4 sektioner som separata
 * infoSections är omöjligt. Append-strategin renderas identiskt i headless
 * (samma descriptionHtml-path) utan kollektions-overhead.
 *
 * Idempotent: produkter som redan har H2 med en av sektions-titlarna
 * (Specifikationer/Vanliga frågor/Användning och skötsel/Kontakta oss)
 * hoppas över — Wix V1→V3-migrationen hade redan slagit ihop dem för
 * vissa produkter.
 */
const SECTION_MARKER = /<h2[^>]*>\s*(Tekniska\s+[Ss]pecifikationer|Vanliga\s+fr[åa]gor|Anv[äa]ndning\s+och\s+sk[öo]tsel|Kontakta\s+oss)\s*<\/h2>/i;

export async function migrateInfoSectionsAction(
  dryRun: boolean,
): Promise<MigrateInfoSectionsResult> {
  try {
    const [v1, v3] = await Promise.all([listAllV1Products(), listAllV3Products()]);

    const v1ByName = new Map<string, (typeof v1)[number]>();
    for (const p of v1) v1ByName.set(normalizeName(p.name), p);

    const toUpdate: Array<{ id: string; revision: string; plainDescription: string }> = [];
    let alreadyHad = 0;
    let noV1Sections = 0;
    let unmatched = 0;

    for (const v3p of v3) {
      const currentPlain = v3p.plainDescription ?? "";
      if (SECTION_MARKER.test(currentPlain)) {
        alreadyHad++;
        continue;
      }
      const match = v1ByName.get(normalizeName(v3p.name));
      if (!match) {
        unmatched++;
        continue;
      }
      const sections = match.infoSections ?? [];
      if (sections.length === 0) {
        noV1Sections++;
        continue;
      }
      if (!v3p.revision) {
        unmatched++;
        continue;
      }
      const blocks = sections
        .map((s) => `<h2>${escapeHtml(s.title)}</h2>${s.description}`)
        .join("");
      const newPlain = currentPlain ? `${currentPlain}${blocks}` : blocks;
      toUpdate.push({
        id: v3p.id,
        revision: v3p.revision,
        plainDescription: newPlain,
      });
    }

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        stats: {
          v3Total: v3.length,
          toMigrate: toUpdate.length,
          migrated: toUpdate.length,
          alreadyHad,
          noV1Sections,
          unmatched,
          failed: 0,
        },
      };
    }

    let migrated = 0;
    let failed = 0;
    const firstErrors: string[] = [];
    for (let i = 0; i < toUpdate.length; i += 100) {
      const batch = toUpdate.slice(i, i + 100);
      try {
        const result = await bulkUpdateV3ProductDescriptions(batch);
        migrated += result.successes;
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
      stats: {
        v3Total: v3.length,
        toMigrate: toUpdate.length,
        migrated,
        alreadyHad,
        noV1Sections,
        unmatched,
        failed,
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface MigrateDescriptionsResult {
  ok: boolean;
  dryRun: boolean;
  stats?: {
    v1Total: number;
    v3Total: number;
    /** V3-produkter som får beskrivning kopierad från V1. */
    toMigrate: number;
    migrated: number;
    /** Redan hade beskrivning (idempotent skip). */
    alreadyHad: number;
    /** Matchade men V1 saknar beskrivning. */
    noV1Source: number;
    /** V3 utan V1-match. */
    unmatched: number;
    failed: number;
  };
  firstErrors?: string[];
  error?: string;
}

/**
 * Migrerar produktbeskrivningar (rik HTML) från gamla V1-katalogen till nya
 * V3-katalogen. Matchar på normaliserat namn (207/207 enligt migration-mappen),
 * sätter V3 plainDescription = V1 description-HTML. Wix genererar Ricos
 * automatiskt för storefronten.
 *
 * Idempotent: V3-produkter som redan har en beskrivning hoppas över.
 * Bulkar i grupper om 100 → 3 API-calls för hela katalogen.
 */
export async function migrateDescriptionsAction(
  dryRun: boolean,
): Promise<MigrateDescriptionsResult> {
  try {
    const [v1, v3] = await Promise.all([listAllV1Products(), listAllV3Products()]);

    // Indexera V1 på normaliserat namn för matchning.
    const v1ByName = new Map<string, (typeof v1)[number]>();
    for (const p of v1) v1ByName.set(normalizeName(p.name), p);

    const toUpdate: Array<{ id: string; revision: string; plainDescription: string }> = [];
    let alreadyHad = 0;
    let noV1Source = 0;
    let unmatched = 0;

    for (const v3p of v3) {
      // Hoppa över produkter som redan har en beskrivning (idempotent).
      if (v3p.plainDescription?.trim()) {
        alreadyHad++;
        continue;
      }
      const match = v1ByName.get(normalizeName(v3p.name));
      if (!match) {
        unmatched++;
        continue;
      }
      if (!match.description?.trim()) {
        noV1Source++;
        continue;
      }
      if (!v3p.revision) {
        unmatched++;
        continue;
      }
      toUpdate.push({
        id: v3p.id,
        revision: v3p.revision,
        plainDescription: match.description,
      });
    }

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        stats: {
          v1Total: v1.length,
          v3Total: v3.length,
          toMigrate: toUpdate.length,
          migrated: toUpdate.length,
          alreadyHad,
          noV1Source,
          unmatched,
          failed: 0,
        },
      };
    }

    let migrated = 0;
    let failed = 0;
    const firstErrors: string[] = [];
    for (let i = 0; i < toUpdate.length; i += 100) {
      const batch = toUpdate.slice(i, i + 100);
      try {
        const result = await bulkUpdateV3ProductDescriptions(batch);
        migrated += result.successes;
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
      stats: {
        v1Total: v1.length,
        v3Total: v3.length,
        toMigrate: toUpdate.length,
        migrated,
        alreadyHad,
        noV1Source,
        unmatched,
        failed,
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
