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
}

export interface MarkupRule {
  /** Multiplikator på landad kostnad (exkl. moms), t.ex. 2.5. */
  multiplier: number;
  /** Fast påslag i SEK (exkl. moms) ovanpå multiplikatorn. */
  fixedSek: number;
}

/**
 * Avrundningsstrategi för slutpris inkl. moms.
 * - none: två decimaler (ingen avrundning)
 * - charm90: närmaste heltal som slutar på .90 (t.ex. 249.90)
 * - charm9: närmaste heltal som slutar på 9 (t.ex. 199, 299, 599)
 * - integer: närmaste heltal
 * - nearest10: avrunda UPP till närmaste hela 10-krona (t.ex. 251 → 260)
 */
export type RoundingStrategy = "none" | "charm90" | "charm9" | "integer" | "nearest10";

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
