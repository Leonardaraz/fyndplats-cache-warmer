import type { PricingConfig } from "./import/types";

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
