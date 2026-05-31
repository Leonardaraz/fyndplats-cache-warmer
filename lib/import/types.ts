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

export interface PricingConfig {
  usdToSek: number;
  vatRatePercent: number;
  markup: MarkupRule;
  /** Avrundningsstrategi för slutpris inkl. moms. */
  rounding: "none" | "charm90" | "integer";
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
