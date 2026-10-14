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

export function arObetaldFakturaorder(order: Record<string, unknown>): boolean {
  const kanal = (order.channelInfo as { type?: unknown } | undefined)?.type;
  return kanal === "BACKOFFICE_MERCHANT" && order.paymentStatus === "NOT_PAID";
}

export function betalningstext(order: Record<string, unknown>, betalsatt?: string): string {
  if (arObetaldFakturaorder(order)) return BETALNING_MOT_FAKTURA;
  return betalsatt || BETALNING_BEKRAFTAD;
}
