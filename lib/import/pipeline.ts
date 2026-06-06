import { createHash } from "node:crypto";
import { computePriceWithRules } from "./pricing";
import { deriveFocusKeyword } from "./focus-keyword";
import { resolveImportStockQty } from "./variant-stock";
import { trimVariants, variantTrimEnabled, variantTrimMax } from "./variant-trim";
import { generateProductContent, type ProductContent } from "./generate";
import {
  resolveQualityMode,
  aiEnabledForMode,
  isPremiumMode,
  estimatedCostOre,
  type QualityMode,
} from "./quality-mode";
import { generatePremiumContent } from "./premium-pipeline";
import { rankProductImages } from "./image-rank";
import type { FaqReviewHint } from "./faq-gen";
import { buildFallbackSeo, generateSeo, type SeoResult } from "./seo";
import { appendTabSections, buildTabSections, generateTabs, type GeneratedTabs } from "./tabs";
import {
  translateOptionColorCodes,
  translateVariantOptions,
} from "./variant-translations";
import type { AliExpressProduct, FeatureFlags, PricingOverride, PricingRules } from "./types";
import {
  addProductToCollection,
  createProduct,
  getCollections,
  linkChoiceMedia,
  type ChoiceMediaLink,
  type WixCollection,
  type WixProductInput,
  type WixVariantInput,
} from "../wix/client";
import { importMediaByUrl, importMediaUrls } from "../wix/media";
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
import { getProduct } from "../aliexpress/client";
import { enrichSwatchImagesFromApi, needsSwatchBackfill } from "./variant-images";
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
  /**
   * Initialt lagersaldo som sattes per inkluderad variant (0 = OOS). Returneras
   * så extension-popupen kan visa "Lager: N st" efter en lyckad import istället
   * för den gamla "Lager: okänt"-badgen (bug 2026-06-01).
   */
  stockQuantity: number;
  /** Unika shipFrom-koder (t.ex. ["ES","CN"]). */
  shipsFromCountries: string[];
  /** True om någon variant skickas från EU-lager. */
  hasEuWarehouse: boolean;
  /** "EU" | "CN" | "MIXED" | "UNKNOWN" — för Wix custom-field / ribbon. */
  warehouseClass: WarehouseClass;
  /**
   * Sätts om Wix gav DUPLICATE_SLUG_ERROR och vi lade på ett suffix (-2..-10 / -xxxx).
   * /admin/queue använder detta för att visa "Slug auto-justerad"-badge.
   */
  slugSuffix?: string;
  /**
   * True när produkten skapades RÅ (AI_ENRICHMENT_ENABLED=false / flags.enableAI=false):
   * ingen Claude-text/kategori/bild-ranking kördes. Produkten är då draft och
   * väntar på manuell polering via /admin/queue → "Be Claude i chatten att polera".
   */
  needsAiPolish?: boolean;
  /** Vilket AI-kvalitetsläge importen kördes i (raw/standard/premium). */
  qualityMode: QualityMode;
  /**
   * Premium-läget: kvalitets-judgens slutbetyg 1–10. Saknas i raw/standard.
   */
  qualityScore?: number;
  /**
   * Premium-läget: judgen nådde inte tröskeln (9,5) ens efter en extra
   * förfiningsrunda → produkten publiceras INTE utan flaggas för manuell polering
   * (men är ändå rikare än standard). /admin/queue visar detta.
   */
  needsManualPolish?: boolean;
}

/** Stabil SKU per leverantörsvariant — används senare för lager-/orderkoppling. */
export function makeSku(supplierProductId: string, supplierVariantId: string): string {
  const raw = `AE-${supplierProductId}-${supplierVariantId}`;
  // Wix SKU har MAX_LENGTH 40. Sedan vi adopterar AliExpress DS-skuId som
  // supplierVariantId (för dagliga synken) kan det vara en lång prop-path
  // ("14:29;200007763:201336104;…", upp till 60 tecken) → create-product 400
  // (bug 2026-06-04). När den naturliga SKU:n överstiger 40 hashar vi den till
  // en kort, deterministisk, unik form. Mappningens supplierVariantId behåller
  // det FULLA id:t — bara Wix-SKU-strängen kortas (den parsas aldrig tillbaka;
  // fulfillment går via mappningen).
  if (raw.length <= 40) return raw;
  const hash = createHash("sha1").update(raw).digest("hex").slice(0, 24);
  return `AE-${hash}`; // 3 + 24 = 27 tecken, alltid ≤ 40, unikt per variant
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
  rules: PricingRules,
  colorCodes?: OptionColorCodes,
  flags?: FeatureFlags,
  /**
   * Förgenererat innehåll (SEO + kategori + flikar). Sätts av Batch API-flödet
   * (#8): bakgrundsjobbet har redan kört den sammanslagna genereringen via
   * Message Batches och injicerar resultatet här så att importen INTE gör ett
   * nytt Claude-textanrop. Saknas = generera normalt (direkt/legacy).
   */
  preGenerated?: ProductContent,
  /**
   * Premium-läget (komponent 4): skrapade AliExpress-recensioner som FAQ-genereringen
   * läser för att hitta vad kunder faktiskt undrar. Best-effort — saknas = FAQ byggs
   * ändå ur beskrivning + kategori. Påverkar bara premium-flödet.
   */
  premiumOpts?: { reviews?: FaqReviewHint[] },
  /**
   * Per-import-prisoverride (extension-dropdownen "Marginal-tier" → Premium/Custom).
   * Vinner över default-/kategori-/intervallregeln för JUST den här importen
   * (se computePriceWithRules). Saknas = normal prissättning via `rules`.
   */
  pricingOverride?: PricingOverride,
): Promise<ImportResult> {
  // Deterministisk svensk översättning av variantaxlar + värden (INGA AI-anrop,
  // $0). Görs i ETT pass över varianterna så att Wix-options OCH variantval blir
  // identiskt översatta (Wix matchar dem på exakt sträng). Färgkods-tabellen
  // remappas till samma översatta nycklar så swatch-uppslaget i deriveOptions
  // fortsätter träffa. Okända axlar/värden faller tillbaka på råvärdet.
  const variants = product.variants.map((v) => ({
    ...v,
    options: translateVariantOptions(v.options),
  }));
  const translatedColorCodes = colorCodes ? translateOptionColorCodes(colorCodes) : undefined;
  // Variantbild-backfill (bug "kepsen" 2026-06-06): när skrapan inte fångade NÅGON
  // per-färg-bild (lazy-load/annan DOM) får produkten text-val utan bild. Hämta då
  // bilderna från DS-produkt-API:t (sku_image), matchat på SKU-id, med skrapans råa
  // namn. Hoppar API-anropet helt när skrapan redan gav swatch-bilder → ingen extra
  // kostnad/regression. Best-effort — fäller aldrig importen.
  let effectiveSwatchImages = product.swatchImages;
  if (variantImageBackfillEnabled() && needsSwatchBackfill(product)) {
    const backfilled = await enrichSwatchImagesFromApi(product, { getProduct });
    const axis = Object.keys(backfilled)[0];
    if (axis) {
      // needsSwatchBackfill garanterar att skrapan gav noll swatchar här, så
      // backfilled ÄR hela kartan (ingen merge att göra).
      effectiveSwatchImages = backfilled;
      console.log(
        `[import:variant-images] pid=${product.supplierProductId} backfill via DS-API: ` +
          `axel "${axis}", ${Object.keys(backfilled[axis]).length} färgbilder (skrapan gav inga).`,
      );
    } else {
      console.log(
        `[import:variant-images] pid=${product.supplierProductId} skrapan gav inga swatch-bilder ` +
          `och DS-API:t gav inga per-SKU-bilder att koppla.`,
      );
    }
  }
  // Per-val bild-URL:er översätts till samma svenska axel-/val-nycklar som
  // varianterna (translateOptionColorCodes har exakt rätt shape) så att de matchar
  // de härledda Wix-optionsvalen vid kopplingen nedan.
  const translatedSwatchImages = effectiveSwatchImages
    ? translateOptionColorCodes(effectiveSwatchImages)
    : undefined;

  const included = variants.filter((v) => v.included);
  if (included.length === 0) {
    throw new Error("Inga varianter valda för import.");
  }

  // Variant pre-trim (Feature 3, 2026-06-02): produkter med fler än maxCount (8)
  // valda varianter trimmas till topp-N (sälj-/lager-rankade, minst 1 per färg)
  // för en renare PDP. De bortvalda RADERAS inte — de demoteras till
  // included:false så att Wix får hela variantuppsättningen men bara visar topp-N
  // (samma mönster som manuellt avbockade). Deterministiskt, inga AI-anrop.
  // Stäng av med IMPORT_VARIANT_TRIM=false. Loggas i audit efter create.
  let variantTrimSummary: string | null = null;
  if (variantTrimEnabled() && included.length > variantTrimMax()) {
    const { kept, removed, summary } = trimVariants(included, variantTrimMax());
    if (removed.length > 0) {
      const keptIds = new Set(kept.map((k) => k.supplierVariantId));
      for (const v of variants) {
        if (v.included && !keptIds.has(v.supplierVariantId)) v.included = false;
      }
      variantTrimSummary = summary;
      console.log(`[import:variant-trim] pid=${product.supplierProductId} ${summary}`);
    }
  }

  // AI-kvalitetsläge (lib/import/quality-mode.ts): raw / standard / premium.
  //   raw      → 0 Claude-anrop ($0), draft, väntar på manuell polering.
  //   standard → batchat Haiku ($0,105), draft.
  //   premium  → Opus multi-pass + Sonnet vision (~0,85 kr), publiceras direkt.
  const qualityMode = resolveQualityMode(flags);
  const aiEnabled = aiEnabledForMode(qualityMode);
  const premium = isPremiumMode(qualityMode);
  console.log(
    `[import:mode] pid=${product.supplierProductId} mode=${qualityMode} ` +
      `(~${estimatedCostOre(qualityMode)} öre/produkt)`,
  );
  if (pricingOverride) {
    console.log(
      `[import:pricing-override] pid=${product.supplierProductId} multiplier=${pricingOverride.multiplier} ` +
        `floorSek=${pricingOverride.floorSek ?? "-"} ceilingSek=${pricingOverride.ceilingSek ?? "-"} ` +
        `(åsidosätter default/kategori/intervall-tier)`,
    );
  }
  // Förgenererat batch-innehåll är AI-output — ignorera det i RÅ-läge så vi
  // garanterat skapar en rå produkt (batch-flödet körs ändå aldrig när AI är av).
  const effectivePreGenerated = aiEnabled ? preGenerated : undefined;

  // Feature-flaggor (saknas = på). translate+seo delar text-genereringen:
  // kör den om minst en är på. imageAnalysis/autoCategorize gatar sina egna steg.
  // ALLA gatas dessutom av master-switchen: aiEnabled=false → inget AI-steg körs.
  const runSeo = aiEnabled && (flags?.seo !== false || flags?.translate !== false);
  const runImageAnalysis = aiEnabled && flags?.imageAnalysis !== false;
  const runCategory = aiEnabled && flags?.autoCategorize !== false;

  // Batchat flöde (#1, 2026-06-01): när USE_BATCHED_PIPELINE är på OCH text-
  // generering är påslagen slår vi ihop SEO + kategori + flikar till ETT Claude-
  // anrop (lib/import/generate.ts) istället för tre — sänker text-kostnaden ~⅔.
  // Vision (analyzeImages) är ALLTID ett separat anrop oavsett flagga.
  const batched = useBatchedPipeline() && runSeo;

  // Bildanalysen körs parallellt med text-genereringen i båda lägena. Avstängda
  // steg ersätts med billiga lokala fallbacks (inga Claude-credits).
  // PREMIUM (komponent 3): Sonnet vision rankar + ordnar bilderna (hero→lifestyle→
  // detalj→storlek) istället för enkel ok/warn/reject-sortering. Gatas av samma
  // imageAnalysis-flagga så Leonard kan stänga av den dyra vision-rankingen.
  const usePremiumImages = premium && runImageAnalysis;
  const premiumImagesPromise = usePremiumImages ? rankProductImages(product.imageUrls) : null;
  const imageAnalysisPromise =
    !usePremiumImages && runImageAnalysis
      ? analyzeImages(product.imageUrls)
      : Promise.resolve(
          product.imageUrls.map((url) => ({ url, verdict: "ok" as const, reason: "" })),
        );
  // Kollektioner behövs för kategoriförslaget — i batchat läge skickas de in som
  // kontext i samma anrop, i legacy-läget till suggestCategoryRecord. Hämtas när
  // kategoristeget är på ELLER vi kör batchat.
  const collectionsPromise =
    runCategory || batched || premium || effectivePreGenerated ? getCollectionsSafe() : Promise.resolve([]);

  // Starta text-genereringen direkt så den kör parallellt med bildanalysen.
  // I batchat läge = ett enda generateProductContent-anrop; annars de tre gamla.
  const textGenPromise: Promise<{
    seo: SeoResult;
    categorySuggestion: CategorySuggestionRecord;
    generatedTabs: GeneratedTabs;
    /** Premium-läget: kvalitets-judgens dom (för publish-beslut + result-fält). */
    premium?: { score: number; passed: boolean };
  }> = (async () => {
    const cols = await collectionsPromise;
    // RÅ-läge (master-switch av): hoppa över ALLT Claude-innehåll. Rå titel/
    // beskrivning via buildFallbackSeo (ingen LLM), ingen kategori, och flikarna
    // byggs deterministiskt ur den råa skrapdatan (oöversatta specs/paket) — $0.
    if (!aiEnabled) {
      return {
        seo: buildFallbackSeo(product),
        categorySuggestion: emptyCategoryRecord(),
        generatedTabs: rawTabsFromProduct(product),
      };
    }
    // PREMIUM-läget: Opus multi-pass-beskrivning + FAQ + SEO-A/B + kvalitets-judge
    // (lib/import/premium-pipeline.ts). Returnerar samma ProductContent-form + en
    // kvalitetsdom som styr publish-beslutet nedan.
    if (premium) {
      const result = await generatePremiumContent(product, runCategory ? cols : [], {
        reviews: premiumOpts?.reviews,
      });
      const rec: CategorySuggestionRecord =
        runCategory && cols.length
          ? buildCategoryRecord(result.content.category, cols)
          : {
              collectionSlug: null,
              confidence: 0,
              reason: "Inga butikskollektioner tillgängliga.",
              status: "uncategorized",
            };
      console.log(
        `[import:premium] pid=${product.supplierProductId} judge=${result.quality.score.toFixed(1)}/10 ` +
          `passed=${result.quality.passed} refined=${result.refined} ` +
          `metaVarianter=${result.seoMetaVariants.length}`,
      );
      return {
        seo: result.content.seo,
        categorySuggestion: rec,
        generatedTabs: result.content.tabs,
        premium: { score: result.quality.score, passed: result.quality.passed },
      };
    }
    // Batch API-flödet (#8): innehållet är redan genererat → inget nytt Claude-anrop.
    if (effectivePreGenerated) {
      const rec: CategorySuggestionRecord =
        runCategory && cols.length
          ? buildCategoryRecord(effectivePreGenerated.category, cols)
          : {
              collectionSlug: null,
              confidence: 0,
              reason: "Inga butikskollektioner tillgängliga.",
              status: "uncategorized",
            };
      return {
        seo: effectivePreGenerated.seo,
        categorySuggestion: rec,
        generatedTabs: effectivePreGenerated.tabs,
      };
    }
    if (batched) {
      const content = await generateProductContent(product, runCategory ? cols : [], flags);
      const rec: CategorySuggestionRecord =
        runCategory && cols.length
          ? buildCategoryRecord(content.category, cols)
          : {
              collectionSlug: null,
              confidence: 0,
              reason: "Inga butikskollektioner tillgängliga.",
              status: "uncategorized",
            };
      return { seo: content.seo, categorySuggestion: rec, generatedTabs: content.tabs };
    }
    const seoLegacy = runSeo ? await generateSeo(product) : buildFallbackSeo(product);
    const rec = await suggestCategoryRecord(seoLegacy, product, cols);
    const tabs = await generateTabs({
      productId: product.supplierProductId,
      name: seoLegacy.title || product.rawTitle,
      categoryName: rec.collectionName ?? null,
      specifications: product.specifications,
      features: product.features,
      packageContents: product.packageContents,
    });
    return { seo: seoLegacy, categorySuggestion: rec, generatedTabs: tabs };
  })();

  // Bild-verdikt + ordning. Premium: Sonnet vision-rankingen ger BÅDE entries
  // (admin-vyn) och den färdiga hero→lifestyle→detalj→storlek-ordningen. Övriga
  // lägen: ok/warn/reject-sortering som förut.
  let imageVerdicts: ImageAnalysisResult[];
  let premiumOrderedUrls: string[] | null = null;
  if (premiumImagesPromise) {
    const ranked = await premiumImagesPromise;
    imageVerdicts = ranked.entries;
    premiumOrderedUrls = ranked.orderedUrls.length ? ranked.orderedUrls : product.imageUrls;
  } else {
    imageVerdicts = await imageAnalysisPromise;
  }
  const collections = await collectionsPromise;
  // Kategoriförslaget beräknas FÖRE prissättningen så per-kategori-multiplikatorn
  // kan tillämpas (Fix 5); själva Wix-tilldelningen sker efter create (kräver id).
  const { seo, categorySuggestion, generatedTabs, premium: premiumResult } = await textGenPromise;
  const categoryName = categorySuggestion.collectionName ?? null;

  // Explicit kategoriserings-trace (bug 2026-06-01: kategori sattes aldrig och vi
  // kunde inte se var det föll). Loggar varje beslutssteg så nästa miss går att
  // felsöka direkt i Vercel-loggen utan att gissa.
  console.log(
    `[import:category] pid=${product.supplierProductId} runCategory=${runCategory} ` +
      `kollektioner=${collections.length} → slug=${categorySuggestion.collectionSlug ?? "null"} ` +
      `conf=${categorySuggestion.confidence.toFixed(2)} status=${categorySuggestion.status} ` +
      `collectionId=${categorySuggestion.collectionId ?? "saknas"} reason="${categorySuggestion.reason}"`,
  );
  if (runCategory && collections.length === 0) {
    console.warn(
      "[import:category] Inga Wix-kollektioner hämtades (getCollections gav []). " +
        "Antingen saknar produkten kategori i Wix, eller så blockerade scopes/404 anropet.",
    );
  }

  // Strukturerade PDP-flikar (Tekniska specifikationer / Vanliga frågor /
  // Användning och skötsel) genererades ovan (batchat i ett anrop, eller via
  // generateTabs i legacy-läget) och fogas nu in i beskrivningen som <h2>-block
  // som storefronten splittar till flikar.
  const enrichedDescriptionHtml = appendTabSections(
    seo.descriptionHtml,
    buildTabSections(generatedTabs),
  ).html;

  // Initialt lagersaldo per variant. quantity>0 → availabilityStatus=IN_STOCK.
  // Default IN_STOCK (AE-produkter säljer aktivt); explicit OOS från skrapan → 0.
  const stockQty = product.inStock === false ? 0 : defaultStockQty();

  // Omsortera bilderna efter verdict: ok först, warn sedan, reject sist. Inga
  // bilder tas bort (se orderImagesByVerdict) — vi vill hellre ha med en bild med
  // lite text än att stå utan bilder helt.
  const orderedImageUrls = premiumOrderedUrls ?? orderImagesByVerdict(product.imageUrls, imageVerdicts);

  // Ladda upp samtliga (omsorterade) bilder till Wix Media Manager parallellt med
  // variant-/options-bygget.
  const mediaPromise = importMediaUrls(
    orderedImageUrls.map((url, i) => ({ url, displayName: `${seo.slug || "produkt"}-${i + 1}` })),
  );

  // Options härleds från ALLA varianter; avbockade varianter skapas men döljs
  // (visible: false) så att Wix får en komplett variantuppsättning.
  const options = deriveOptions(variants, translatedColorCodes);

  // Per-val bilder (linkedMedia): plocka ut de swatch-bilder vars axel+val faktiskt
  // finns bland de härledda optionsvalen, ladda upp dem till Wix Media Manager och
  // lägg dem i media-poolen (krav för linkedMedia). Kopplas till valen EFTER create
  // (lib/wix/client.ts#linkChoiceMedia) → huvudbilden byts vid färgval. Körs parallellt
  // med galleriuppladdningen. Tom/saknad swatch-data → poolUrls=[] och links=[] (no-op).
  const optionChoiceSet = new Set(
    options.flatMap((o) => o.choices.map((c) => `${o.name} ${c.name}`)),
  );
  const swatchSources: { optionName: string; choiceName: string; sourceUrl: string; altText: string }[] = [];
  if (translatedSwatchImages) {
    for (const [axis, valueMap] of Object.entries(translatedSwatchImages)) {
      for (const [value, url] of Object.entries(valueMap)) {
        if (url && optionChoiceSet.has(`${axis} ${value}`)) {
          // altText är BÅDE vettig alt-text OCH den stabila matchningsnyckeln som
          // linkChoiceMedia använder (id/URL byts vid Wix re-import). Unik per val.
          swatchSources.push({
            optionName: axis,
            choiceName: value,
            sourceUrl: url,
            altText: `${seo.title} – ${value}`,
          });
        }
      }
    }
  }
  const swatchMediaPromise = uploadSwatchMedia(swatchSources, seo.slug);

  const variantMappings: VariantMapping[] = [];
  const wixVariants: WixVariantInput[] = variants.map((v) => {
    const sku = makeSku(product.supplierProductId, v.supplierVariantId);
    const price = computePriceWithRules(v.costUsd, rules, categoryName, pricingOverride);
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
      // Lager skapas in-line via /products-with-inventory (Fix 1). Ej inkluderade
      // (visible:false) varianter får 0 så de inte felaktigt signalerar lager.
      // Verkligt AliExpress per-variant-saldo (skrapans availQuantity) när det finns,
      // annars fallback till stockQty (default 10); OOS-produkt → 0 (bug 2026-06-01).
      inventoryQuantity: v.included ? resolveImportStockQty(v.stock, stockQty, product.inStock) : 0,
      // Varukostnad (landad inköp i SEK) → Wix revenueDetails.cost (Fix 4).
      costAmount: price.costSek.toFixed(2),
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

  // Lägg variant-/swatch-bilderna SIST i poolen (huvudbilden = galleriets första,
  // inte en swatch-thumbnail). Deduppa mot galleriet på media-id så samma foto inte
  // dyker upp dubbelt. Varje swatch-item bär sin unika altText (matchningsnyckel).
  // `swatchLinks` används efter create för att koppla val→bild.
  const { poolItems: swatchPoolItems, links: swatchLinks } = await swatchMediaPromise;
  const existingMediaKeys = new Set(mediaItems.map((m) => mediaKey(m.url)));
  for (const it of swatchPoolItems) {
    const k = mediaKey(it.url);
    if (k && !existingMediaKeys.has(k)) {
      existingMediaKeys.add(k);
      mediaItems.push(it);
    }
  }

  // Aggregera warehouse-koder över alla varianter + ev. produkt-default.
  // Påverkar Wix-ribbonen och persisteras på mapping-posten för senare filterring.
  const allShipFromCodes: string[] = [];
  for (const v of variants) {
    if (v.shipFrom) allShipFromCodes.push(v.shipFrom);
  }
  if (product.shipsFrom) allShipFromCodes.push(...product.shipsFrom);
  const shipsFromCountries = uniqueShipFromCodes(allShipFromCodes);
  const hasEuWarehouse = hasAnyEuWarehouse(shipsFromCountries);
  const warehouseClass = classifyWarehouses(shipsFromCountries);

  const wixInput: WixProductInput = {
    name: seo.title,
    slug: seo.slug,
    plainDescription: enrichedDescriptionHtml,
    seo: { title: seo.title, description: seo.metaDescription },
    // Fokusord (Wix "focus keyword") härlett deterministiskt ur den översatta
    // titeln — inga AI-anrop. Sätts inline i create via seoData.settings.keywords.
    focusKeyword: deriveFocusKeyword(seo.title),
    options: options.length ? options : undefined,
    variants: wixVariants,
    mediaItems: mediaItems.length ? mediaItems : undefined,
    // EU-lager-produkter får ett ribbon i Wix (visas på produktkort). Vi
    // använder ribbon istället för custom-fält + product tags eftersom Wix V3
    // har inbyggt stöd och det renderas både i back-end och på sajten utan
    // extra Velo-kod. Headless-repots produktkort läser samma fält.
    ribbonName: hasEuWarehouse ? "EU-lager" : undefined,
    // Synlighet per läge:
    //   PREMIUM   → publiceras DIREKT (visible:true) om kvalitets-judgen godkände
    //               (≥9,5). Underkänd premium → draft + needs_manual_polish.
    //   STANDARD  → draft som förut; IMPORT_DRAFT_DEFAULT=false hoppar granskningen.
    //   RAW       → ALLTID draft (aiEnabled=false): kräver manuell polering först.
    visible: premium
      ? premiumResult?.passed === true
      : aiEnabled && process.env.IMPORT_DRAFT_DEFAULT === "false",
  };

  const created = await createProduct(wixInput);

  // Koppla Wix-tilldelade variant-id:n till våra mappningar via SKU.
  const skuToWixId = new Map(created.variants.map((v) => [v.sku, v.id]));
  for (const m of variantMappings) {
    m.wixVariantId = skuToWixId.get(m.sku);
  }

  // --- Per-val bild (linkedMedia) ------------------------------------------
  // Koppla varje färg-/variantval till sin bild så att huvudbilden byts när
  // kunden väljer t.ex. "Blå" på produktsidan. Måste ske EFTER create (bilderna
  // ingest:as asynkront till media-poolen). Fail-open inuti linkChoiceMedia —
  // kopplingen får aldrig fälla importen. Loggas i audit för spårbarhet.
  if (swatchLinks.length > 0) {
    const linkedCount = await linkChoiceMedia(created.id, swatchLinks);
    await audit(
      "import-variant-media",
      created.id,
      `${linkedCount}/${swatchLinks.length} val kopplade till variantbild (linkedMedia)`,
    );
  }

  // --- Initialt lagersaldo (bug 2026-05-31, slutgiltig fix) ----------------
  // Lagerposterna skapas nu IN-LINE i createProduct (/products-with-inventory)
  // med quantity=stockQty per inkluderad variant. Tidigare separata query→update
  // no-op:ade eftersom Wix INTE skapar lagerposter vid vanlig create — det var
  // därför produkterna fortsatte visas "Slut i lager". Här loggar vi bara utfallet.
  const includedCount = variants.filter((v) => v.included).length;
  await audit(
    "import-initial-stock",
    created.id,
    `${product.inStock === false ? "OOS" : "IN_STOCK"} qty=${stockQty} på ${includedCount} variant(er) (in-line via products-with-inventory)`,
  );

  // Variant pre-trim-utfall (Feature 3) → audit (FyndplatsAudit) så vi i efterhand
  // kan analysera om vi trimmade bort något viktigt. Best-effort, fäller aldrig importen.
  if (variantTrimSummary) {
    await audit("variant-trim", created.id, variantTrimSummary);
  }

  // RÅ import (master-switch av) → audit + log så det syns i Vercel/-admin att
  // produkten medvetet skapades utan AI-berikning och väntar på manuell polering.
  if (!aiEnabled) {
    console.log(
      `[import:raw] pid=${product.supplierProductId} → ${created.id} skapad RÅ (0 Claude-anrop), draft + needs_ai_polish.`,
    );
    await audit("import-raw-no-ai", created.id, `Rå import (AI-berikning av) — ${seo.title}`);
  }

  // PREMIUM → audit kvalitetsdomen så Leonard ser betyget och om produkten
  // publicerades direkt eller flaggades för manuell polering.
  if (premium && premiumResult) {
    const verdict = premiumResult.passed
      ? `publicerad direkt (judge ${premiumResult.score.toFixed(1)}/10)`
      : `flaggad för manuell polering (judge ${premiumResult.score.toFixed(1)}/10 < tröskel)`;
    await audit("import-premium", created.id, `${verdict} — ${seo.title}`);
  }

  // Auto-assign kategorin (beräknad före prissättningen ovan). Tilldelningen sker
  // här eftersom den kräver det persisterade productId:t. Ett retry-försök vid fel.
  if (categorySuggestion.status === "auto" && categorySuggestion.collectionId) {
    console.log(
      `[import:category] tilldelar produkt ${created.id} → kollektion ` +
        `${categorySuggestion.collectionSlug} (${categorySuggestion.collectionId})`,
    );
    try {
      await assignCollectionWithRetry(created.id, categorySuggestion.collectionId);
      console.log(`[import:category] ✓ tilldelning OK för ${created.id}`);
      await audit(
        "category-auto-assign",
        created.id,
        `${categorySuggestion.collectionSlug} (conf=${categorySuggestion.confidence.toFixed(2)})`,
      );
    } catch (err) {
      // Demotera till "suggested" om Wix-anropet failade — Leonard kan
      // klicka in den manuellt från kö-UI:t. Logga den FAKTISKA Wix-feltexten
      // (tidigare gömdes den helt i audit) så orsaken syns i Vercel-loggen.
      categorySuggestion.status = "suggested";
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `[import:category] ✗ Wix add-to-collection FAILADE för ${created.id} ` +
          `(kollektion ${categorySuggestion.collectionId}): ${errMsg}`,
      );
      await audit(
        "category-auto-assign-failed",
        created.id,
        errMsg.slice(0, 200),
      );
    }
  } else if (categorySuggestion.collectionSlug) {
    // Vi hade ett förslag men det nådde inte auto-tröskeln (status "suggested"/
    // "uncategorized") → ingen kategori sätts. Logga varför så det inte ser ut
    // som en bugg när Leonard ser en okategoriserad produkt.
    console.log(
      `[import:category] INGEN auto-tilldelning för ${created.id}: status=` +
        `${categorySuggestion.status} (conf=${categorySuggestion.confidence.toFixed(2)}, ` +
        `tröskel auto≥0.6). Förslag "${categorySuggestion.collectionSlug}" lämnas som ${categorySuggestion.status}.`,
    );
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

  // Logga slug-kollision i audit så Leonard kan spåra varför ett produkt-URL
  // skiljer sig från seo.slug. createProduct loggar redan console.warn — detta
  // gör det synligt i /admin/audit också.
  if (created.slugSuffix) {
    await audit(
      "slug-collision",
      created.id,
      `${seo.slug} -> ${created.slug} (suffix: ${created.slugSuffix})`,
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
    stockQuantity: stockQty,
    shipsFromCountries,
    hasEuWarehouse,
    warehouseClass,
    ...(created.slugSuffix ? { slugSuffix: created.slugSuffix } : {}),
    ...(aiEnabled ? {} : { needsAiPolish: true }),
    qualityMode,
    ...(premium && premiumResult ? { qualityScore: premiumResult.score } : {}),
    ...(premium && premiumResult && !premiumResult.passed ? { needsManualPolish: true } : {}),
  };
}

// --- Helpers ---------------------------------------------------------------

/** Tomt kategorirecord för RÅ-läge (ingen AI-kategorisering kördes). */
function emptyCategoryRecord(): CategorySuggestionRecord {
  return {
    collectionSlug: null,
    confidence: 0,
    reason: "AI-berikning avstängd (rå import) — sätt kategori manuellt eller polera via chatten.",
    status: "uncategorized",
  };
}

/**
 * Bygger PDP-flikar deterministiskt ur den RÅA skrapdatan (inga Claude-anrop):
 * oöversatta specs + paketinnehåll. FAQ/skötsel kräver AI och lämnas tomma.
 * Används i RÅ-läge (AI_ENRICHMENT_ENABLED=false) så spec-fliken ändå byggs.
 */
function rawTabsFromProduct(product: AliExpressProduct): GeneratedTabs {
  return {
    specs: Object.entries(product.specifications || {}).map(([label, value]) => ({ label, value })),
    packageContents: product.packageContents || [],
    faq: [],
    careHtml: null,
  };
}

/** Wixstatic-media-id ur en URL (delen efter /media/) — för dedup mot galleriet. */
function mediaKey(url: string): string {
  const m = (url || "").match(/\/media\/([^/?]+)/);
  return m ? m[1] : url || "";
}

/**
 * Laddar upp swatch-/variantbilder till Wix Media Manager och bygger kopplingarna
 * val→bild. Dedupar käll-URL:er (samma foto kan delas mellan val). Misslyckade
 * uppladdningar hoppas tyst över (importen ska aldrig falla på en variantbild).
 * Returnerar poolUrls (wixstatic-URL:er att lägga i media-poolen, krav för
 * linkedMedia) + links (val→bild, används av linkChoiceMedia efter create).
 */
async function uploadSwatchMedia(
  sources: { optionName: string; choiceName: string; sourceUrl: string; altText: string }[],
  slug: string,
): Promise<{ poolItems: { url: string; altText: string }[]; links: ChoiceMediaLink[] }> {
  if (sources.length === 0) return { poolItems: [], links: [] };
  const uniqueSources = [...new Set(sources.map((s) => s.sourceUrl))];
  const results = await Promise.allSettled(
    uniqueSources.map((url, i) => importMediaByUrl(url, `${slug || "produkt"}-variant-${i + 1}`)),
  );
  const wixBySource = new Map<string, string>();
  uniqueSources.forEach((src, i) => {
    const r = results[i];
    if (r.status === "fulfilled") wixBySource.set(src, r.value.url);
  });
  const poolItems: { url: string; altText: string }[] = [];
  const seenUrls = new Set<string>();
  const links: ChoiceMediaLink[] = [];
  for (const s of sources) {
    const wix = wixBySource.get(s.sourceUrl);
    if (!wix) continue;
    links.push({ optionName: s.optionName, choiceName: s.choiceName, altText: s.altText });
    if (!seenUrls.has(wix)) {
      seenUrls.add(wix);
      poolItems.push({ url: wix, altText: s.altText });
    }
  }
  return { poolItems, links };
}

/** Placeholder-saldo för en in-stock-produkt. Override: IMPORT_DEFAULT_STOCK_QTY. */
function defaultStockQty(): number {
  const n = Number(process.env.IMPORT_DEFAULT_STOCK_QTY);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 10;
}

/**
 * Lägger produkten i en kollektion med ett retry-försök. Direkt efter create kan
 * V3-katalogen vara någon hundradels sekund efter sig (eventual consistency) →
 * ett snabbt omtag undviker att ett tillfälligt 404/409 demoterar kategorin till
 * "suggested" i onödan.
 */
async function assignCollectionWithRetry(productId: string, collectionId: string): Promise<void> {
  try {
    await addProductToCollection(productId, collectionId);
  } catch (err) {
    await new Promise((r) => setTimeout(r, 400));
    await addProductToCollection(productId, collectionId);
    void err;
  }
}

/**
 * Returnerar bild-URL:er omsorterade efter verdict: ok först, warns sedan,
 * rejects SIST. Bevarar ursprunglig ordning inom varje grupp.
 *
 * VIKTIGT (bug 2026-05-31): rejects tas INTE bort längre. Tidigare slängdes de,
 * vilket i kombination med en för sträng vision-prompt gav produkter med NOLL
 * bilder (alla AE-bilder flaggades pga dekorativ text/rea-badge). Nu behåller vi
 * alltid alla bilder och demoterar bara de sämsta sist — "hellre någon bild än
 * ingen". Den lättade prompten (se IMAGE_SYSTEM) gör dessutom att äkta rejects
 * blir sällsynta. Safety-cap: även om HELA uppsättningen flaggas som reject
 * behåller vi dem (de hamnar bara sist) → galleriet blir aldrig tomt.
 */
export function orderImagesByVerdict(
  urls: string[],
  verdicts: ImageAnalysisResult[],
): string[] {
  const verdictByUrl = new Map(verdicts.map((v) => [v.url, v.verdict]));
  const ok: string[] = [];
  const warn: string[] = [];
  const reject: string[] = [];
  for (const url of urls) {
    const v = verdictByUrl.get(url);
    if (v === "reject") reject.push(url);
    else if (v === "warn") warn.push(url);
    else ok.push(url); // "ok" + okänd (fail-open)
  }
  return [...ok, ...warn, ...reject];
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

/**
 * Wrap getCollections så ett fel inte fäller hela importen. Returnerar de FULLA
 * kollektionerna (inkl. id) så categorISeringen kan slå upp id:t utan ett andra
 * nätverksanrop (tidigare gjordes en redundant getCollections() som var en extra
 * felpunkt → kategorin demoterades ibland i onödan).
 */
async function getCollectionsSafe(): Promise<WixCollection[]> {
  try {
    return await getCollections();
  } catch (err) {
    console.warn(
      "[import] getCollections failed, hoppar över kategorisering:",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

/**
 * Översätter Claudes suggestion till en CategorySuggestionRecord — inkl. att slå
 * upp Wix collection-id för auto-assign ur den redan hämtade kollektionslistan.
 */
async function suggestCategoryRecord(
  seo: SeoResult,
  product: AliExpressProduct,
  collections: WixCollection[],
): Promise<CategorySuggestionRecord> {
  if (collections.length === 0) {
    return {
      collectionSlug: null,
      confidence: 0,
      reason: "Inga butikskollektioner tillgängliga.",
      status: "uncategorized",
    };
  }

  const options: CollectionOption[] = collections.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
  }));
  const suggestion: CategorySuggestion = await suggestCategory(
    seo.title,
    seo.descriptionHtml || product.rawDescription,
    options,
  );
  return buildCategoryRecord(suggestion, collections);
}

/**
 * Bygger en CategorySuggestionRecord ur en CategorySuggestion: slår upp Wix
 * collection-id/-namn ur den redan hämtade listan och avgör auto/suggested/
 * uncategorized-status. Delas av legacy-flödet (suggestCategoryRecord) och det
 * batchade flödet (där kategorin kommer ur det sammanslagna generateProductContent).
 */
export function buildCategoryRecord(
  suggestion: CategorySuggestion,
  collections: WixCollection[],
): CategorySuggestionRecord {
  if (!suggestion.collectionSlug) {
    return {
      collectionSlug: null,
      confidence: suggestion.confidence,
      reason: suggestion.reason || "Claude kunde inte hitta en tydlig kategori.",
      status: "uncategorized",
    };
  }

  // Slå upp Wix-id + namn för slug:en ur den redan hämtade listan (inget extra anrop).
  const match = collections.find((c) => c.slug === suggestion.collectionSlug);
  const collectionId = match?.id;
  const collectionName = match?.name ?? suggestion.collectionSlug;

  // Auto-assign-tröskel sänkt 0.7 → 0.6: Haiku-kategoriseraren landar ofta i
  // 0.6–0.7-bandet ("tydlig men inte glasklar match") och produkterna fastnade då
  // som "suggested" utan att faktiskt få en kategori satt (Fix 2). 0.6 = tydlig match.
  let status: CategorySuggestionRecord["status"];
  if (suggestion.confidence >= 0.6 && collectionId) status = "auto";
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

/**
 * Batchat text-flöde (#1, 2026-06-01): slår ihop SEO + kategori + flikar till ETT
 * Claude-anrop. Default PÅ; sätt USE_BATCHED_PIPELINE=false för att falla tillbaka
 * på de tre separata anropen (legacy). Flaggan rullas ut först efter att A/B-testet
 * passerat.
 */
export function useBatchedPipeline(): boolean {
  return (process.env.USE_BATCHED_PIPELINE ?? "true").toLowerCase() !== "false";
}

/**
 * Variantbild-backfill från DS-API:t när skrapan inte gav per-färg-bilder. Default
 * PÅ. Sätt IMPORT_VARIANT_IMAGE_BACKFILL=false för att stänga av (då förlitar sig
 * importen enbart på skrapans swatch-bilder, som tidigare). Backfillen gör ett
 * getProduct-anrop ENDAST när skrapan gav noll swatch-bilder.
 */
export function variantImageBackfillEnabled(): boolean {
  return (process.env.IMPORT_VARIANT_IMAGE_BACKFILL ?? "true").toLowerCase() !== "false";
}

/**
 * Master-switch för AI-berikning i import-pipelinen. Default PÅ. Sätt
 * AI_ENRICHMENT_ENABLED=false i miljön för att importera RÅ AliExpress-data utan
 * ETT ENDA Claude-anrop ($0 Anthropic): rå titel/beskrivning (deterministisk
 * variant-översättning körs ändå — den är gratis), ingen SEO/kategori/bild-
 * ranking/flikar. Produkten skapas som draft och hamnar i /admin/queue för
 * manuell polering via chatten.
 *
 * Ett explicit flags.enableAI vinner ALLTID över env-flaggan: en admin
 * "kör AI-batch"-knapp kan tvinga PÅ (enableAI:true) även om env stängt av den,
 * och en bulk-task kan tvinga AV (enableAI:false). Flaggan är default men inte hård.
 */
export function aiEnrichmentEnabled(flags?: FeatureFlags): boolean {
  // Delegerar nu till det enhetliga kvalitetsläget (raw/standard/premium):
  // aiEnabled = läget är inte "raw". Bakåtkompatibelt med enableAI + AI_ENRICHMENT_ENABLED.
  return aiEnabledForMode(resolveQualityMode(flags));
}
