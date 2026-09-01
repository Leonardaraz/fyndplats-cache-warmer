// lib/vat.ts
//
// Momsen på kvittot — och varför "Delsumma" behöver räknas om.
//
// Wix skickar beloppen i `priceSummary`, men inte i den form ett svenskt
// kvitto vill ha dem. Ur eCommerce Orders-specen, ordagrant:
//
//   subtotal   "Subtotal of all line items, before discounts and before tax."
//   shipping   "Total shipping price, before discounts and before tax."
//   tax        "Total tax applied to the order."
//   discount   "Total discount amount applied to the order."
//   total      "Order's total price after discounts and tax."
//
// Orderraderna i mejlet skrivs däremot från `totalPriceAfterTax` — alltså MED
// moms. Att skicka `subtotal` rakt in som "Delsumma" blandade därför netto och
// brutto i samma kolumn: en order på 1 899 kr med fri frakt fick
//
//   Delsumma  1 519,20 kr      ← netto (1 899 / 1,25)
//   Frakt     Fri frakt
//   Totalt    1 899,00 kr      ← brutto
//
// vilket inte går ihop för den som läser. Och momsen — 379,80 kr — syntes inte
// någonstans, trots att priserna inkluderar den (lib/shipping.ts: "moms (25 %)
// ingår alltid i priset").

/** Satserna i mervärdesskattelagen. 25 % är normalsatsen och den vi säljer i. */
export const MOMSSATSER = [25, 12, 6] as const;

/**
 * Varornas pris MED moms, så att kvittots rader går ihop:
 *
 *   delsumma + frakt − rabatt = totalt
 *
 * Härlett ur `total` — det enda beloppet vi vet säkert, för det är vad kunden
 * faktiskt betalade. Att i stället summera radernas belopp hade gett en lika
 * riktig varusumma, men inget som garanterat stämmer mot `total` när Wix
 * avrundar per rad.
 *
 * FOTNOT om frakten: specen säger att `shipping` är netto. Med fri frakt (vårt
 * fall idag) spelar det ingen roll — beloppet är 0. Tar vi någon gång betalt
 * för frakt hamnar fraktens moms här i varusumman i stället för på fraktraden.
 * Totalen och momsraden blir ändå rätt; det är bara fördelningen mellan de två
 * raderna som glider. Vill man ha det exakt får fraktens moms hämtas ur
 * `taxInfo.taxBreakdown`, som skiljer på skatteslag.
 */
export function delsummaInklMoms(p: {
  total: number;
  shipping?: number;
  discount?: number;
}): number {
  const v = p.total + (p.discount ?? 0) - (p.shipping ?? 0);
  return Math.max(0, Math.round(v * 100) / 100);
}

/**
 * Momssatsen i hela procent, eller null när beloppen inte entydigt pekar på en
 * av satserna ovan — blandad kundvagn (25 % och 12 % om vartannat), momsfri
 * order, eller avrundningsskräp. Hellre ingen procentsats än en påhittad.
 *
 * Räknas ur beloppen och inte ur `taxBreakdown[].rate`: det fältet är en
 * DECIMAL_VALUE-sträng utan dokumenterad enhet ("0.25" eller "25"?), medan
 * kronorna är otvetydiga.
 */
export function momssats(moms: number, totalInklMoms: number): number | null {
  if (!Number.isFinite(moms) || !Number.isFinite(totalInklMoms)) return null;
  if (moms <= 0 || totalInklMoms <= 0) return null;
  const netto = totalInklMoms - moms;
  if (netto <= 0) return null;
  const kvot = moms / netto;
  for (const sats of MOMSSATSER) {
    // En halv procentenhet marginal — täcker öresavrundning, inte en felaktig sats.
    if (Math.abs(kvot - sats / 100) < 0.005) return sats;
  }
  return null;
}

/**
 * Etiketten på momsraden. "Varav" för att momsen redan ingår i totalen — den
 * ska inte läggas till, bara redovisas.
 */
export function momsetikett(moms: number, totalInklMoms: number): string {
  const sats = momssats(moms, totalInklMoms);
  return sats === null ? "Varav moms" : `Varav moms (${sats} %)`;
}
