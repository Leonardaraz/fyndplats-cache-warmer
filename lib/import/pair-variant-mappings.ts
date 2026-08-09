// lib/import/pair-variant-mappings.ts
//
// VÄRDEBASERAD parning av Wix-varianter mot AliExpress-SKU:er — delad av
// mappningsverktygets server action OCH /api/mappings/create (destillatorn
// 2026-08-09: båda vägarna parade förr positionellt = blint på listordning).
//
// Återanvänder synkens matchningsmaskineri (repairSyntheticVariantIds):
// tomma id:n är per definition syntetiska → matcharen fyller i AE-skuId där
// värdesignaturen (eller samma-vara-i-flera-lager-regeln, EU-lager först) är
// entydig. Positionell parning finns kvar ENBART som sista utväg för omatchade
// rader och räknas i svaret så den aldrig sker tyst.

import { computePrice } from "./pricing";
import type { PricingConfig } from "./types";
import { translateValue } from "./variant-translations";
import { repairSyntheticVariantIds } from "../sync/mapping-repair";

export interface PairableWixVariant {
  id: string;
  sku?: string;
  choices: Record<string, string>;
}

export interface PairableAeVariant {
  skuId: string;
  price: number;
  stock?: number;
  skuProps?: Record<string, string>;
  shipFrom?: string;
}

export interface PairedVariantMapping {
  supplierVariantId: string;
  sku: string;
  wixVariantId: string;
  choices: Record<string, string>;
  costUsd: number;
  landedCostSek: number;
  grossSek: number;
}

export interface PairResult {
  variants: PairedVariantMapping[];
  /** Antal rader parade på värdesignatur (säkra). */
  matched: number;
  /** Antal rader parade positionellt i reserv (osäkra — ska varnas högljutt). */
  positional: number;
}

export function pairVariantMappings(
  wixVariants: ReadonlyArray<PairableWixVariant>,
  aeVariants: ReadonlyArray<PairableAeVariant>,
  pricing: PricingConfig,
  supplierProductId: string,
): PairResult {
  // AE-SKU:er utan id (degraderad DS-data bygger skuId som String(sku_id ?? ""))
  // får ALDRIG bli mappningsrader: ett tomt supplierVariantId är per definition
  // syntetiskt/obeställbart, och aeById.get("") hade annars "värdematchat" varje
  // omatchad Wix-rad mot spök-SKU:n (audit 2026-08-09). repairSyntheticVariantIds
  // filtrerar redan tomma id:n internt — samma spärr behövs här.
  const aeUsable = aeVariants.filter((a) => String(a.skuId ?? "").trim() !== "");
  const seed = wixVariants.map((wv) => ({ supplierVariantId: "", choices: wv.choices }));
  const rep = repairSyntheticVariantIds(seed, aeUsable, translateValue);
  const aeById = new Map(aeUsable.map((a) => [String(a.skuId), a]));
  const assigned = new Set(rep.variants.map((v) => v.supplierVariantId).filter(Boolean));
  const remaining = aeUsable.filter((a) => !assigned.has(String(a.skuId)));
  let positional = 0;

  const variants = wixVariants.flatMap((wv, i): PairedVariantMapping[] => {
    const repId = rep.variants[i].supplierVariantId;
    let ae = repId ? aeById.get(repId) : undefined;
    if (!ae) {
      ae = remaining.shift();
      if (!ae) return []; // fler Wix-varianter än AE-SKU:er → raden får ingen källa
      positional++;
    }
    const breakdown = computePrice(ae.price, pricing);
    return [{
      supplierVariantId: ae.skuId,
      sku: wv.sku || `${supplierProductId}-${i}`,
      wixVariantId: wv.id,
      choices: wv.choices,
      costUsd: ae.price,
      landedCostSek: breakdown.costSek,
      grossSek: breakdown.grossSek,
    }];
  });

  return { variants, matched: variants.length - positional, positional };
}
