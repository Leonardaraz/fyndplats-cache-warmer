"use server";

// Server-actions för /admin/discover. Anropas direkt från React-klienten
// (vi slipper exponera EXTENSION_API_TOKEN i browsern).

import { revalidatePath } from "next/cache";
import {
  searchAliExpressByText,
  extractAliExpressProductId,
  getProduct,
  type AliExpressSearchOptions,
  type AliExpressSortBy,
} from "@/lib/aliexpress/client";
import { classifyWarehouses } from "@/lib/aliexpress/eu-countries";
import { audit } from "@/lib/audit";
import { getPricingRules } from "@/lib/store/pricing-config";
import { importProduct } from "@/lib/import/pipeline";
import type { AliExpressProduct } from "@/lib/import/types";
import { getStore } from "@/lib/store/factory";
import { getWatchlistStore } from "@/lib/watchlist/store";
import type { DiscoverResult } from "./types";

interface DiscoverSearchInput {
  query: string;
  sortBy?: AliExpressSortBy;
  page?: number;
  pageSize?: number;
  maxPriceUsd?: number;
  categoryId?: string;
  euOnly?: boolean;
}

type DiscoverSearchResponse =
  | { ok: true; results: DiscoverResult[] }
  | { ok: false; error: string };

export async function runDiscoverSearchAction(
  input: DiscoverSearchInput,
): Promise<DiscoverSearchResponse> {
  const query = (input.query ?? "").trim();
  if (!query) return { ok: false, error: "Tom sökterm" };

  const options: AliExpressSearchOptions = {
    sortBy: input.sortBy,
    page: input.page,
    pageSize: input.pageSize ?? 20,
    maxPriceUsd: input.maxPriceUsd,
    categoryId: input.categoryId,
  };

  try {
    const all = await searchAliExpressByText(query, options);
    const euOnly = input.euOnly !== false;
    const enriched: DiscoverResult[] = all.map((p) => {
      const codes = p.shipsFromCountries ?? [];
      return {
        ...p,
        shipsFromCountries: codes,
        warehouseClass: classifyWarehouses(codes),
      };
    });
    const filtered = euOnly
      ? enriched.filter((p) => {
          if (p.warehouseClass === "UNKNOWN") return true;
          return p.warehouseClass === "EU" || p.warehouseClass === "MIXED";
        })
      : enriched;
    return { ok: true, results: filtered };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt sökfel";
    return { ok: false, error: message };
  }
}

interface ImportActionResponse {
  ok: boolean;
  message: string;
  wixProductId?: string;
}

/**
 * Kör import direkt från /admin/discover. Vi hämtar produkt-detail först
 * (för shipFrom + variants) och anropar sedan importProduct-pipeline
 * istället för att gå via /api/import — sparar en HTTP-hop och slipper
 * exponera EXTENSION_API_TOKEN här.
 */
export async function importByUrlAction(url: string): Promise<ImportActionResponse> {
  const productId = extractAliExpressProductId(url);
  if (!productId) {
    return { ok: false, message: "Kunde inte extrahera AliExpress-produkt-id från URL." };
  }

  try {
    const detail = await getProduct(productId);

    // NEDTAGEN LISTNING (audit 2026-08-24). Den här vägen går FÖRBI /api/import
    // och därmed förbi både dubblettspärren och kontamineringsguarderna — den
    // behöver därför sin egen. Extra angeläget här: OOS-mejlets alternativ-
    // förslag länkar rakt in hit med ett klick, och kandidaterna kommer från en
    // textsökning som aldrig kollat om listningen lever.
    if (detail.listingAvailability === "offline") {
      return {
        ok: false,
        message:
          `AliExpress-listningen är nedtagen${detail.offlineReason ? ` (${detail.offlineReason})` : ""}`
          + " — den går inte att beställa och importeras därför inte.",
      };
    }

    const adapted: AliExpressProduct = {
      supplierProductId: detail.productId,
      sourceUrl: url,
      rawTitle: detail.title,
      rawDescription: detail.description,
      imageUrls: detail.images,
      shipsFrom: detail.shipsFromCountries ?? [],
      variants: detail.variants.map((v) => ({
        supplierVariantId: v.skuId,
        options: v.skuProps,
        costUsd: v.price,
        stock: v.stock,
        shipFrom: v.shipFrom,
        included: true,
      })),
    };

    const result = await importProduct(adapted, await getPricingRules());

    // Spara mappingen (med warehouse-fält) — duplicerar route.ts-logiken
    // men håller actionen självförsörjande.
    const draftStatus =
      process.env.IMPORT_DRAFT_DEFAULT === "false" ? "published" : "pending_review";
    const resultAny = result as unknown as Record<string, unknown>;
    const mappingExtras: Record<string, unknown> = {};
    if (resultAny.imageAnalysis !== undefined) mappingExtras.imageAnalysis = resultAny.imageAnalysis;
    if (resultAny.categorySuggestion !== undefined) {
      mappingExtras.categorySuggestion = resultAny.categorySuggestion;
    }
    if (resultAny.shipsFromCountries !== undefined) {
      mappingExtras.shipsFromCountries = resultAny.shipsFromCountries;
    }
    if (resultAny.hasEuWarehouse !== undefined) mappingExtras.hasEuWarehouse = resultAny.hasEuWarehouse;
    if (resultAny.warehouseClass !== undefined) mappingExtras.warehouseClass = resultAny.warehouseClass;

    await getStore().saveMapping({
      supplierProductId: result.supplierProductId,
      wixProductId: result.wixProductId,
      variants: result.variantMappings,
      draftStatus,
      createdAt: new Date().toISOString(),
      seoTitle: result.seo.title,
      sourceUrl: url,
      ...mappingExtras,
    });

    await audit("discover-import", result.wixProductId, result.seo.title);

    revalidatePath("/admin/queue");
    revalidatePath("/admin");

    return {
      ok: true,
      message: "Importerad till Wix.",
      wixProductId: result.wixProductId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt importfel";
    await audit("discover-import-error", productId, message.slice(0, 200));
    return { ok: false, message };
  }
}

// --- Bevakningslista --------------------------------------------------------

export async function listWatchlistAction(): Promise<string[]> {
  return getWatchlistStore().list();
}

export async function addWatchlistTermAction(term: string): Promise<string[]> {
  const clean = term.trim();
  if (!clean) return getWatchlistStore().list();
  await getWatchlistStore().add(clean);
  await audit("discover-watchlist-add", clean.slice(0, 100));
  return getWatchlistStore().list();
}

export async function removeWatchlistTermAction(term: string): Promise<string[]> {
  await getWatchlistStore().remove(term);
  await audit("discover-watchlist-remove", term.slice(0, 100));
  return getWatchlistStore().list();
}

// Obs: "use server"-filer i Next.js får endast exportera async server-actions
// (TS-typer och hjälpfunktioner triggar build-fel). Klient-komponenten
// importerar AliExpressSortBy direkt från lib/aliexpress/client istället.
