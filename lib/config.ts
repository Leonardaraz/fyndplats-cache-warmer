import type { PricingConfig } from "./import/types";

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

/** Läser prissättningskonfig från miljön (med rimliga defaults). */
export function pricingConfigFromEnv(): PricingConfig {
  return {
    usdToSek: num("USD_TO_SEK", 10.5),
    vatRatePercent: num("VAT_RATE_PERCENT", 25),
    markup: {
      multiplier: num("MARKUP_MULTIPLIER", 2.5),
      fixedSek: num("MARKUP_FIXED_SEK", 0),
    },
    rounding: (process.env.PRICE_ROUNDING as PricingConfig["rounding"]) || "charm90",
  };
}

/** Avgift för betalleverantören (Klarna) — används i lönsamhetsberäkningen. */
export function paymentFeeFromEnv(): PaymentFeeConfig {
  return {
    percent: num("KLARNA_FEE_PERCENT", 3),
    fixedSek: num("KLARNA_FEE_FIXED_SEK", 2),
  };
}
