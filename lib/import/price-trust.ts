// lib/import/price-trust.ts
//
// SPÄRR MOT VARIANTER SOM DELAR PRIS UTAN TÄCKNING.
//
// Bakgrund (Leonards rapport 2026-08-20): tre nyimporterade produkter fick
// samma pris på alla varianter trots att inköpspriset skiljer — ett 4-pack och
// ett 6-pack låg båda på 589 kr, två spegelstorlekar båda på 1279 kr.
//
// Orsaken är känd och står redan i pipelinen: tilläggets DOM-fallback sätter
// sidans SYNLIGA pris på alla varianter när den inte kommer åt per-SKU-datan.
// DS-avstämningen (variant-reconcile.ts) finns för att rätta det, men den är
// medvetet försiktig och AVBRYTER hellre än parar ihop fel varianter — och den
// är fail-open, så ett avbrott eller ett trasigt DS-anrop lämnade bara en
// console.warn efter sig. Produkten skapades med underprisade varianter och
// ingen fick veta något förrän någon råkade titta.
//
// DEN HÄR MODULEN AVGÖR OM PRISERNA FÅR LITAS PÅ. Den gissar aldrig fram ett
// pris — att gissa ihop fel variant med fel pris är värre än att inte veta.
// Den säger bara "det här går inte att lita på", och pipelinen låter då
// produkten stanna som utkast i stället för att nå kund med fel pris.
//
// VIKTIGT ATT INTE ÖVERREAGERA: att alla varianter kostar lika mycket är
// FULLKOMLIGT NORMALT. Färgvarianter av samma vara har nästan alltid samma
// inköpspris. Delat pris är alltså ingen defekt i sig — det är delat pris
// SOM VI INTE KUNNAT BEKRÄFTA som är det. Därför krävs två saker samtidigt:
// priserna är identiska OCH vi saknar per-SKU-data bakom dem.

import { isSyntheticVariantId } from "./variant-reconcile";

export interface PriceTrustVariant {
  supplierVariantId?: string;
  costUsd?: number;
  included?: boolean;
}

export interface PriceTrustContext {
  /** Kördes DS-avstämningen över huvud taget? */
  reconcileAttempted: boolean;
  /** Avbröt den för att matchningen var för osäker? */
  reconcileAborted: boolean;
  /** Föll DS-uppslaget (nätverk, API-fel, avstängd switch)? */
  dsLookupFailed: boolean;
}

export type PriceTrustVerdict =
  | { trusted: true }
  | {
      trusted: false;
      /** Antal inkluderade varianter som delar exakt samma inköpspris. */
      sharedCount: number;
      /** Kort svensk motivering — visas i /admin/queue och i loggen. */
      reason: string;
    };

/** Inkluderade varianter med ett användbart inköpspris. */
function relevanta(variants: ReadonlyArray<PriceTrustVariant>): PriceTrustVariant[] {
  return (variants ?? []).filter((v) => v && v.included !== false && Number(v.costUsd) > 0);
}

/** True när fler än en variant delar exakt samma inköpspris. */
export function harDelatPris(variants: ReadonlyArray<PriceTrustVariant>): boolean {
  const v = relevanta(variants);
  if (v.length < 2) return false;
  const första = Number(v[0].costUsd);
  return v.every((x) => Number(x.costUsd) === första);
}

/**
 * Får priserna litas på?
 *
 * Otillförlitliga PRECIS när båda gäller:
 *   1. fler än en inkluderad variant delar exakt samma inköpspris, OCH
 *   2. vi har inte per-SKU-data bakom dem — antingen bär varianterna
 *      syntetiska id (skrapan hade aldrig riktiga SKU:er) eller så kunde
 *      DS-avstämningen inte bekräfta dem.
 *
 * Bekräftad avstämning väger tyngst: har DS svarat och matchningen gått igenom
 * är delat pris ett FAKTUM om varan, inte en lucka i datan.
 */
export function assessPriceTrust(
  variants: ReadonlyArray<PriceTrustVariant>,
  ctx: PriceTrustContext,
): PriceTrustVerdict {
  const v = relevanta(variants);
  if (!harDelatPris(v)) return { trusted: true };

  // DS har svarat och matchningen höll → priserna ÄR lika. Inget att flagga.
  const bekräftat = ctx.reconcileAttempted && !ctx.reconcileAborted && !ctx.dsLookupFailed;
  if (bekräftat) return { trusted: true };

  // Skrapan hade riktiga SKU-id:n, alltså per-SKU-data. Att de råkar kosta
  // lika mycket är då säljarens beslut, inte en DOM-fallback.
  const syntetiska = v.filter((x) => isSyntheticVariantId(String(x.supplierVariantId ?? "")));
  if (syntetiska.length === 0) return { trusted: true };

  const varför = ctx.dsLookupFailed
    ? "DS-uppslaget föll"
    : ctx.reconcileAborted
      ? "DS-avstämningen avbröts (för osäker matchning)"
      : "DS-avstämningen kördes aldrig";

  return {
    trusted: false,
    sharedCount: v.length,
    reason:
      `${v.length} varianter delar inköpspris ($${Number(v[0].costUsd)}) och saknar riktiga ` +
      `SKU-id:n — ${varför}. Priserna kommer troligen från sidans synliga pris, ` +
      `så dyrare varianter är underprisade.`,
  };
}
