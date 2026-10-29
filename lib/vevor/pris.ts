// VEVOR:s pris → vår landade kostnad. En definition, som importen (steg 4) och
// synken (steg 5) delar: priset på ett utkast och priset synken senare skriver
// räknas ur samma funktion, så att ingen vara hoppar i pris när synken tar över.
//
// Regeln (Leonard 2026-10-28):
//
//   landad kostnad = sidans pris i SEK inkl. moms ÷ 1,24 × (1 − PRO-rabatten) × 1,25
//
// Priset till kund räknar pipelinen sedan med husets regel (1,20 × landad
// kostnad, avrundat enligt `FyndplatsPricingConfig`). Konkurrentregeln gäller
// inte VEVOR.
//
// ÷ 1,24 ÄR VEVOR:S MOMS PÅ EU-SAJTENS PRISER. Mätt mot en riktig faktura
// 2026-10-29: sidans pris delat med 1,24 gav fakturans pris utan moms på öret.
// Fakturan bar 0 % moms (omvänd skattskyldighet inom EU, med vårt momsnummer),
// så det vi betalar är priset utan VEVOR:s moms.
//
// × 1,25 FÖLJER HUSETS KONVENTION. `landedCostSek` lagras INKLUSIVE svensk moms,
// eftersom auktionens golvbud och lönsamhetsöversikten delar med 1,25 innan de
// räknar (`netSupplierCost`, lib/import/pricing.ts). Samma uppbruttning som
// Aosom-adaptern gör, och av samma skäl: ett nettotal i ett fält som läses som
// brutto hade gett ett golvbud 20 % för lågt.
//
// FRAKTEN ÄR NOLL. Fakturan bar "Shipping costs 0,00" till Sverige. Sidans
// JSON-LD säger 5 EUR, men för varje land och varje vara, stor som liten, så
// den siffran är ingen riktig frakt. ⚠️ Mätt på EN order: kontrollera frakten
// på en billig vara innan VEVOR-varor publiceras.
//
// ☠️ RABATTNIVÅN STÅR INTE I KODEN. Den ligger i `FyndplatsAppConfig`
// (`vevorProRabatt`, procent som text), eftersom repot är publikt. Saknas den
// importeras ingenting: hellre inga utkast än utkast räknade på en gissning.

import { SUPPLIER_VAT_RATE } from "@/lib/import/pricing";

/** VEVOR:s moms på EU-sajtens priser, uppmätt mot en faktura 2026-10-29. */
export const VEVOR_MOMSDELARE = 1.24;

/** Högsta rabatt som tas emot. PRO-programmets högsta nivå är 30 %, i utvalda kategorier. */
export const MAX_RABATT_PROCENT = 30;

export class RabattFel extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = "RabattFel";
  }
}

/**
 * PRO-rabatten som andel, ur konfigurationens text ("2", "2,5", "2.5 %").
 *
 * ☠️ KASTAR på allt den inte kan läsa, och på en tom rad. En rabatt som tyst
 * blev 0 hade räknat kostnaden för hög; en som tyst blev 25 i stället för 2,5
 * hade sålt under inköp. Meddelandet bär aldrig värdet.
 */
export function tolkaRabatt(text: string | null | undefined): number {
  const t = (text ?? "").trim();
  if (!t) throw new RabattFel("VEVOR PRO-rabatten saknas i konfigurationen (FyndplatsAppConfig, vevorProRabatt)");
  const m = /^(\d{1,2}(?:[.,]\d{1,2})?)\s*%?$/.exec(t);
  if (!m) throw new RabattFel("VEVOR PRO-rabatten i konfigurationen går inte att läsa som procent");
  const procent = Number(m[1].replace(",", "."));
  if (!Number.isFinite(procent) || procent < 0 || procent > MAX_RABATT_PROCENT) {
    throw new RabattFel(`VEVOR PRO-rabatten ska ligga mellan 0 och ${MAX_RABATT_PROCENT} procent`);
  }
  return procent / 100;
}

/** Landad kostnad i SEK, inklusive svensk moms. Kastar på ett pris som inte är ett positivt tal. */
export function vevorLandadKostnadSek(prisSek: number, rabatt: number): number {
  if (!Number.isFinite(prisSek) || prisSek <= 0) throw new Error("VEVOR-priset är inte ett positivt tal");
  if (!Number.isFinite(rabatt) || rabatt < 0 || rabatt > MAX_RABATT_PROCENT / 100) {
    throw new RabattFel("rabatten ligger utanför det tillåtna");
  }
  return avrunda2((prisSek / VEVOR_MOMSDELARE) * (1 - rabatt) * (1 + SUPPLIER_VAT_RATE));
}

function avrunda2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
