// lib/import/price-repair.ts
//
// EFTERHANDS-REPARATION AV VARIANTER SOM DELAR INKÖPSPRIS — REN logik.
//
// price-trust.ts hindrar NYA produkter från att nå kund med sidans baspris på
// alla varianter. Den gör ingenting åt dem som redan importerats: Leonards tre
// produkter 2026-08-20 (4-pack och 6-pack båda 589 kr, två spegelstorlekar båda
// 1279 kr) ligger kvar felprissatta, och varje såld 6-pack säljs till 4-packets
// pris.
//
// Den här modulen räknar ut vad de SKA kosta. Den skriver ingenting och gissar
// ingenting — den producerar en PLAN som går att läsa igenom innan något rörs.
//
// TRE SAKER MÅSTE RÄTTAS SAMTIDIGT, annars flyttas felet bara:
//   1. `grossSek` — priset kunden betalar (Wix).
//   2. `costUsd` — inköpspriset (mappningen).
//   3. `landedCostSek` — landad kostnad. LÄTT ATT GLÖMMA och värst att missa:
//      lönsamhetsöversikten (lib/analytics/profitability.ts) och auktionens
//      GOLVBUD (lib/auction/seed.ts → netSupplierCost) läser båda det fältet.
//      Rättas bara priset ser marginalen fantastisk ut och auktionen kan sälja
//      under inköp.
//
// DEN VIKTIGA AVGRÄNSNINGEN: en variant vars inköpspris är OFÖRÄNDRAT rörs
// inte alls — inte priset, inte kostnaden, ingenting. Blast-radien blir då
// exakt defekten. Det är också vad som gör körningen självverifierande: säger
// DS att priserna verkligen är lika (färgvarianter kostar nästan alltid samma)
// blir planen tom, och en bred kandidatsökning kan därför inte göra skada.

import { computePriceWithRules } from "./pricing";
import type { PricingRules } from "./types";
import type { AliExpressDsVariant } from "../aliexpress/types";

export interface RepairableVariant {
  supplierVariantId: string;
  sku?: string;
  choices?: Record<string, string>;
  costUsd?: number;
  landedCostSek?: number;
  grossSek?: number;
  wixVariantId?: string;
}

export interface VariantPriceChange {
  supplierVariantId: string;
  wixVariantId?: string;
  sku?: string;
  choices: Record<string, string>;
  /** Vad varianten HETER för en människa ("6-pack"), för läsbara rapporter. */
  label: string;
  fromCostUsd: number;
  toCostUsd: number;
  fromGrossSek: number;
  toGrossSek: number;
  toLandedCostSek: number;
  /** Marginal (netto mot netto) vid det NYA priset. */
  newMarginPct: number;
}

export interface PriceRepairPlan {
  /** Varianter vars inköpspris ändrats hos DS → ska skrivas. */
  changes: VariantPriceChange[];
  /** Varianter vars inköpspris stämmer → lämnas HELT orörda. */
  unchanged: number;
  /** Varianter som inte kunde paras ihop med en DS-SKU (rörs aldrig). */
  unmatched: string[];
  /**
   * Varningar som INTE stoppar planen men som en människa ska läsa, t.ex. att
   * prisreglerna hunnit ändras sedan importen.
   */
  warnings: string[];
  /** Fyllt när planen INTE får verkställas. Tomt = säker att köra. */
  blockers: string[];
}

export interface PriceRepairOptions {
  rules: PricingRules;
  /** Produktens Wix-kategori (styr kategori-multiplikatorn). */
  category?: string | null;
  /**
   * Lägsta godtagbara marginal (netto mot netto) på ett nyräknat pris.
   * Under den blockeras HELA planen — ett pris som ger förlust är ett beslut
   * för en människa, inte något en batch ska skriva tyst.
   */
  minMarginPct?: number;
  /**
   * Största godtagbara prisändring i procent. En variant som skulle mer än
   * fördubblas beror oftare på en felmatchning än på ett verkligt prisfel.
   */
  maxChangePct?: number;
}

export const DEFAULT_MIN_MARGIN_PCT = 10;
export const DEFAULT_MAX_CHANGE_PCT = 400;

/** Läsbart namn på en variant: dess val, annars SKU:n, annars id:t. */
export function variantLabel(v: RepairableVariant): string {
  const val = Object.values(v.choices ?? {})
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (val.length) return val.join(" · ");
  return v.sku || v.supplierVariantId;
}

/** Marginal netto mot netto — samma formel som synken (projectedMarginAtPrice). */
export function marginPct(grossSek: number, landedCostSek: number, vatRatePercent: number): number {
  if (grossSek <= 0) return 0;
  const netRevenue = grossSek / (1 + vatRatePercent / 100);
  if (netRevenue <= 0) return 0;
  const netCost = landedCostSek / (1 + vatRatePercent / 100);
  return round2(((netRevenue - netCost) / netRevenue) * 100);
}

/**
 * True när alla prissatta varianter delar exakt samma inköpspris — signalen
 * som gör en produkt till KANDIDAT för reparation. Kandidat är inte samma sak
 * som trasig: DS-uppslaget avgör.
 */
export function sharesOneCost(variants: ReadonlyArray<RepairableVariant>): boolean {
  const med = (variants ?? []).filter((v) => Number(v.costUsd) > 0);
  if (med.length < 2) return false;
  const första = Number(med[0].costUsd);
  return med.every((v) => Number(v.costUsd) === första);
}

/**
 * Bygger reparationsplanen för EN produkt.
 *
 * Matchar bara på SKU-ID. Värdesignatur-matchning finns i mapping-repair.ts och
 * används av självläkningen, men den är en GISSNING — och en felgissning här
 * skriver ett pris till kund. Varianter utan riktigt skuId rapporteras som
 * omatchade i stället: kör mappnings-reparationen först, sedan den här.
 */
export function planPriceRepair(
  variants: ReadonlyArray<RepairableVariant>,
  dsVariants: ReadonlyArray<AliExpressDsVariant>,
  opts: PriceRepairOptions,
): PriceRepairPlan {
  const minMargin = opts.minMarginPct ?? DEFAULT_MIN_MARGIN_PCT;
  const maxChange = opts.maxChangePct ?? DEFAULT_MAX_CHANGE_PCT;
  const plan: PriceRepairPlan = {
    changes: [],
    unchanged: 0,
    unmatched: [],
    warnings: [],
    blockers: [],
  };

  const dsById = new Map<string, AliExpressDsVariant>();
  for (const d of dsVariants ?? []) {
    if (d && d.skuId && Number(d.price) > 0) dsById.set(String(d.skuId), d);
  }
  if (dsById.size === 0) {
    plan.blockers.push("DS-svaret innehöll inga prissatta SKU:er — inget att jämföra mot.");
    return plan;
  }

  for (const v of variants ?? []) {
    const id = String(v.supplierVariantId ?? "");
    const ds = dsById.get(id);
    if (!ds) {
      plan.unmatched.push(id || "(tomt id)");
      continue;
    }

    const gammalCost = Number(v.costUsd) || 0;
    const nyCost = Number(ds.price);
    // Oförändrat inköpspris → rör ingenting. Inte priset, inte kostnaden.
    // Det är den här raden som gör att en bred kandidatsökning är ofarlig.
    if (Math.abs(nyCost - gammalCost) < 0.005) {
      plan.unchanged++;
      continue;
    }

    const brott = computePriceWithRules(nyCost, opts.rules, opts.category ?? null);
    const nyttPris = brott.grossSek;
    const gammaltPris = Number(v.grossSek) || 0;
    const nyMarginal = marginPct(nyttPris, brott.costSek, opts.rules.vatRatePercent);

    if (nyMarginal < minMargin) {
      plan.blockers.push(
        `${variantLabel(v)}: nytt pris ${nyttPris} kr ger ${nyMarginal} % marginal ` +
          `(golv ${minMargin} %). Kräver ett mänskligt beslut.`,
      );
      continue;
    }
    if (gammaltPris > 0) {
      const ändring = Math.abs((nyttPris - gammaltPris) / gammaltPris) * 100;
      if (ändring > maxChange) {
        plan.blockers.push(
          `${variantLabel(v)}: ${gammaltPris} → ${nyttPris} kr är ${Math.round(ändring)} % ` +
            `(tak ${maxChange} %). Troligare en felmatchad SKU än ett verkligt prisfel.`,
        );
        continue;
      }
    }

    plan.changes.push({
      supplierVariantId: id,
      wixVariantId: v.wixVariantId,
      sku: v.sku,
      choices: v.choices ?? {},
      label: variantLabel(v),
      fromCostUsd: gammalCost,
      toCostUsd: nyCost,
      fromGrossSek: gammaltPris,
      toGrossSek: nyttPris,
      toLandedCostSek: brott.costSek,
      newMarginPct: nyMarginal,
    });
  }

  // REGELDRIFT. De ändrade varianterna prissätts med DAGENS regler, medan de
  // oförändrade behåller priset de fick vid importen. Har multiplikatorn ändrats
  // däremellan får samma produkt två olika påslag. Det är inte fel nog att
  // stoppa reparationen — ett halvrättat pris är sämre än ett blandat påslag —
  // men det ska synas i rapporten och inte upptäckas i efterhand.
  for (const v of variants ?? []) {
    const ds = dsById.get(String(v.supplierVariantId ?? ""));
    if (!ds) continue;
    const gammalCost = Number(v.costUsd) || 0;
    if (Math.abs(Number(ds.price) - gammalCost) >= 0.005) continue;
    const gammaltPris = Number(v.grossSek) || 0;
    if (gammaltPris <= 0) continue;
    const skulleBli = computePriceWithRules(gammalCost, opts.rules, opts.category ?? null).grossSek;
    if (Math.abs(skulleBli - gammaltPris) > 0.5) {
      plan.warnings.push(
        `Prisreglerna har ändrats sedan importen: ${variantLabel(v)} står på ${gammaltPris} kr ` +
          `men dagens regler ger ${skulleBli} kr. De rättade varianterna får dagens påslag, ` +
          `de orörda behåller sitt. Vill du ha ett enhetligt påslag: importera om produkten.`,
      );
      break; // en rad räcker — det är samma observation för hela produkten
    }
  }

  return plan;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
