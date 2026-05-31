import { computePrice } from "./pricing";
import { generateSeo, type SeoResult } from "./seo";
import type { AliExpressProduct, PricingConfig } from "./types";
import {
  addProductToCollection,
  createProduct,
  getCollections,
  type WixProductInput,
  type WixVariantInput,
} from "../wix/client";
import { importMediaUrls } from "../wix/media";
import {
  analyzeImages,
  suggestCategory,
  type CategorySuggestion,
  type CollectionOption,
  type ImageAnalysisResult,
} from "../claude/client";
import type { CategorySuggestionRecord, ImageAnalysisEntry } from "../store/index";
import {
  classifyWarehouses,
  hasAnyEuWarehouse,
  uniqueShipFromCodes,
  type WarehouseClass,
} from "../aliexpress/eu-countries";
import { audit } from "../audit";

export interface VariantMapping {
  supplierVariantId: string;
  sku: string;
  /** Wix-tilldelat variant-id (sätts efter att produkten skapats). */
  wixVariantId?: string;
  choices: Record<string, string>;
  // Sparat vid import — används av lönsamhetsöversikten och prisbevakningen.
  costUsd: number;
  landedCostSek: number;
  grossSek: number;
}

export interface ImportResult {
  wixProductId: string;
  slug: string;
  supplierProductId: string;
  seo: SeoResult;
  variantMappings: VariantMapping[];
  /** Claude vision-analys per bild (samma ordning som inkommande imageUrls). */
  imageAnalysis: ImageAnalysisEntry[];
  /** Claude-förslag på Wix-kategori. */
  categorySuggestion: CategorySuggestionRecord;
  /** Unika shipFrom-koder (t.ex. ["ES","CN"]). */
  shipsFromCountries: string[];
  /** True om någon variant skickas från EU-lager. */
  hasEuWarehouse: boolean;
  /** "EU" | "CN" | "MIXED" | "UNKNOWN" — för Wix custom-field / ribbon. */
  warehouseClass: WarehouseClass;
}

/** Stabil SKU per leverantörsvariant — används senare för lager-/orderkoppling. */
export function makeSku(supplierProductId: string, supplierVariantId: string): string {
  return `AE-${supplierProductId}-${supplierVariantId}`;
}

/** Färgkoder per option och val: { [optionName]: { [choiceName]: "#hex" } }. */
export type OptionColorCodes = Record<string, Record<string, string>>;

export interface DerivedOption {
  name: string;
  choices: { name: string; colorCode?: string }[];
}

/**
 * Härleder Wix-optionsdefinitioner från variantvärdena. Om en colorCode finns
 * för ett val (samplad från produktbilden) följer den med → färg-swatch i Wix.
 */
export function deriveOptions(
  variants: AliExpressProduct["variants"],
  colorCodes?: OptionColorCodes,
): DerivedOption[] {
  const map = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.options)) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name)!.add(value);
    }
  }
  return [...map.entries()].map(([name, set]) => ({
    name,
    choices: [...set].map((choiceName) => ({
      name: choiceName,
      colorCode: colorCodes?.[name]?.[choiceName],
    })),
  }));
}

/**
 * Kör hela import-flödet för en produkt:
 * SEO-optimering → prissättning (inkl. moms) per inkluderad variant → skapa i Wix.
 * Endast varianter med `included: true` importeras (variant-filter från popupen).
 */
export async function importProduct(
  product: AliExpressProduct,
  config: PricingConfig,
  colorCodes?: OptionColorCodes,
): Promise<ImportResult> {
  const included = product.variants.filter((v) => v.included);
  if (included.length === 0) {
    throw new Error("Inga varianter valda för import.");
  }

  // Kör SEO, bildanalys och kategoriförslag parallellt för att hålla
  // import-latensen nere. Alla tre är Claude-anrop som kan failas individuellt.
  const seoPromise = generateSeo(product);
  const imageAnalysisPromise = analyzeImages(product.imageUrls);
  const collectionsPromise = getCollectionsSafe();

  const seo = await seoPromise;
  const imageVerdicts = await imageAnalysisPromise;

  // Filtrera bort rejected bilder från huvudgalleriet. Warns demoteras (läggs
  // sist) men följer ändå med så Leonard kan välja att behålla dem.
  const orderedImageUrls = orderImagesByVerdict(product.imageUrls, imageVerdicts);

  // Ladda upp bilder till Wix Media Manager parallellt med variant-/options-bygget.
  // Endast bilder som inte är "reject" laddas upp — sparar tid och Wix-storage.
  const mediaPromise = importMediaUrls(
    orderedImageUrls.map((url, i) => ({ url, displayName: `${seo.slug || "produkt"}-${i + 1}` })),
  );

  // Options härleds från ALLA varianter; avbockade varianter skapas men döljs
  // (visible: false) så att Wix får en komplett variantuppsättning.
  const options = deriveOptions(product.variants, colorCodes);
  const variantMappings: VariantMapping[] = [];
  const wixVariants: WixVariantInput[] = product.variants.map((v) => {
    const sku = makeSku(product.supplierProductId, v.supplierVariantId);
    const price = computePrice(v.costUsd, config);
    if (v.included) {
      variantMappings.push({
        supplierVariantId: v.supplierVariantId,
        sku,
        choices: v.options,
        costUsd: v.costUsd,
        landedCostSek: price.costSek,
        grossSek: price.grossSek,
      });
    }
    return {
      sku,
      actualPrice: price.grossSek.toFixed(2),
      choices: v.options,
      visible: v.included,
    };
  });

  // Vänta in bilduppladdningarna och koppla alt-text per bild (faller tillbaka
  // på titeln om SEO-pipelinen inte producerade en alt för just den bilden).
  // OBS: alt-texterna matchade ursprungsordningen — gör om mappningen mot
  // de nya (omsorterade) URL:erna så vi behåller rätt alt per bild.
  const uploadedMedia = await mediaPromise;
  const altByOriginalUrl = new Map<string, string>();
  product.imageUrls.forEach((u, i) => {
    altByOriginalUrl.set(u, seo.imageAltTexts[i] ?? seo.title);
  });
  const mediaItems = uploadedMedia.map((m, i) => ({
    url: m.url,
    altText: altByOriginalUrl.get(orderedImageUrls[i]) ?? seo.title,
  }));

  // Aggregera warehouse-koder över alla varianter + ev. produkt-default.
  // Påverkar Wix-ribbonen och persisteras på mapping-posten för senare filterring.
  const allShipFromCodes: string[] = [];
  for (const v of product.variants) {
    if (v.shipFrom) allShipFromCodes.push(v.shipFrom);
  }
  if (product.shipsFrom) allShipFromCodes.push(...product.shipsFrom);
  const shipsFromCountries = uniqueShipFromCodes(allShipFromCodes);
  const hasEuWarehouse = hasAnyEuWarehouse(shipsFromCountries);
  const warehouseClass = classifyWarehouses(shipsFromCountries);

  const wixInput: WixProductInput = {
    name: seo.title,
    slug: seo.slug,
    plainDescription: seo.descriptionHtml,
    seo: { title: seo.title, description: seo.metaDescription },
    options: options.length ? options : undefined,
    variants: wixVariants,
    mediaItems: mediaItems.length ? mediaItems : undefined,
    // EU-lager-produkter får ett ribbon i Wix (visas på produktkort). Vi
    // använder ribbon istället för custom-fält + product tags eftersom Wix V3
    // har inbyggt stöd och det renderas både i back-end och på sajten utan
    // extra Velo-kod. Headless-repots produktkort läser samma fält.
    ribbonName: hasEuWarehouse ? "EU-lager" : undefined,
    // Standard: nya produkter göms tills publish via /admin/queue.
    // IMPORT_DRAFT_DEFAULT=false hoppar över granskningen.
    visible: process.env.IMPORT_DRAFT_DEFAULT === "false",
  };

  const created = await createProduct(wixInput);

  // Koppla Wix-tilldelade variant-id:n till våra mappningar via SKU.
  const skuToWixId = new Map(created.variants.map((v) => [v.sku, v.id]));
  for (const m of variantMappings) {
    m.wixVariantId = skuToWixId.get(m.sku);
  }

  // Kategorisering. Vänta in collections (kan vara tom om Wix-call misslyckats).
  const collections = await collectionsPromise;
  const categorySuggestion = await suggestCategoryRecord(seo, product, collections);

  // Auto-assign vid hög confidence.
  if (categorySuggestion.status === "auto" && categorySuggestion.collectionId) {
    try {
      await addProductToCollection(created.id, categorySuggestion.collectionId);
      await audit(
        "category-auto-assign",
        created.id,
        `${categorySuggestion.collectionSlug} (conf=${categorySuggestion.confidence.toFixed(2)})`,
      );
    } catch (err) {
      // Demotera till "suggested" om Wix-anropet failade — Leonard kan
      // klicka in den manuellt från kö-UI:t.
      categorySuggestion.status = "suggested";
      await audit(
        "category-auto-assign-failed",
        created.id,
        err instanceof Error ? err.message.slice(0, 200) : String(err),
      );
    }
  }

  const imageAnalysisEntries: ImageAnalysisEntry[] = imageVerdicts.map((v) => ({
    url: v.url,
    verdict: v.verdict,
    reason: v.reason,
  }));

  // Logga sammanfattning så vi kan se i /admin/audit hur många bilder som flaggades.
  const counts = countByVerdict(imageVerdicts);
  if (imageVerdicts.length > 0) {
    await audit(
      "claude-image-analysis",
      created.id,
      `ok=${counts.ok} warn=${counts.warn} reject=${counts.reject}`,
    );
  }

  return {
    wixProductId: created.id,
    slug: created.slug,
    supplierProductId: product.supplierProductId,
    seo,
    variantMappings,
    imageAnalysis: imageAnalysisEntries,
    categorySuggestion,
    shipsFromCountries,
    hasEuWarehouse,
    warehouseClass,
  };
}

// --- Helpers ---------------------------------------------------------------

/**
 * Returnerar bild-URL:er i ny ordning: ok-bilder först, warns sist, rejects
 * helt borttagna. Bevarar ursprunglig ordning inom varje grupp.
 */
export function orderImagesByVerdict(
  urls: string[],
  verdicts: ImageAnalysisResult[],
): string[] {
  const verdictByUrl = new Map(verdicts.map((v) => [v.url, v.verdict]));
  const ok: string[] = [];
  const warn: string[] = [];
  for (const url of urls) {
    const v = verdictByUrl.get(url);
    if (v === "reject") continue;
    if (v === "warn") warn.push(url);
    else ok.push(url); // "ok" + okänd (fail-open)
  }
  return [...ok, ...warn];
}

function countByVerdict(verdicts: ImageAnalysisResult[]): {
  ok: number;
  warn: number;
  reject: number;
} {
  let ok = 0;
  let warn = 0;
  let reject = 0;
  for (const v of verdicts) {
    if (v.verdict === "reject") reject++;
    else if (v.verdict === "warn") warn++;
    else ok++;
  }
  return { ok, warn, reject };
}

/** Wrap getCollections så ett fel inte fäller hela importen. */
async function getCollectionsSafe(): Promise<CollectionOption[]> {
  try {
    const cols = await getCollections();
    return cols.map((c) => ({ slug: c.slug, name: c.name, description: c.description }));
  } catch (err) {
    console.warn(
      "[import] getCollections failed, hoppar över kategorisering:",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

/**
 * Översätter Claudes suggestion till en CategorySuggestionRecord — inkl.
 * att slå upp Wix collection-id för auto-assign.
 */
async function suggestCategoryRecord(
  seo: SeoResult,
  product: AliExpressProduct,
  collections: CollectionOption[],
): Promise<CategorySuggestionRecord> {
  if (collections.length === 0) {
    return {
      collectionSlug: null,
      confidence: 0,
      reason: "Inga butikskollektioner tillgängliga.",
      status: "uncategorized",
    };
  }

  const suggestion: CategorySuggestion = await suggestCategory(
    seo.title,
    seo.descriptionHtml || product.rawDescription,
    collections,
  );

  if (!suggestion.collectionSlug) {
    return {
      collectionSlug: null,
      confidence: suggestion.confidence,
      reason: suggestion.reason || "Claude kunde inte hitta en tydlig kategori.",
      status: "uncategorized",
    };
  }

  // Slå upp Wix-id + namn för slug:en (för auto-assign + visning).
  const wixCols = await getCollections().catch(() => []);
  const match = wixCols.find((c) => c.slug === suggestion.collectionSlug);
  const collectionId = match?.id;
  const collectionName = match?.name ?? suggestion.collectionSlug;

  let status: CategorySuggestionRecord["status"];
  if (suggestion.confidence > 0.7 && collectionId) status = "auto";
  else if (suggestion.confidence >= 0.4) status = "suggested";
  else status = "uncategorized";

  return {
    collectionSlug: suggestion.collectionSlug,
    collectionId,
    collectionName,
    confidence: suggestion.confidence,
    reason: suggestion.reason,
    status,
  };
}
