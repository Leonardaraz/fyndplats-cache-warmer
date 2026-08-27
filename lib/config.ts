import type { PricingConfig, PricingRules, PricingTier } from "./import/types";

export interface PaymentFeeConfig {
  /** T.ex. 3 = 3% av bruttobeloppet. */
  percent: number;
  /** Fast avgift i SEK per transaktion. */
  fixedSek: number;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * EUR → SEK. Används av Aosom-importen: deras B2B-feed prissätter i euro, medan
 * hela prissättningskedjan räknar i USD (AliExpress-arvet). Kursen omvandlar
 * feedens landade kostnad till samma enhet som pipelinen redan förstår — se
 * lib/aosom/to-product.ts#toImportProduct.
 *
 * Default 11,10 hämtad 2026-08-27. En rörelse på tio öre flyttar en plåtbod med
 * drygt trettio kronor; sätt EUR_TO_SEK i miljön när kursen glidit.
 */
export function eurToSekFromEnv(): number {
  return num("EUR_TO_SEK", 11.1);
}

/** Läser prissättningskonfig från miljön (med rimliga defaults). */
export function pricingConfigFromEnv(): PricingConfig {
  return {
    usdToSek: num("USD_TO_SEK", 10.5),
    vatRatePercent: num("VAT_RATE_PERCENT", 25),
    markup: {
      multiplier: num("MARKUP_MULTIPLIER", 2.5),
      fixedSek: num("MARKUP_FIXED_SEK", 0),
    },
    rounding: (process.env.PRICE_ROUNDING as PricingConfig["rounding"]) || "charm9",
  };
}

/**
 * Default per-kategori-multiplikatorer. Nycklarna matchar Wix-kollektionernas
 * namn (case-insensitivt vid uppslag). Leonard kan ändra dessa i /admin/pricing.
 */
export const DEFAULT_CATEGORY_MULTIPLIERS: Record<string, number> = {
  "Hem & Inredning": 2.5,
  "Elektronik & Tillbehör": 2.0,
  "Skönhet & Hälsa": 3.0,
  "Sport & Fritid": 2.5,
  "Kök & Husgeråd": 2.5,
  "Barn & Familj": 2.5,
  "Mode & Accessoarer": 3.0,
  Husdjur: 2.5,
};

/** Default intervall-regler (landad inköpskostnad i SEK → multiplikator). */
export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  { minCostSek: 0, maxCostSek: 50, multiplier: 3.5 },
  { minCostSek: 50, maxCostSek: 150, multiplier: 2.5 },
  { minCostSek: 150, maxCostSek: 500, multiplier: 2.0 },
  { minCostSek: 500, maxCostSek: null, multiplier: 1.7 },
];

/**
 * Bygger en fullständig PricingRules-default ur miljön. Används som fallback när
 * ingen sparad konfig finns i FyndplatsPricingConfig (kall start) och som bas
 * som den sparade konfigen mergas ovanpå.
 */
export function pricingRulesFromEnv(): PricingRules {
  const base = pricingConfigFromEnv();
  return {
    usdToSek: base.usdToSek,
    vatRatePercent: base.vatRatePercent,
    defaultMultiplier: base.markup.multiplier,
    fixedSurchargeSek: base.markup.fixedSek,
    categoryMultipliers: { ...DEFAULT_CATEGORY_MULTIPLIERS },
    // Intervall-baserad prissättning är opt-in (av som default) — annars skulle
    // den åsidosätta kategori-/standardregeln vid första importen.
    tiersEnabled: false,
    tiers: DEFAULT_PRICING_TIERS.map((t) => ({ ...t })),
    rounding: base.rounding,
  };
}

/** Avgift för betalleverantören (Klarna) — används i lönsamhetsberäkningen. */
export function paymentFeeFromEnv(): PaymentFeeConfig {
  return {
    percent: num("KLARNA_FEE_PERCENT", 3),
    fixedSek: num("KLARNA_FEE_FIXED_SEK", 2),
  };
}
