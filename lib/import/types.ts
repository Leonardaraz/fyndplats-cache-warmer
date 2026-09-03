// Delade typer för import-/sync-pipelinen.

export interface AliExpressVariant {
  /** Leverantörens variant-id (eller sammansatt nyckel) — används för mappning. */
  supplierVariantId: string;
  /** Råa optionsvärden från AliExpress, t.ex. { "Color": "Red", "Size": "M" }. */
  options: Record<string, string>;
  /** Inköpspris för varianten i USD. */
  costUsd: number;
  /** Lagersaldo om tillgängligt. */
  stock?: number;
  /** ISO-3166 alpha-2-warehouse-kod, t.ex. "ES" eller "CN". */
  shipFrom?: string;
  /** Om kunden bockat av varianten i popupen importeras den inte. */
  included: boolean;
}

export interface AliExpressProduct {
  /** AliExpress produkt-id (för mappning + dedupe). */
  supplierProductId: string;
  sourceUrl: string;
  /** Rå titel (kinesiska/engelska). */
  rawTitle: string;
  /** Rå beskrivning (HTML eller text). */
  rawDescription: string;
  /**
   * Full HTML-beskrivning från AE:s Product Description-sektion (renad av
   * skrapan). Optional — saknas på rå-imports innan AE:s lazy-loaded
   * description-iframe hann renderas, eller om sektionen returnerade tom HTML.
   * Servern föredrar den här över rawDescription när den finns. Bug 2026-06-02.
   */
  descriptionHtml?: string;
  imageUrls: string[];
  variants: AliExpressVariant[];
  /**
   * Aggregerade warehouse-koder över alla varianter, t.ex. ["ES","CN"].
   * Tom = okänt warehouse (importeras utan EU-flagga).
   */
  shipsFrom?: string[];
  /**
   * Lagerstatus läst från AliExpress-sidan. `false` = sidan signalerade
   * slutsåld/out-of-stock. `true`/utelämnat = i lager (default-antagande —
   * AE-produkter säljer aktivt). Styr initialt Wix-lagersaldo vid import.
   */
  inStock?: boolean;
  /**
   * Specifikationstabell från AliExpress (engelska/kinesiska labels+värden),
   * t.ex. { Material: "Stainless Steel", Color: "Black" }. Översätts till svenska
   * och blir fliken "Tekniska specifikationer".
   */
  specifications?: Record<string, string>;
  /** Säljpunkter/funktioner (råtext) — underlag för beskrivning + FAQ. */
  features?: string[];
  /** "Vad som ingår i paketet" (råtext), t.ex. ["1 x Kabel", "1 x Manual"]. */
  packageContents?: string[];
  /**
   * Per-val bild-URL:er { [axelnamn]: { [val]: "https://…alicdn.jpg" } } skrapade
   * från AliExpress swatch-/SKU-bilder, t.ex. { Color: { Blue: "…blue.jpg" } }.
   * Importen laddar upp dem och kopplar dem till motsvarande Wix-optionsval
   * (linkedMedia) så att huvudbilden byts när kunden väljer en färg. Nycklarna är
   * råa (engelska) och översätts till svenska i pipelinen innan de matchas mot
   * de översatta optionsvalen.
   */
  swatchImages?: Record<string, Record<string, string>>;
  /**
   * Manuella variantnamn från importverktyget: { [rått optionsvärde]: "Svenskt
   * namn" }, t.ex. { "Polar Night Black": "Polarsvart" }. Vinner över HELA
   * översättningskedjan (statisk tabell → cache → Haiku) och betros av
   * svenskhets-grinden — Leonard skrev namnet med flit. Skälet till att det
   * måste ske FÖRE importen: i Wix V3 speglar choice.name den låsta
   * choice.key:en, så ett variantnamn kan aldrig döpas om i efterhand utan att
   * variantmappningen (wixVariantId ↔ AE-SKU) går sönder.
   */
  variantNameOverrides?: Record<string, string>;
  /**
   * Manuella AXELNAMN från importverktyget: { [rå axel]: "Svenskt namn" },
   * t.ex. { "Color": "Kulör", "Size": "Antal" }. Samma lager 0-regler som
   * variantNameOverrides — vinner över tabell/omklassning/AI och betros av
   * grinden. Key-låses i Wix precis som värdena (options-namnet sätts vid
   * skapandet).
   */
  axisNameOverrides?: Record<string, string>;
}

/**
 * AI-funktionsväljare från extension-popupen. Saknas/odefinierat fält = på
 * (default). Låter Leonard stänga av enskilda Claude-steg för snabbare/billigare
 * import. `translate` och `seo` delar samma generateSeo-anrop — det körs om
 * minst en av dem är på.
 */
export interface FeatureFlags {
  translate?: boolean;
  seo?: boolean;
  imageAnalysis?: boolean;
  autoCategorize?: boolean;
  /**
   * AI-fallback för VARIANTÖVERSÄTTNING (Haiku fyller i de variantvärden den
   * statiska tabellen missar; tabell+cache först → nära $0). FRIKOPPLAD från
   * enableAI/qualityMode — kan köra även i rå-läget. Saknas/undefined = följ env
   * VARIANT_AI_TRANSLATION_ENABLED (default på). `false` tvingar AV (hård $0 på
   * varianter). Se lib/import/variant-ai-translate.ts#variantAiTranslationEnabled.
   */
  translateVariants?: boolean;
  /**
   * Master-override för ALL AI-berikning (text, kategori, bild-ranking, flikar).
   * Saknas/undefined = följ env-flaggan AI_ENRICHMENT_ENABLED (default på).
   * `false` tvingar RÅ import (0 Claude-anrop, $0) även om env säger på.
   * `true` tvingar AI PÅ även om env stängt av den globalt (t.ex. en admin
   * "kör AI-batch"-knapp). Flaggan är default men inte hård — explicit val vinner.
   * Se lib/import/pipeline.ts#aiEnrichmentEnabled.
   *
   * OBS: `qualityMode` nedan är det nyare, mer uttrycksfulla valet (raw/standard/
   * premium). `enableAI` behålls för bakåtkompatibilitet — `enableAI:false`
   * motsvarar `qualityMode:"raw"`. Sätts båda vinner `qualityMode`.
   */
  enableAI?: boolean;
  /**
   * AI-kvalitetsläge för JUST den här importen (extension-dropdown). Vinner över
   * env AI_QUALITY_MODE och legacy `enableAI`.
   *   "raw"      → 0 öre, ingen AI, draft (väntar på manuell polering).
   *   "standard" → ~10,5 öre, batchat Haiku, draft.
   *   "premium"  → ~75–100 öre, Opus multi-pass + Sonnet vision, publiceras direkt.
   * Se lib/import/quality-mode.ts#resolveQualityMode.
   */
  qualityMode?: "raw" | "standard" | "premium";
}

export interface MarkupRule {
  /** Multiplikator på landad kostnad (exkl. moms), t.ex. 2.5. */
  multiplier: number;
  /** Fast påslag i SEK (exkl. moms) ovanpå multiplikatorn. */
  fixedSek: number;
}

/**
 * Per-import-prisoverride (extension-dropdownen "Marginal-tier" → Custom). Vinner
 * över default-/kategori-/intervallregeln för JUST den importen. Saknas =
 * normal prissättning via PricingRules (bakåtkompatibelt).
 *
 * Tillämpningsordning i computePriceWithRules:
 *   1. multiplier ersätter den annars valda markup-multiplikatorn (det fasta
 *      påslaget fixedSurchargeSek läggs fortfarande på).
 *   2. floorSek höjer slutpriset så att vinsten (netto exkl. moms − landad kostnad)
 *      når minst floorSek.
 *   3. ceilingSek är ett HÅRT tak på slutpriset inkl. moms (kapar sist — kan
 *      därmed underskrida floorSek om Leonard sätter ett för lågt tak).
 */
export interface PricingOverride {
  /** Multiplikator på landad kostnad (1.0–5.0). */
  multiplier: number;
  /** Minsta vinst i SEK (netto exkl. moms − landad kostnad). 0/utelämnad = av. */
  floorSek?: number;
  /** Högsta slutpris inkl. moms i SEK. 0/utelämnad = av. */
  ceilingSek?: number;
}

/**
 * Avrundningsstrategi för slutpris inkl. moms.
 * - none: två decimaler (ingen avrundning)
 * - charm90: närmaste heltal som slutar på .90 (t.ex. 249.90)
 * - charm9: avrunda UPPÅT till närmaste heltal som slutar på 9 (489 → 489, 490 → 499)
 * - charm99: som charm9, men snäpper de två svagaste ändelserna till 99 —
 *   89 höjs (589 → 599) och 09 SÄNKS (609 → 599). 99 är den starkaste
 *   charm-ändelsen i handeln; 89 och 09 ser ut som det de är, resultatet av
 *   en uträkning. Ungefär vinstneutralt: lika många rader höjs som sänks.
 *   ☠️ ENDA strategin som kan runda NEDÅT utöver charm90 — se roundPrice.
 * - integer: närmaste heltal
 * - nearest10: avrunda UPP till närmaste hela 10-krona (t.ex. 251 → 260)
 */
export type RoundingStrategy = "none" | "charm90" | "charm9" | "charm99" | "integer" | "nearest10";

export interface PricingConfig {
  usdToSek: number;
  vatRatePercent: number;
  markup: MarkupRule;
  /** Avrundningsstrategi för slutpris inkl. moms. */
  rounding: RoundingStrategy;
}

/** Ett inköpspris-intervall (landad kostnad i SEK) med egen multiplikator. */
export interface PricingTier {
  /** Nedre gräns inklusive (SEK). */
  minCostSek: number;
  /** Övre gräns exklusive (SEK). null = oändligt (>minCostSek). */
  maxCostSek: number | null;
  multiplier: number;
}

/**
 * Komplett prissättningskonfig som Leonard redigerar i /admin/pricing och som
 * persisteras i Wix Data-kollektionen FyndplatsPricingConfig (en enda rad).
 * Läses i lib/import/pricing.ts vid varje import.
 *
 * Multiplikator-prioritet (mest specifik vinner):
 *   1. matchande intervall-regel (om tiersEnabled)
 *   2. per-kategori-regel (om produktens kategori har en regel)
 *   3. defaultMultiplier
 * Det fasta påslaget (fixedSurchargeSek) läggs alltid på ovanpå den valda
 * multiplikatorn (0 = inget påslag).
 */
export interface PricingRules {
  usdToSek: number;
  vatRatePercent: number;
  /** Standardmultiplikator när ingen kategori-/intervallregel matchar. */
  defaultMultiplier: number;
  /** Fast påslag i SEK (exkl. moms). 0 = av. */
  fixedSurchargeSek: number;
  /** Per-kategori-multiplikatorer, nyckel = Wix-kollektionens namn. */
  categoryMultipliers: Record<string, number>;
  /** Om true används intervall-reglerna före kategori-/standardregeln. */
  tiersEnabled: boolean;
  tiers: PricingTier[];
  rounding: RoundingStrategy;
}

export interface PriceBreakdown {
  costUsd: number;
  costSek: number;
  /** Försäljningspris exkl. moms (netto). */
  netSek: number;
  vatSek: number;
  /** Slutpris inkl. moms (sätts i Wix). */
  grossSek: number;
}
