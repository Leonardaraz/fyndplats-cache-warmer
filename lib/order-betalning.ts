// Vad orderbekräftelsen skriver under "Betalning".
//
// En order som läggs upp för hand på faktura (Wix kanal BACKOFFICE_MERCHANT,
// obetald) har inget betalsätt i Wix. Mejlet föll då tillbaka på "Betalning
// bekräftad", och en företagskund fick veta att en obetald faktura var betald
// (2026-10-14). Motorn skickar fakturan i ett eget mejl så fort en sådan order
// skapas (lib/orders/faktura.ts i motorns repo), så det är det mejlet ska
// hänvisa till.
//
// ☠️ Bara den kombinationen ändras. Ett betalsätt som Wix anger visas som
// förut, och en webborder utan betalsätt får samma text som förut.

export const BETALNING_BEKRAFTAD = "Betalning bekräftad";
export const BETALNING_MOT_FAKTURA = "Mot faktura. Fakturan kommer i ett eget mejl.";
/**
 * Förskottsordern från företagskontot (medlemskapet E3, villkoren 5.1): samma
 * obetalda handlagda order, med markören först i noteringen
 * (FORSKOTT_MARKOR i lib/medlem/varukorg.ts; ett prov håller dem lika).
 * Varorna skickas först när fakturan är betald, och det ska mejlet säga.
 */
export const FORSKOTT_MARKOR = "Förskottsfaktura";
export const BETALNING_MOT_FORSKOTT = "Mot förskottsfaktura. Fakturan kommer i ett eget mejl, och vi skickar varorna när den är betald.";

export function arObetaldFakturaorder(order: Record<string, unknown>): boolean {
  const kanal = (order.channelInfo as { type?: unknown } | undefined)?.type;
  return kanal === "BACKOFFICE_MERCHANT" && order.paymentStatus === "NOT_PAID";
}

export function arForskottsorder(order: Record<string, unknown>): boolean {
  const notering = typeof order.buyerNote === "string" ? order.buyerNote : "";
  return arObetaldFakturaorder(order) && notering.trim().toLowerCase().startsWith(FORSKOTT_MARKOR.toLowerCase());
}

export function betalningstext(order: Record<string, unknown>, betalsatt?: string): string {
  if (arObetaldFakturaorder(order)) return arForskottsorder(order) ? BETALNING_MOT_FORSKOTT : BETALNING_MOT_FAKTURA;
  return betalsatt || BETALNING_BEKRAFTAD;
}
