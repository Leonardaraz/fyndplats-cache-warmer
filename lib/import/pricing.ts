import type { MarkupRule, PriceBreakdown, PricingConfig, PricingOverride, PricingRules } from "./types";

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
 * - charm9: avrunda UPPÅT till närmaste heltal som slutar på 9 (489 → 489, 490 → 499)
 * - integer: närmaste heltal
 * - nearest10: avrunda UPP till närmaste hela 10-krona (t.ex. 251 → 260)
 * - none: två decimaler
 */
export function roundPrice(gross: number, strategy: PricingConfig["rounding"]): number {
  if (strategy === "integer") return Math.round(gross);
  if (strategy === "charm90") return Math.max(0, Math.round(gross - 0.9)) + 0.9;
  if (strategy === "charm9") {
    // Avrunda UPPÅT till närmaste heltal vars sista siffra är 9 (9, 19, …, 489,
    // 499, 579). Aldrig nedåt → marginalen skyddas. Epsilon-guard så ett pris som
    // redan slutar på 9 inte hoppar ett steg pga flyttalsbrus.
    return Math.max(9, Math.ceil((gross - 9) / 10 - 1e-9) * 10 + 9);
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
 *
 * `override` (extension-dropdownens Custom-tier) vinner över default-/kategori-/
 * intervallregeln: dess multiplier ersätter den annars valda multiplikatorn, och
 * floor/ceiling justerar slutpriset (se applyOverrideBounds). Saknas = oförändrat.
 */
export function computePriceWithRules(
  costUsd: number,
  rules: PricingRules,
  category: string | null,
  override?: PricingOverride,
): PriceBreakdown {
  const costSek = costToSek(costUsd, rules.usdToSek);
  const markup: MarkupRule = override
    ? { multiplier: override.multiplier, fixedSek: rules.fixedSurchargeSek }
    : resolveMarkup(costSek, category, rules);
  const breakdown = computePrice(costUsd, {
    usdToSek: rules.usdToSek,
    vatRatePercent: rules.vatRatePercent,
    markup,
    rounding: rules.rounding,
  });
  return override
    ? applyOverrideBounds(breakdown, override, rules.vatRatePercent, rules.rounding)
    : breakdown;
}

/**
 * Tillämpar Custom-tierns floor (minsta vinst) + ceiling (max slutpris) på ett
 * redan beräknat prisbrott. Floor höjer priset tills vinsten (netto − landad
 * kostnad) når floorSek; ceiling kapar slutpriset hårt (sist, kan underskrida
 * floor om taket sätts för lågt). Räknar om netto/moms ur det justerade bruttot
 * så att netto + moms = brutto. Ren funktion — enhetstestbar.
 */
export function applyOverrideBounds(
  breakdown: PriceBreakdown,
  override: PricingOverride,
  vatRatePercent: number,
  rounding: PricingConfig["rounding"],
): PriceBreakdown {
  let grossSek = breakdown.grossSek;

  // Floor: höj så att vinsten (netto exkl. moms − landad kostnad) ≥ floorSek.
  if (typeof override.floorSek === "number" && override.floorSek > 0) {
    const minNetSek = breakdown.costSek + override.floorSek;
    const minGross = roundPrice(addVat(minNetSek, vatRatePercent), rounding);
    if (grossSek < minGross) grossSek = minGross;
  }

  // Ceiling: hårt tak på slutpriset (kapar sist). Kapar till exakt taket (round2)
  // så Leonards angivna maxpris respekteras utan att charm-avrundning höjer det.
  if (typeof override.ceilingSek === "number" && override.ceilingSek > 0 && grossSek > override.ceilingSek) {
    grossSek = round2(override.ceilingSek);
  }

  if (grossSek === breakdown.grossSek) return breakdown;
  const netSek = round2(grossSek / (1 + vatRatePercent / 100));
  const vatSek = round2(grossSek - netSek);
  return { ...breakdown, netSek, vatSek, grossSek };
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
