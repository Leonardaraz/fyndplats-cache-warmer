// Centraliserade settings för lönsamhetsdashboard. Defaults kommer från env;
// override per session sker i UI:t (server actions). Stored ev. som CMS-rad i
// framtiden — initialt env-baserat så vi inte behöver en ny collection.
//
// Vi exporterar både en hjälpare som läser env och en typer som matchar
// ProfitabilitySettings i lib/analytics/profitability.ts.

import type { ProfitabilitySettings } from "./analytics/profitability";
import { paymentFeeFromEnv, pricingConfigFromEnv } from "./config";

function num(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function profitabilitySettingsFromEnv(): ProfitabilitySettings {
  const pricing = pricingConfigFromEnv();
  const fee = paymentFeeFromEnv();
  return {
    shippingCostSek: num("SHIPPING_COST_ESTIMATE_SEK", 15),
    paymentFeePercent: fee.percent,
    paymentFeeFixedSek: fee.fixedSek,
    vatRatePercent: pricing.vatRatePercent,
    fallbackCostFractionOfNet: num("FALLBACK_COST_FRACTION_OF_NET", 0.3),
  };
}
