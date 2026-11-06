// lib/order-raknas.ts
//
// Vilka Wix-ordrar som är köp. Vår egen kassa (lib/kassa/) skapar ordern innan
// kunden betalar: den står som INITIALIZED tills betalningen kommer, och en
// kund som lämnar betalsidan får sin order avbruten utan att ha betalat
// (CANCELED). Sådana ordrar är inga köp. De ska inte räknas i morgonrapporten,
// i populariteten eller i orderspegeln.
//
// Ett fält som saknas räknas som ett köp: en webhook eller ett äldre svar utan
// status ska aldrig tappa en riktig order. Ren modul utan importer.

/** Betalstatusar där inga pengar någonsin kommit in. */
const ALDRIG_BETALD = new Set(["NOT_PAID", "PENDING", "PENDING_MERCHANT", "CANCELED", "DECLINED", "UNSPECIFIED"]);

export function arKop(order: { status?: unknown; paymentStatus?: unknown } | null | undefined): boolean {
  const status = typeof order?.status === "string" ? order.status.toUpperCase() : "";
  const betalning = typeof order?.paymentStatus === "string" ? order.paymentStatus.toUpperCase() : "";
  if (status === "INITIALIZED") return false;
  if (status === "CANCELED" && ALDRIG_BETALD.has(betalning)) return false;
  return true;
}

/**
 * Samma prov för en rad i medlemmarnas orderliggare (lib/medlem/orderliggare.ts),
 * där fälten heter `orderstatus` och `betalstatus`. Rader skrivna före
 * 2026-11-06 kan vara försök ur vår kassa, och de är inga köp.
 */
export function liggarradArKop(rad: { orderstatus?: unknown; betalstatus?: unknown } | null | undefined): boolean {
  return arKop({ status: rad?.orderstatus, paymentStatus: rad?.betalstatus });
}
