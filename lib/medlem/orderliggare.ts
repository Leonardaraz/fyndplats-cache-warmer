// lib/medlem/orderliggare.ts
//
// En Wix-order blir en rad i orderliggaren (`FyndplatsOrderliggare`), källan
// för medlemsnivån. Ren modul utan lokala imports: den prövas med
// `node --test --experimental-strip-types` (orderliggare.test.ts).
//
// Uppmätt på provordern i E0 (2026-11-04), och det styr formen:
//   - Betaltiden står som en händelse i ordern: `activities[]` med typen
//     ORDER_PAID. En fakturaorder som betalas senare får händelsen då, så
//     köpet räknas från betalningen och inte från beställningen [P1].
//   - `priceSummary.subtotal` och `.shipping` är UTAN moms, fast priserna
//     visas med moms. Varuvärdet tas därför ur raderna (`totalPriceAfterTax`,
//     efter alla rabatter och med moms) och frakten ur `shippingInfo.cost`.
//   - Varje återbetalning anger varuvärdet per rad i
//     `summary.breakdown.lineItems`, och frakten för sig. Den finns bara i
//     Order Transactions-API:t, som därför läses när ordern har återbetalats.
//
// Belopp är heltal i öre. Ingenting här loggar.

export type WixOrder = Record<string, unknown>;
export type WixTransaktioner = Record<string, unknown>;

export interface Liggarrad {
  orderId: string;
  ordernummer: string;
  /** Köparens e-post, trimmad och med gemener. Tom om ordern saknar den. */
  epost: string;
  purchaseFlowId?: string;
  kanal: string;
  /** När ordern lades (ISO). */
  bestalld: string;
  /** När ordern blev betald (ISO). Saknas för en obetald order. */
  betald?: string;
  /** Wix `status`, t.ex. APPROVED eller CANCELED. */
  orderstatus: string;
  /** Wix `paymentStatus`. */
  betalstatus: string;
  /** Räknas i K: betald, inte avbruten och i kronor. */
  raknas: boolean;
  /** Varför ordern inte räknas, när den inte gör det. */
  orsak?: "obetald" | "avbruten" | "valuta";
  /** Rabattberättigade rader P·q med moms, i öre. */
  varorOre: number;
  fraktOre: number;
  totaltOre: number;
  aterbetaltVarorOre: number;
  aterbetalningar: { id: string; tid: string; varorOre: number }[];
  rader: { namn: string; produktId?: string; variantId?: string; antal: number; beloppOre: number; raknas: boolean }[];
  /** Rader, frakt och avgifter går jämnt upp mot orderns total. */
  summaStammer: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Små läsare
// ─────────────────────────────────────────────────────────────────────────────

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const lista = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.map(obj) : []);
const text = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/**
 * Wix-pengar i öre, exakt: `{ amount: "12.34" }`, `"12.34"` eller 12.34.
 * Mer än två decimaler avrundas half up.
 */
export function ore(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) : 0;
  if (typeof v === "string") {
    const m = /^\s*(-?)(\d+)(?:[.,](\d+))?\s*$/.exec(v);
    if (!m) return 0;
    const dec = (m[3] ?? "").padEnd(3, "0");
    let n = Number(m[2]) * 100 + Number(dec.slice(0, 2));
    if (Number(dec[2]) >= 5) n += 1;
    return m[1] === "-" ? -n : n;
  }
  const o = obj(v);
  if ("amount" in o) return ore(o.amount);
  if ("value" in o) return ore(o.value);
  return 0;
}

/** Samma regel som inloggningen: trimmad och med gemener. */
export function epostNyckel(v: unknown): string {
  return text(v).toLowerCase();
}

const BETALDA = new Set(["PAID", "PARTIALLY_REFUNDED", "FULLY_REFUNDED"]);

/** Fysisk vara: varken presentkort, tjänst eller digital vara. */
function arVara(rad: Record<string, unknown>): boolean {
  const preset = text(obj(rad.itemType).preset);
  if (preset) return preset === "PHYSICAL";
  return obj(rad.physicalProperties).shippable === true;
}

function radBelopp(rad: Record<string, unknown>): number {
  if (rad.totalPriceAfterTax != null) return ore(rad.totalPriceAfterTax);
  const antal = Number(rad.quantity ?? 1) || 1;
  return ore(rad.price) * antal - ore(rad.totalDiscount);
}

function forstaIso(...v: unknown[]): string | undefined {
  for (const x of v) {
    const t = text(x);
    if (t && !Number.isNaN(new Date(t).getTime())) return new Date(t).toISOString();
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Betaltiden och återbetalningarna
// ─────────────────────────────────────────────────────────────────────────────

/** Behövs Order Transactions för återbetalningarna? */
export function behoverTransaktioner(order: WixOrder): boolean {
  const b = obj(order.balanceSummary);
  if (ore(b.refunded) > 0 || ore(b.pendingRefund) > 0) return true;
  const status = text(order.paymentStatus);
  return status === "PARTIALLY_REFUNDED" || status === "FULLY_REFUNDED";
}

/** Betaltiden: första ORDER_PAID, annars första godkända betalningen, annars köptiden. */
export function betaltid(order: WixOrder, tx: WixTransaktioner | null | undefined): string | undefined {
  const betalda = lista(order.activities)
    .filter((a) => text(a.type) === "ORDER_PAID" || text(a.activityType) === "ORDER_PAID")
    .map((a) => forstaIso(a.createdDate))
    .filter((t): t is string => Boolean(t))
    .sort();
  if (betalda.length) return betalda[0];
  if (!BETALDA.has(text(order.paymentStatus))) return undefined;
  const betalningar = lista(obj(obj(tx).orderTransactions).payments)
    .filter((p) => ["APPROVED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(text(p.status) || text(obj(p.regularPaymentDetails).status)))
    .map((p) => forstaIso(p.createdDate))
    .filter((t): t is string => Boolean(t))
    .sort();
  return betalningar[0] ?? forstaIso(order.purchasedDate, order.createdDate);
}

/**
 * Återbetalningarnas varuvärde, per återbetalning och med dess datum. Bara de
 * rabattberättigade raderna räknas; frakt och avgifter aldrig (E1-6). En
 * återbetalning vars alla transaktioner misslyckats räknas inte.
 */
export function aterbetalningar(
  tx: WixTransaktioner | null | undefined,
  raknadeRadIdn: Set<string>,
  varorOre: number,
): Liggarrad["aterbetalningar"] {
  const ut: Liggarrad["aterbetalningar"] = [];
  for (const r of lista(obj(obj(tx).orderTransactions).refunds)) {
    const transaktioner = lista(r.transactions);
    if (transaktioner.length > 0 && transaktioner.every((t) => text(t.refundStatus) === "FAILED")) continue;
    const id = text(r.id);
    const tid = forstaIso(r.createdDate);
    if (!id || !tid) continue;
    const summary = obj(r.summary);
    const details = obj(r.details);
    const perRad = lista(obj(summary.breakdown).lineItems);
    let varor: number;
    if (perRad.length > 0) {
      varor = perRad
        .filter((x) => raknadeRadIdn.has(text(x.lineItemId)))
        .reduce((s, x) => s + ore(x.totalRefundedAmount), 0);
    } else {
      // Ett fritt belopp utan rader: det som inte är frakt eller avgifter.
      const belopp = ore(summary.refunded) || ore(summary.requestedRefund);
      const frakt = details.shippingIncluded === true ? ore(obj(details.shipping).amount) : 0;
      const avgifter = lista(details.additionalFees).reduce((s, f) => s + ore(f.amount ?? obj(f).price), 0);
      varor = Math.max(0, belopp - frakt - avgifter);
    }
    ut.push({ id, tid, varorOre: Math.max(0, varor) });
  }
  ut.sort((a, b) => a.tid.localeCompare(b.tid) || a.id.localeCompare(b.id));
  // Aldrig mer tillbaka än varorna kostade: överskottet tas från de senaste.
  let over = ut.reduce((s, a) => s + a.varorOre, 0) - varorOre;
  for (let i = ut.length - 1; i >= 0 && over > 0; i--) {
    const minska = Math.min(over, ut[i].varorOre);
    ut[i] = { ...ut[i], varorOre: ut[i].varorOre - minska };
    over -= minska;
  }
  return ut;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raden
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raden för en order. `tx` är Order Transactions-svaret; det krävs när
 * `behoverTransaktioner(order)` är sant, annars kastar funktionen hellre än
 * att räkna en återbetald order som hel.
 */
export function liggarradUrOrder(order: WixOrder, tx?: WixTransaktioner | null): Liggarrad {
  const orderId = text(order.id) || text(order._id);
  if (!orderId) throw new Error("ordern saknar id");
  if (behoverTransaktioner(order) && !tx) throw new Error("återbetald order utan transaktioner");

  const rader: Liggarrad["rader"] = [];
  const raknadeRadIdn = new Set<string>();
  for (const li of lista(order.lineItems)) {
    const vara = arVara(li);
    const ref = obj(li.catalogReference);
    const namn = text(obj(li.productName).original) || text(li.productName) || "Produkt";
    const antal = Number(li.quantity ?? 1) || 1;
    rader.push({
      namn,
      produktId: text(ref.catalogItemId) || undefined,
      variantId: text(obj(ref.options).variantId) || undefined,
      antal,
      beloppOre: radBelopp(li),
      raknas: vara,
    });
    if (vara && text(li.id)) raknadeRadIdn.add(text(li.id));
  }
  const varorOre = rader.filter((r) => r.raknas).reduce((s, r) => s + r.beloppOre, 0);
  const fraktOre = ore(obj(obj(order.shippingInfo).cost).totalPriceAfterTax ?? obj(obj(order.shippingInfo).cost).price);
  const ps = obj(order.priceSummary);
  const totaltOre = ore(ps.total ?? ps.totalPrice);
  const avgifterOre = lista(order.additionalFees).reduce((s, f) => s + ore(f.priceAfterTax ?? f.price), 0);
  const allaRaderOre = rader.reduce((s, r) => s + r.beloppOre, 0);
  const summaStammer = Math.abs(allaRaderOre + fraktOre + avgifterOre - totaltOre) <= 1;

  const orderstatus = text(order.status);
  const betalstatus = text(order.paymentStatus);
  const betald = betaltid(order, tx);
  const valuta = text(order.currency) || "SEK";
  let orsak: Liggarrad["orsak"];
  if (orderstatus === "CANCELED") orsak = "avbruten";
  else if (!betald) orsak = "obetald";
  else if (valuta !== "SEK") orsak = "valuta";

  const aterbetalt = aterbetalningar(tx, raknadeRadIdn, varorOre);
  const rad: Liggarrad = {
    orderId,
    ordernummer: text(order.number) || orderId,
    epost: epostNyckel(obj(order.buyerInfo).email),
    kanal: text(obj(order.channelInfo).type) || "UNSPECIFIED",
    bestalld: forstaIso(order.purchasedDate, order.createdDate) ?? new Date(0).toISOString(),
    orderstatus,
    betalstatus,
    raknas: !orsak,
    varorOre,
    fraktOre,
    totaltOre,
    aterbetaltVarorOre: aterbetalt.reduce((s, a) => s + a.varorOre, 0),
    aterbetalningar: aterbetalt,
    rader,
    summaStammer,
  };
  const flode = text(order.purchaseFlowId);
  if (flode) rad.purchaseFlowId = flode;
  if (betald) rad.betald = betald;
  if (orsak) rad.orsak = orsak;
  return rad;
}

/** Fälten som skiljer två rader åt, för avstämningen. Tomt = lika. */
export function skillnader(a: Liggarrad, b: Liggarrad): string[] {
  const falt: (keyof Liggarrad)[] = [
    "ordernummer",
    "epost",
    "betald",
    "orderstatus",
    "betalstatus",
    "raknas",
    "varorOre",
    "fraktOre",
    "totaltOre",
    "aterbetaltVarorOre",
  ];
  const ut: string[] = falt.filter((f) => (a[f] ?? null) !== (b[f] ?? null));
  const nyckel = (r: Liggarrad) => r.aterbetalningar.map((x) => `${x.id}:${x.tid}:${x.varorOre}`).join("|");
  if (nyckel(a) !== nyckel(b)) ut.push("aterbetalningar");
  return ut;
}

/** En rad som den läses tillbaka ur Wix: fält som saknas får sina tomma värden. */
export function liggarradUrWix(d: Record<string, unknown>): Liggarrad {
  const rad: Liggarrad = {
    orderId: text(d.orderId) || text(d._id),
    ordernummer: text(d.ordernummer),
    epost: text(d.epost),
    kanal: text(d.kanal),
    bestalld: text(d.bestalld),
    orderstatus: text(d.orderstatus),
    betalstatus: text(d.betalstatus),
    raknas: d.raknas === true,
    varorOre: Number(d.varorOre) || 0,
    fraktOre: Number(d.fraktOre) || 0,
    totaltOre: Number(d.totaltOre) || 0,
    aterbetaltVarorOre: Number(d.aterbetaltVarorOre) || 0,
    aterbetalningar: lista(d.aterbetalningar).map((a) => ({ id: text(a.id), tid: text(a.tid), varorOre: Number(a.varorOre) || 0 })),
    rader: lista(d.rader).map((r) => ({
      namn: text(r.namn),
      produktId: text(r.produktId) || undefined,
      variantId: text(r.variantId) || undefined,
      antal: Number(r.antal) || 0,
      beloppOre: Number(r.beloppOre) || 0,
      raknas: r.raknas === true,
    })),
    summaStammer: d.summaStammer === true,
  };
  if (text(d.purchaseFlowId)) rad.purchaseFlowId = text(d.purchaseFlowId);
  if (text(d.betald)) rad.betald = text(d.betald);
  const orsak = text(d.orsak);
  if (orsak === "obetald" || orsak === "avbruten" || orsak === "valuta") rad.orsak = orsak;
  return rad;
}
