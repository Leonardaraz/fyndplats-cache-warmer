import type { MarkupRule, PriceBreakdown, PricingConfig, PricingRules } from "./types";

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
 * - charm9: närmaste heltal som slutar på 9 (t.ex. 199, 299, 599)
 * - integer: närmaste heltal
 * - nearest10: avrunda UPP till närmaste hela 10-krona (t.ex. 251 → 260)
 * - none: två decimaler
 */
export function roundPrice(gross: number, strategy: PricingConfig["rounding"]): number {
  if (strategy === "integer") return Math.round(gross);
  if (strategy === "charm90") return Math.max(0, Math.round(gross - 0.9)) + 0.9;
  if (strategy === "charm9") {
    // Närmaste heltal vars sista siffra är 9: ...9, 19, 29, 199, 299 osv.
    return Math.max(9, Math.round((gross - 9) / 10) * 10 + 9);
  }
  if (strategy === "nearest10") return Math.ceil(gross / 10) * 10;
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

/** Normaliserar ett kategorinamn för tolerant nyckel-uppslag (trim + lower). */
function normalizeCategory(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Väljer effektiv markup-regel för en variant utifrån PricingRules, landad
 * kostnad och produktens kategori. Mest specifik regel vinner:
 * intervall (om aktiverat) → kategori → standard. Det fasta påslaget gäller alltid.
 * Ren funktion — enhetstestbar.
 */
export function resolveMarkup(
  costSek: number,
  category: string | null,
  rules: PricingRules,
): MarkupRule {
  let multiplier = rules.defaultMultiplier;

  // 2. Per-kategori (matchas case-insensitivt mot kollektionens namn).
  if (category) {
    const want = normalizeCategory(category);
    for (const [name, m] of Object.entries(rules.categoryMultipliers)) {
      if (normalizeCategory(name) === want && Number.isFinite(m) && m > 0) {
        multiplier = m;
        break;
      }
    }
  }

  // 1. Intervall vinner över kategori/standard om aktiverat och matchar.
  if (rules.tiersEnabled) {
    const tier = rules.tiers.find(
      (t) => costSek >= t.minCostSek && (t.maxCostSek == null || costSek < t.maxCostSek),
    );
    if (tier && Number.isFinite(tier.multiplier) && tier.multiplier > 0) {
      multiplier = tier.multiplier;
    }
  }

  return { multiplier, fixedSek: rules.fixedSurchargeSek };
}

/**
 * Räknar fram pris ur den fullständiga prissättningskonfigen + ev. kategori.
 * Tunn wrapper över resolveMarkup + computePrice så pipelinen slipper bygga en
 * mellanliggande PricingConfig per variant.
 */
export function computePriceWithRules(
  costUsd: number,
  rules: PricingRules,
  category: string | null,
): PriceBreakdown {
  const costSek = costToSek(costUsd, rules.usdToSek);
  const markup = resolveMarkup(costSek, category, rules);
  return computePrice(costUsd, {
    usdToSek: rules.usdToSek,
    vatRatePercent: rules.vatRatePercent,
    markup,
    rounding: rules.rounding,
  });
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
