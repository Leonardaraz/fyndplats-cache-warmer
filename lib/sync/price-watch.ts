import { computePrice } from "../import/pricing";
import type { PricingConfig } from "../import/types";

// Prisbevakning: skyddar marginalen när AliExpress-inköpspriset ändras.
// Ren logik — fullt enhetstestbar.

export interface PriceWatchConfig {
  /** Tröskel i procent för när en prisändring ska flaggas (t.ex. 10 = ±10%). */
  thresholdPercent: number;
  /** Om true justeras Wix-priset automatiskt för att behålla marginalen. */
  autoAdjust: boolean;
}

export interface PriceWatchResult {
  oldCostUsd: number;
  newCostUsd: number;
  /** Procentuell förändring av inköpspriset (positiv = dyrare). */
  percentChange: number;
  exceedsThreshold: boolean;
  /** True när priset stigit över tröskeln och autoAdjust är av → kräver manuell åtgärd. */
  flagged: boolean;
  /** Föreslaget/justerat nytt bruttopris (inkl. moms) när autoAdjust är på. */
  newGrossSek?: number;
}

export function percentChange(oldCost: number, newCost: number): number {
  if (oldCost <= 0) return newCost > 0 ? 100 : 0;
  return round2(((newCost - oldCost) / oldCost) * 100);
}

export function evaluatePriceChange(
  oldCostUsd: number,
  newCostUsd: number,
  pricing: PricingConfig,
  watch: PriceWatchConfig,
): PriceWatchResult {
  const change = percentChange(oldCostUsd, newCostUsd);
  const exceedsThreshold = Math.abs(change) >= watch.thresholdPercent;

  const result: PriceWatchResult = {
    oldCostUsd,
    newCostUsd,
    percentChange: change,
    exceedsThreshold,
    flagged: exceedsThreshold && !watch.autoAdjust && change > 0,
  };

  if (watch.autoAdjust && exceedsThreshold) {
    result.newGrossSek = computePrice(newCostUsd, pricing).grossSek;
  }

  return result;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
