import type { MarkupRule, PriceBreakdown, PricingConfig } from "./types";

// Ren prissättnings-/momslogik. Inga sidoeffekter — fullt enhetstestbar.

export function costToSek(costUsd: number, usdToSek: number): number {
  return round2(costUsd * usdToSek);
}

/** Försäljningspris exkl. moms = landad kostnad × multiplikator + fast påslag. */
export function applyMarkup(costSek: number, markup: MarkupRule): number {
  return round2(costSek * markup.multiplier + markup.fixedSek);
}

export function addVat(netSek: number, vatRatePercent: number): number {
  return round2(netSek * (1 + vatRatePercent / 100));
}

/**
 * Avrundar slutpriset (inkl. moms).
 * - charm90: närmaste heltal som slutar på .90 (t.ex. 249.90)
 * - integer: närmaste heltal
 * - none: två decimaler
 */
export function roundPrice(gross: number, strategy: PricingConfig["rounding"]): number {
  if (strategy === "integer") return Math.round(gross);
  if (strategy === "charm90") return Math.max(0, Math.round(gross - 0.9)) + 0.9;
  return round2(gross);
}

export function computePrice(costUsd: number, config: PricingConfig): PriceBreakdown {
  const costSek = costToSek(costUsd, config.usdToSek);
  const netSek = applyMarkup(costSek, config.markup);
  const grossRaw = addVat(netSek, config.vatRatePercent);
  const grossSek = roundPrice(grossRaw, config.rounding);
  // Härled momsbeloppet från det avrundade bruttopriset så att netto + moms = brutto.
  const netFromGross = round2(grossSek / (1 + config.vatRatePercent / 100));
  const vatSek = round2(grossSek - netFromGross);
  return { costUsd, costSek, netSek: netFromGross, vatSek, grossSek };
}

export interface ProfitInput {
  /** Slutpris inkl. moms som kunden betalar. */
  grossSek: number;
  vatRatePercent: number;
  /** Landad inköpskostnad i SEK (inköp × kurs + ev. frakt). */
  landedCostSek: number;
  /** Betalleverantörsavgift i SEK (t.ex. Klarna). */
  paymentFeeSek: number;
}

/**
 * Faktisk vinst = intäkt EXKL. moms − landad kostnad − betalavgift.
 * Momsen är inte din intäkt; att räkna på brutto överskattar vinsten.
 */
export function computeProfit(input: ProfitInput): { netRevenueSek: number; profitSek: number; marginPercent: number } {
  const netRevenueSek = round2(input.grossSek / (1 + input.vatRatePercent / 100));
  const profitSek = round2(netRevenueSek - input.landedCostSek - input.paymentFeeSek);
  const marginPercent = netRevenueSek > 0 ? round2((profitSek / netRevenueSek) * 100) : 0;
  return { netRevenueSek, profitSek, marginPercent };
}

/**
 * IOSS: försändelser över tröskeln (default 150 €) kan inte hanteras via IOSS
 * och kräver vanlig importdeklaration → flagga ordern.
 */
export function exceedsIossThreshold(orderValueSek: number, sekToEur: number, thresholdEur: number): boolean {
  const orderValueEur = orderValueSek * sekToEur;
  return orderValueEur > thresholdEur;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
