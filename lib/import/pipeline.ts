import { createHash } from "node:crypto";
import { computePriceWithRules } from "./pricing";
import { deriveFocusKeyword } from "./focus-keyword";
import { resolveImportStockQty } from "./variant-stock";
import { trimVariants, variantTrimEnabled, variantTrimMax } from "./variant-trim";
import { capOptionsAndVariants } from "./variant-cap";
import { splitConstantAxes, mergeConstantAxisSpecs } from "./constant-axes";
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
import { buildTranslatorFromBase, translateValue, unresolvedAxisNames } from "./variant-translations";
import { buildVariantTranslatorAI, colorGateFlags, variantAiTranslationEnabled } from "./variant-ai-translate";
import {
  dsPriceReconcileEnabled,
  needsDsPriceReconcile,
  reconcileVariantsWithDs,
} from "./variant-reconcile";
import { sanitizeVariantOptions } from "./variant-sanitize";
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
import {
  descriptionBackfillEnabled,
  needsDescriptionBackfill,
  sanitizeDescriptionHtml,
  descriptionToText,
  isMoreInformative,
} from "./description";
import { matchesColorName, isColorAxis } from "./color-match";
import { sortedSizeChoices } from "./variant-sort";
import { buildVariantSkus } from "./sku";
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
  /**
   * false = AliExpress fraktAPI säger att SKU:n SAKNAR fraktväg till Sverige
   * (kan ha lager men kassan vägrar — SucceBuy-fallet 2026-07-13). Synken
   * tvingar då Wix-lagret till 0 för varianten och /admin/queue varnar.
   * true/saknas = fraktbar eller ännu inte kontrollerad.
   */
  shippableToSe?: boolean;
  /** ISO-tid för senaste fraktbarhetskontrollen (styr omkontroll-intervall). */
  shippabilityCheckedAt?: string;
  /**
   * true = verdiktet är satt MANUELLT av en människa som kontrollerat
   * leverantörens produktsida ("This product can't be shipped to your address"),
   * inte av frakt-API:t.
   *
   * Varför skillnaden finns (Leonards rapport 2026-08-16): den automatiska
   * kontrollen är avstängd sedan kod röd 2026-07-14 — den nollade 8 SÄLJBARA
   * produkter på en natt, så `SYNC_SHIPPABILITY_ENFORCE` står av och alla
   * `shippableToSe:false` är inerta. Men då finns ingen väg alls att stoppa en
   * vara vi VET inte går att skicka: sparkbilen (SucceBuy, samma säljare som
   * fallet 2026-07-13) låg kvar med ~60 i lager, såldes, och fick återbetalas.
   *
   * Ett manuellt verdikt är inte samma sak som ett opålitligt API-nej och
   * behöver därför inte vänta på att kontrollen v2 bevisas. Det tvingar lagret
   * till 0 vid varje spegling OAVSETT env-flaggan — men bara för den variant
   * någon faktiskt tittat på.
   */
  shippabilityManual?: boolean;
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
  /**
   * Råvärden/axelnamn som förblev (halv-)engelska efter tabell+cache+AI — grunden
   * för variantdelen av needsAiPolish. Propageras till mappningen så /admin/queue
   * kan visa VILKA värden som är kvar-engelska (de är key-låsta i Wix V3 → kräver
   * omimport, inte polering).
   */
  unresolvedVariantValues?: string[];
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

/**
 * Ska avbockade varianter (included:false) ändå följa med till Wix som dolda?
 * Default NEJ (Leonards beslut 2026-07-02): ett avbockat val importeras inte alls.
 * Tidigare skapades de dolda (visible:false) "för komplett variantuppsättning",
 * men de saknar leverantörsmappning (kan aldrig fulfillas om de slås på), räknas
 * mot Wix hårda gränser (≤100 val/option, ≤1000 varianter) och fyller butikens
 * DELADE customization-listor mot 100-taket (se lib/wix/customization-identity.ts)
 * — ren dödvikt. Legacy-beteendet återställs med IMPORT_KEEP_DESELECTED_VARIANTS=true.
 */
export function keepDeselectedVariants(): boolean {
  return (process.env.IMPORT_KEEP_DESELECTED_VARIANTS ?? "false").toLowerCase() === "true";
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
  return [...map.entries()].map(([name, set]) => {
    let values = [...set];
    // Bara en ÄKTA färgaxel får bli färg-swatch. AE-säljare lägger ofta storlekar/
    // volymer/modeller/kontakttyper under "Color"-fältet (med bilder) → de samplas
    // till nästan identiska gråa colorCodes och skulle annars publiceras som
    // meningslösa gråa swatchar döpta "Färg". Är värdena inte färger → släpp
    // colorCodes (optionen blir TEXT; per-val-bilderna behålls ändå via linkedMedia).
    const codes = colorCodes?.[name];
    const keepColors = !!codes && isColorAxis(values);
    // Storleks-sortering minsta→största (Leonard 2026-06-15). BARA icke-färgaxlar
    // (färgordning är estetisk). sortedSizeChoices returnerar null när ordningen
    // inte säkert kan avgöras → axeln behålls orörd. Påverkar ENBART
    // visningsordningen i options-listan; variantposterna (pris/SKU/lager/
    // linkedMedia) matchas på värde, inte ordning, och är orörda. try/catch:
    // sorteringen får ALDRIG fälla en import (Leonards krav) — oväntat fel →
    // behåll originalordningen.
    if (!isColorAxis(values)) {
      try {
        const sorted = sortedSizeChoices(values, name);
        if (sorted) values = sorted;
      } catch {
        /* behåll originalordningen */
      }
    }
    return {
      name,
      choices: values.map((choiceName) => ({
        name: choiceName,
        colorCode: keepColors ? codes?.[choiceName] : undefined,
      })),
    };
  });
}

/**
 * Kör hela import-flödet för en produkt:
 * SEO-optimering → prissättning (inkl. moms) per inkluderad variant → skapa i Wix.
 * Endast varianter med `included: true` importeras (variant-filter från popupen).
 * Avbockade varianter utelämnas HELT ur Wix-payloaden (options härleds bara ur de
 * valda; en axel som därmed får ett enda värde blir spec-rad i st.f. död väljare).
 * Legacy-beteendet — skapa avbockade som dolda — finns bakom
 * IMPORT_KEEP_DESELECTED_VARIANTS=true (se keepDeselectedVariants).
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
  // Kollisions-säker översättare byggd EN gång per produkt: distinkta råvärden som
  // annars skulle översättas till SAMMA svenska sträng (dark/deep blue → "Mörkblå",
  // navy/navy blue → "Marinblå") hålls åtskilda så att varianterna inte kollapsar
  // till en choice (deriveOptions Set) → tappad variant/mappning. SAMMA karta
  // används för colorCodes + swatch-bilder nedan så alla nycklar matchar exakt.
  // AI-fallback (default på; egen switch via VARIANT_AI_TRANSLATION_ENABLED /
  // flags.translateVariants): Haiku fyller i de variantvärden som den statiska
  // tabellen missar — tabell+cache först, så nära $0. Av → ren synkron tabell
  // ($0). Kvarvarande engelska (olösta värden) flaggar needsAiPolish nedan så de
  // hamnar i poleringskön i stället för att nå kunden halv-engelska.
  // Avbockade varianter importeras INTE alls (default, 2026-07-02): de filtreras
  // bort redan FÖRE översättningen — så AI-fallbacken aldrig betalar för värden
  // som ändå inte når butiken, och så options/cap/create nedan bara ser de valda.
  // Legacy (skapa avbockade som dolda): IMPORT_KEEP_DESELECTED_VARIANTS=true.
  let sourceVariants = keepDeselectedVariants()
    ? product.variants
    : product.variants.filter((v) => v.included);
  if (sourceVariants.filter((v) => v.included).length === 0) {
    throw new Error("Inga varianter valda för import.");
  }
  // SANERING FÖRST (VEVOR-pumpen 2026-08-08): en axel med tomma värden (skrapan
  // kunde inte läsa etiketterna, t.ex. bild-swatchar utan text) nådde Wix orört
  // → 400 "choices[].name has size 0" och hela importen föll. Axlar med tomma
  // värden tas bort helt (Wix kräver alla options på alla varianter) och
  // varianter som därmed blir identiska slås ihop. Körs FÖRE prisavstämningen
  // så dess värdesignatur-matchning aldrig ser tomma värden.
  const clean = sanitizeVariantOptions(sourceVariants);
  if (clean.removedAxes.length > 0) {
    sourceVariants = clean.variants;
    product.variants = clean.variants; // spegel — samma skäl som prisavstämningen
    console.log(
      `[import:sanitize] pid=${product.supplierProductId} tog bort axlar med tomma värden ` +
        `(${clean.removedAxes.map((a) => JSON.stringify(a)).join(", ")}); ` +
        `${clean.mergedDuplicates} dubblettvarianter sammanslagna.`,
    );
  }
  // Memoiserat DS-anrop: prisavstämningen, variantbild- OCH beskrivnings-
  // backfillen kan alla behöva DS-produkten — då hämtas den bara EN gång.
  let dsProductPromise: ReturnType<typeof getProduct> | undefined;
  const getProductOnce = (id: string) => (dsProductPromise ??= getProduct(id));

  // DS-PRISAVSTÄMNING (Leonards fynd 2026-08-07): DOM-fallbacken i skrapan
  // sätter sidans synliga pris på ALLA varianter (dom-N-id:n) — dyrare
  // varianter blir underprisade, mappningen saknar riktiga skuId:n och
  // kartesiska spökvarianter kan uppstå. Stäm av mot DS-API:t (facit) INNAN
  // översättning/prissättning. Konservativ (<50 % match → orört) och
  // fail-open — ett API-fel får aldrig fälla importen; då gäller skrapans
  // data precis som innan, och unifoma priser flaggas enbart i loggen.
  if (
    dsPriceReconcileEnabled() &&
    needsDsPriceReconcile(sourceVariants) &&
    /^\d{6,}$/.test(String(product.supplierProductId || ""))
  ) {
    try {
      const ds = await getProductOnce(product.supplierProductId);
      const rec = reconcileVariantsWithDs(sourceVariants, ds.variants ?? []);
      if (!rec.aborted) {
        sourceVariants = rec.variants;
        // Spegla även på product.variants (audit 2026-08-08): variantbild-
        // backfillen (enrichSwatchImagesFromApi) matchar DS sku_image på
        // product.variants[].supplierVariantId — utan spegeln ser den kvar de
        // syntetiska dom-id:na och missar per-variant-bilderna för exakt de
        // produkter som behövde räddningen.
        product.variants = rec.variants;
        console.log(
          `[import:price-reconcile] pid=${product.supplierProductId} DS-avstämning: ` +
            `${rec.matched} matchade, ${rec.pricesCorrected} priser korrigerade, ` +
            `${rec.idsRepaired} id reparerade, ${rec.ghostsDropped} spökvarianter borttagna.`,
        );
      } else {
        console.warn(
          `[import:price-reconcile] pid=${product.supplierProductId} avstämning AVBRUTEN ` +
            `(för osäker matchning) — skrapade varianter används orörda. KONTROLLERA PRISERNA.`,
        );
      }
    } catch (err) {
      console.warn(
        `[import:price-reconcile] pid=${product.supplierProductId} DS-uppslag misslyckades: ` +
          `${err instanceof Error ? err.message.slice(0, 160) : String(err)} — skrapade priser används.`,
      );
    }
  }
  // LAGER 0 — manuella variantnamn från importverktyget (variantNameOverrides):
  // Leonard kan döpa värden själv FÖRE importen (enda tillfället — Wix V3
  // key-låser namnet vid skapandet). Kartan filtreras mot de faktiska råvärdena
  // så en förlegad/felskickad nyckel aldrig gör något, och trimmas/cappas med
  // samma 60-teckensgräns som API-schemat. Manuella namn vinner över tabell,
  // cache och AI i BÅDA lägena nedan.
  const manualNames = new Map<string, string>();
  if (product.variantNameOverrides) {
    const rawVals = new Set<string>();
    for (const v of sourceVariants) for (const val of Object.values(v.options ?? {})) rawVals.add(val);
    for (const [raw, name] of Object.entries(product.variantNameOverrides)) {
      const trimmed = typeof name === "string" ? name.trim().slice(0, 60) : "";
      if (trimmed && rawVals.has(raw)) manualNames.set(raw, trimmed);
    }
  }
  // Samma lager 0 för AXELNAMN (axisNameOverrides): filtreras mot produktens
  // faktiska rå-axlar så en förlegad nyckel aldrig gör något.
  const manualAxisNames = new Map<string, string>();
  if (product.axisNameOverrides) {
    const rawAxes = new Set<string>();
    for (const v of sourceVariants) for (const axis of Object.keys(v.options ?? {})) rawAxes.add(axis);
    for (const [raw, name] of Object.entries(product.axisNameOverrides)) {
      const trimmed = typeof name === "string" ? name.trim().slice(0, 60) : "";
      if (trimmed && rawAxes.has(raw)) manualAxisNames.set(raw, trimmed);
    }
  }
  const translatorResult = variantAiTranslationEnabled(flags)
    ? await buildVariantTranslatorAI(sourceVariants, {
        productTitle: product.rawTitle,
        valueOverrides: manualNames,
        axisNameOverrides: manualAxisNames,
      })
    : (() => {
        // Sync-läge (VARIANT_AI av): inga AI-anrop, men flagga ändå produkten om en
        // axel blev kvar med ett rått engelskt namn (tabell-miss) → ingen produkt
        // skeppas halv-engelsk ens i hård-$0-läget. Manuella namn går före tabellen
        // (samma lager 0 som AI-vägen); kollisions-säkerheten är identisk.
        // FÄRG-GRINDEN körs också här (audit 2026-08-09): den är deterministisk
        // och gratis — utan den skeppade hård-$0-läget fel-betydelse-färger
        // ("Nät" på en röd bil) oflaggade, trots att grinden byggdes för exakt det.
        const t = buildTranslatorFromBase(
          sourceVariants,
          (raw) => manualNames.get(raw) ?? translateValue(raw),
          undefined,
          undefined,
          manualAxisNames,
        );
        const trusted = new Set(
          [...manualNames.values(), ...manualAxisNames.values()].map((s) => s.trim()),
        );
        const unresolved = [
          ...new Set([...unresolvedAxisNames(t), ...colorGateFlags(sourceVariants, t, trusted)]),
        ];
        return { translator: t, unresolved };
      })();
  const translator = translatorResult.translator;
  const variantsNeedPolish = translatorResult.unresolved.length > 0;
  let variants = sourceVariants.map((v) => ({
    ...v,
    options: translator.options(v.options),
  }));
  const translatedColorCodes = colorCodes ? translator.axisKeyedMap(colorCodes) : undefined;
  // Variantbild-backfill (bug "kepsen" 2026-06-06): när skrapan inte fångade NÅGON
  // per-färg-bild (lazy-load/annan DOM) får produkten text-val utan bild. Hämta då
  // bilderna från DS-produkt-API:t (sku_image), matchat på SKU-id, med skrapans råa
  // namn. Hoppar API-anropet helt när skrapan redan gav swatch-bilder → ingen extra
  // kostnad/regression. Best-effort — fäller aldrig importen.
  let effectiveSwatchImages = product.swatchImages;
  if (variantImageBackfillEnabled() && needsSwatchBackfill(product)) {
    const backfilled = await enrichSwatchImagesFromApi(product, { getProduct: getProductOnce });
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
  // Beskrivnings-backfill: AE:s produktbeskrivning ligger i en lazy-laddad iframe
  // som skrapan ofta missar → product.descriptionHtml/rawDescription blir tunn och
  // Wix-produkten får nästan ingen text. Hämta då DS-produkt-API:ts detail, rena
  // den (XSS + dropship-anonymisering) och använd den. Best-effort — fäller aldrig
  // importen. Gäller både rå-läge (descriptionHtml → Wix direkt) och AI-läge
  // (rawDescription → SEO-generering).
  if (descriptionBackfillEnabled() && needsDescriptionBackfill(product)) {
    try {
      const ds = await getProductOnce(product.supplierProductId);
      const detail = sanitizeDescriptionHtml(ds.description || "");
      if (isMoreInformative(detail, product)) {
        product.descriptionHtml = detail;
        const text = descriptionToText(detail);
        if (text.length > (product.rawDescription || "").length) product.rawDescription = text;
        console.log(
          `[import:description] pid=${product.supplierProductId} backfill via DS-API ` +
            `(${detail.length} tecken; skrapan gav tunn beskrivning).`,
        );
      }
    } catch (err) {
      console.warn(
        `[import:description] pid=${product.supplierProductId} DS-detail-backfill misslyckades: ` +
          `${err instanceof Error ? err.message.slice(0, 160) : String(err)}`,
      );
    }
  }

  // Per-val bild-URL:er översätts till samma svenska axel-/val-nycklar som
  // varianterna (translateOptionColorCodes har exakt rätt shape) så att de matchar
  // de härledda Wix-optionsvalen vid kopplingen nedan.
  const translatedSwatchImages = effectiveSwatchImages
    ? translator.axisKeyedMap(effectiveSwatchImages)
    : undefined;

  const included = variants.filter((v) => v.included);

  // Variant pre-trim (Feature 3, 2026-06-02): produkter med fler än maxCount (8)
  // valda varianter trimmas till topp-N (sälj-/lager-rankade, minst 1 per färg)
  // för en renare PDP. Default-läget utelämnar de trimmade helt (samma öde som
  // manuellt avbockade — de tar annars kvotplats utan att kunna säljas); legacy-
  // läget (IMPORT_KEEP_DESELECTED_VARIANTS=true) demoterar dem till included:false
  // så att Wix får hela variantuppsättningen men bara visar topp-N.
  // Deterministiskt, inga AI-anrop. Stäng av med IMPORT_VARIANT_TRIM=false.
  // Loggas i audit efter create.
  let variantTrimSummary: string | null = null;
  if (variantTrimEnabled() && included.length > variantTrimMax()) {
    const { kept, removed, summary } = trimVariants(included, variantTrimMax());
    if (removed.length > 0) {
      const keptIds = new Set(kept.map((k) => k.supplierVariantId));
      if (keepDeselectedVariants()) {
        for (const v of variants) {
          if (v.included && !keptIds.has(v.supplierVariantId)) v.included = false;
        }
      } else {
        variants = variants.filter((v) => keptIds.has(v.supplierVariantId));
      }
      variantTrimSummary = summary;
      console.log(`[import:variant-trim] pid=${product.supplierProductId} ${summary}`);
    }
  }

  // Icke-differentierande axlar (exakt 1 värde, t.ex. en fast dimension "60X34X70 cm")
  // är ingen variant → plocka ut dem som SPEC-rader i stället för döda 1-vals-rullistor.
  // prunedVariants matar options/cap/wixVariants (rena produktsidor); constantAxisSpecs
  // fogas in i spec-fliken nedan. Premium + hindrar att fasta mått fyller den delade
  // "Storlek"-listan mot Wix 100-vals-taket. Se lib/import/constant-axes.ts.
  // Körs EFTER urval + trim (2026-07-02): en axel som blir enväljare av att kunden
  // bockade av resten kollapsar då också till spec — ingen död väljare på PDP:n.
  // (Fixar även en vilande bugg: trim-demoteringen nådde aldrig prunedVariants-
  // kopiorna när splitten låg före trimmen.)
  const { prunedVariants, specs: constantAxisSpecs } = splitConstantAxes(variants);
  if (constantAxisSpecs.length) {
    console.log(
      `[import:axes] ${product.supplierProductId}: ${constantAxisSpecs.length} icke-differentierande ` +
        `axel/axlar → spec i st.f. variantväljare (${constantAxisSpecs.map((s) => s.label).join(", ")}).`,
    );
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
  // Foga in de icke-differentierande axlarna (t.ex. fast mått) som spec-rader i
  // spec-fliken — så värdet syns trots att det inte längre är en variantväljare.
  // Dedup mot befintliga specs (AE:s egna mått vinner); värdet är redan översatt.
  const tabsWithAxisSpecs = constantAxisSpecs.length
    ? { ...generatedTabs, specs: mergeConstantAxisSpecs(generatedTabs.specs, constantAxisSpecs) }
    : generatedTabs;
  const enrichedDescriptionHtml = appendTabSections(
    seo.descriptionHtml,
    buildTabSections(tabsWithAxisSpecs),
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

  // Options härleds ur de varianter som faktiskt importeras (default: bara valda;
  // legacy-läget IMPORT_KEEP_DESELECTED_VARIANTS=true tar med avbockade som döljs
  // med visible:false). MEN en överlastad AE-axel (100-tals värden under t.ex.
  // "Color") skulle spränga Wix V3:s hårda gräns (≤100 val/option) → create-product
  // 400 CHOICES_LIMIT_EXCEEDED. capOptionsAndVariants kapar ned till Wix-gränserna,
  // behåller ALLTID de valda (included) varianternas värden och håller
  // options↔varianter konsistenta. Hårdfaller aldrig → kapad produkt flaggas
  // för polering (needsAiPolish nedan).
  // PAYLOAD-VAKT (batch-fyndet 2026-08-08): saneringen körs en ANDRA gång på de
  // FÄRDIGÖVERSATTA varianterna, precis innan options härleds. Första passet ser
  // bara råvärdena — skulle något mellansteg (översättning, remap, trim) lämna
  // ett effektivt tomt värde vidare är detta sista utposten före Wix-payloaden.
  // Samma felklass som #378 men senare i kedjan: hellre en borttagen axel + en
  // flaggad produkt än ett create-product-400 som fäller hela importen.
  let wixReadyVariants = prunedVariants;
  let payloadGuardTriggered = false;
  {
    const guard = sanitizeVariantOptions(prunedVariants);
    if (guard.removedAxes.length > 0) {
      wixReadyVariants = guard.variants;
      payloadGuardTriggered = true;
      console.warn(
        `[import:payload-guard] pid=${product.supplierProductId} effektivt tomma variantvärden ` +
          `överlevde till payload-steget — axlar borttagna: ` +
          `${guard.removedAxes.map((a) => JSON.stringify(a)).join(", ")}; ` +
          `${guard.mergedDuplicates} dubblettvarianter sammanslagna. Produkten flaggas för granskning.`,
      );
    }
  }
  const cap = capOptionsAndVariants(deriveOptions(wixReadyVariants, translatedColorCodes), wixReadyVariants);
  const options = cap.options;
  const wixVariantSource = cap.variants;
  if (cap.capped) {
    console.warn(`[import] ${product.supplierProductId}: kapad till Wix-gränser (${cap.summary})`);
    if (cap.droppedIncluded > 0) {
      // Pengaväg: en eller flera KÖPBARA varianter fick inte plats inom Wix hårda gränser
      // (>100 val/axel eller >1000 varianter). De utelämnades hellre än att hela importen 400:ar.
      // Produkten flaggas needsAiPolish (nedan) → hamnar i kön för manuell granskning/delning.
      console.warn(
        `[import] ${product.supplierProductId}: VARNING — ${cap.droppedIncluded} köpbar(a) variant(er) ` +
          `rymdes inte inom Wix-gränserna och utelämnades. Produkten flaggas för manuell granskning.`,
      );
    }
  }

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
  // Läsbara SKU:er ("FP-<produkt>-<variant>") istället för "AE-<hash>". SKU:n är ren
  // etikett (fulfillment går via mappningen), så formatet är fritt. Byggs för ALLA
  // varianter, unikt inom produkten. Endast nya importer påverkas.
  const skuByVariantId = buildVariantSkus(wixVariantSource, seo.slug, product.supplierProductId);
  const wixVariants: WixVariantInput[] = wixVariantSource.map((v) => {
    const sku = skuByVariantId.get(v.supplierVariantId) ?? makeSku(product.supplierProductId, v.supplierVariantId);
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

  // Komplettera linkedMedia (bug "hundvagn" 2026-06-06): färg-/modell-val som INTE
  // fick en explicit swatch-bild (DS/skrap saknade strukturerad mappning) kopplas
  // nu mot en GALLERIbild vars alt-text NAMNGER färgen (robust svensk färgmatchning,
  // se color-match.ts). Reuse:ar de per-färg-galleribilder som produkten redan har →
  // storefronten (läser linkedMedia med högsta prioritet) visar rätt bild per modell,
  // helt utan storefront-ändring. Explicit swatch vinner; detta fyller bara luckorna.
  const linkedChoiceKeys = new Set(swatchLinks.map((l) => `${l.optionName} ${l.choiceName}`));
  // Per-färg alt-matchning är BARA säker när alt-texten är specifik för EN bild. I
  // rå-läge (AI_ENRICHMENT_ENABLED=false) får alla galleribilder samma alt (rå
  // titeln) → en delad alt-text skulle felaktigt koppla en färg till första bilden.
  // Koppla därför bara mot en alt-text som bärs av EXAKT en galleribild.
  const altCount = new Map<string, number>();
  for (const m of mediaItems) {
    if (m.altText) altCount.set(m.altText, (altCount.get(m.altText) ?? 0) + 1);
  }
  const usedSwatchAlts = new Set<string>();
  const altLinks: ChoiceMediaLink[] = [];
  for (const o of options) {
    for (const c of o.choices) {
      if (linkedChoiceKeys.has(`${o.name} ${c.name}`)) continue;
      const match = mediaItems.find(
        (m) =>
          m.altText &&
          altCount.get(m.altText) === 1 &&
          !usedSwatchAlts.has(m.altText) &&
          matchesColorName(m.altText, c.name),
      );
      if (match?.altText) {
        usedSwatchAlts.add(match.altText);
        altLinks.push({ optionName: o.name, choiceName: c.name, altText: match.altText });
      }
    }
  }
  const choiceMediaLinks = swatchLinks.concat(altLinks);

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

  // Logga den faktiska payload-formen som skickas till Wix — så att 400:or
  // (CHOICES_LIMIT/TOO_MANY_*) går att diagnostisera i loggarna utan att gissa.
  console.log(
    `[import:wix-payload] pid=${product.supplierProductId} options=${wixInput.options?.length ?? 0} ` +
      `maxChoices=${(wixInput.options ?? []).reduce((m, o) => Math.max(m, o.choices.length), 0)} ` +
      `variants=${wixInput.variants.length}`,
  );
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
  if (choiceMediaLinks.length > 0) {
    const linkedCount = await linkChoiceMedia(created.id, choiceMediaLinks);
    await audit(
      "import-variant-media",
      created.id,
      `${linkedCount}/${choiceMediaLinks.length} val kopplade till variantbild ` +
        `(linkedMedia; ${swatchLinks.length} explicit swatch + ${altLinks.length} via alt-text-färgmatch)`,
    );
  }

  // --- Initialt lagersaldo (bug 2026-05-31, slutgiltig fix) ----------------
  // Lagerposterna skapas nu IN-LINE i createProduct (/products-with-inventory)
  // med quantity=stockQty per inkluderad variant. Tidigare separata query→update
  // no-op:ade eftersom Wix INTE skapar lagerposter vid vanlig create — det var
  // därför produkterna fortsatte visas "Slut i lager". Här loggar vi bara utfallet.
  const includedCount = wixVariantSource.filter((v) => v.included).length;
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
    ...((!aiEnabled || variantsNeedPolish || cap.capped || payloadGuardTriggered)
      ? { needsAiPolish: true }
      : {}),
    ...(translatorResult.unresolved.length > 0
      ? { unresolvedVariantValues: translatorResult.unresolved }
      : {}),
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
