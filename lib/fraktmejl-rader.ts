// lib/fraktmejl-rader.ts
//
// Rena hjälpfunktioner för det samlade fraktmejlet (lib/shipping-email-batch.ts):
// vilka rader ett paket bär och om hela ordern är skickad. Egen fil utan
// databasberoende så att testerna kan köra den direkt.

export interface SandningsRad {
  id: string;
  quantity: number;
}

type Obj = Record<string, unknown>;

/** Radernas id och antal i en Wix-fulfillment ({ lineItems: [{ id, quantity }] }). */
export function sandningsRader(fulfillment: Obj | undefined): SandningsRad[] {
  const rader = fulfillment?.lineItems;
  if (!Array.isArray(rader)) return [];
  const ut: SandningsRad[] = [];
  for (const r of rader as Obj[]) {
    const id = String(r.id ?? r._id ?? r.lineItemId ?? "");
    if (id) ut.push({ id, quantity: Number(r.quantity) || 1 });
  }
  return ut;
}

/** Slår ihop flera sändningars rader till en lista med summerat antal per rad. */
export function slaIhopRader(sandningar: Array<{ lineItems: SandningsRad[] }>): SandningsRad[] {
  const antal = new Map<string, number>();
  for (const s of sandningar) {
    for (const r of s.lineItems) antal.set(r.id, (antal.get(r.id) ?? 0) + r.quantity);
  }
  return [...antal].map(([id, quantity]) => ({ id, quantity }));
}

/**
 * Är hela ordern skickad? Wix egen status räcker när den finns; annars jämförs
 * orderns antal per rad med summan över ALLA fulfillments (även de utan
 * spårningsnummer). Hellre "nej" vid tvekan: då går mejlet via cronen i stället.
 */
export function heltSkickad(order: Obj, fulfillments: Obj[]): boolean {
  const status = String(order.fulfillmentStatus ?? "").toUpperCase();
  if (status === "FULFILLED") return true;
  const orderRader = (order.lineItems ?? order.items) as Obj[] | undefined;
  if (!Array.isArray(orderRader) || orderRader.length === 0) return false;
  const skickat = new Map<string, number>();
  for (const r of slaIhopRader(fulfillments.map((f) => ({ lineItems: sandningsRader(f) })))) {
    skickat.set(r.id, r.quantity);
  }
  return orderRader.every((r) => {
    const id = String(r.id ?? r._id ?? "");
    const behov = Number(r.quantity) || 1;
    return id !== "" && (skickat.get(id) ?? 0) >= behov;
  });
}
