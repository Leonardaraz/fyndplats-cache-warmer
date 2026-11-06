// lib/delivery-order.ts
//
// Orderns paket i spårningstabellen (Wix, `sparning` i lib/wix-lager.ts), för
// levererat-mejlet per order (se
// levereratBeslut i lib/delivery-status). Beslutet är rent och testat där;
// här bor bara läsningarna och skrivningarna.
//
// `levererad_at` är när paketet först rapporterades levererat. updated_at
// duger inte: 17TRACK pushar samma status flera gånger, och varje push skriver
// updated_at, så väntetiden mot de andra paketen hade börjat om varje gång.

import { leveransnotiser, sparning } from "./wix-lager";
import { POLL_MAX_ÅLDER_DAGAR, svepKandidater } from "./delivery-status";

/** Markerar paketet levererat. levererad_at sätts bara första gången. */
export async function markeraLevererad(trackingNumber: string): Promise<void> {
  return sparning.markeraLevererad(trackingNumber);
}

export interface OrderPaket {
  statusar: string[];
  /** Millisekunder, eller null om inget paket har levererats. */
  förstaLevererad: number | null;
}

/** Status för orderns alla paket. 'ambiguous' räknas inte: vi vet inte vems
 *  paket det är, och det ska inte hålla tillbaka mejlet. */
export async function läsOrderPaket(orderId: string): Promise<OrderPaket> {
  const rader: { status: string; levererad_at: Date | string | null }[] = await sparning.forOrder(orderId);
  let förstaLevererad: number | null = null;
  for (const rad of rader) {
    if (!rad.levererad_at) continue;
    const t = new Date(rad.levererad_at).getTime();
    if (Number.isFinite(t) && (förstaLevererad === null || t < förstaLevererad)) förstaLevererad = t;
  }
  return { statusar: rader.map((x) => x.status), förstaLevererad };
}

/** Svepet tar bara ordrar där ett paket levererades de senaste dagarna. Ett
 *  "har levererats"-mejl veckor efter leveransen är mer förvirrande än inget,
 *  och paket som blev levererade innan kolumnen fanns får sin gamla tid. */
export const SVEP_MAX_DAGAR = 10;

export interface OrderAttSvepa {
  order_id: string;
  /** Ett av orderns levererade paket. Sändaren markerar det levererat igen,
   *  vilket inte ändrar något. */
  tracking_number: string;
  customer_email: string;
  customer_name: string | null;
}

/**
 * Ordrar med minst ett levererat paket och inget levererat-mejl. Svepet i
 * /api/cron/ae-delivery-poll prövar dem igen: det sista paketet kan ha
 * kommit fram utan att mejlet gick (Resend-fel, två paket samtidigt), och
 * väntetiden mot paket som aldrig rapporteras kan ha gått ut.
 *
 * ☠️ En order där något paket fick ett eget levererat-mejl före 2026-10-08
 * (nyckeln är då spårningsnumret) räknas inte. Kunden har redan fått sitt
 * mejl, och svepet hade annars skickat ett till för varje gammal order.
 */
export async function ordrarAttSvepa(gräns = 30): Promise<OrderAttSvepa[]> {
  // Urvalet räknas i svepKandidater (lib/delivery-status), där det är testat.
  const nu = Date.now();
  const rader = await sparning.forSvep(new Date(nu - POLL_MAX_ÅLDER_DAGAR * 24 * 60 * 60 * 1000).toISOString());
  const kandidater = svepKandidater(rader, nu, SVEP_MAX_DAGAR);
  const meddelade = await leveransnotiser.medStatus(kandidater.flatMap((k) => k.nycklar), "delivered");
  return kandidater
    .filter((k) => !k.nycklar.some((n) => meddelade.has(n)))
    .slice(0, gräns)
    .map(({ order_id, tracking_number, customer_email, customer_name }) => ({ order_id, tracking_number, customer_email, customer_name }));
}
