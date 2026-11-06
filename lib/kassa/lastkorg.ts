// lib/kassa/lastkorg.ts
//
// Medlemskorgen i vår kassa (Leonard 2026-11-06: medlemmar och företag betalar i
// samma kassa som alla andra). Medlemspriset bor i en egen låst Cart V2
// (lib/medlem/medlemspris.ts) med eget id, en kopia av besökarens varukorg med
// medlemmens priser och låst kupong. När vår kassa med Stripe gäller pekar kakan
// `fp_kassa_korg` ut den låsta korgen, och /kassa räknar, betalar och lägger
// ordern på den i stället för på besökarens vanliga korg.
//
// ☠️ Kakan är httpOnly och korgens id står aldrig i adressen, som GA4 och Meta
// läser. Sidans server läser kakan, prövar att korgen hör till den inloggade
// medlemmen och ännu inte blivit en order, och ger kassan raderna.
//
// Efter köpet tas de köpta varorna bort ur besökarens vanliga korg (den låsta var
// en kopia), en gång per order: webhooken gör det när ordern är betald, och
// kassans sida ber om det direkt efter köpet. Kakan tas bort av sidan.
//
// En offert (E3) byggs ur offertens rader, inte ur besökarens korg. Den har
// ingen besökarkorg att jämföra med eller tömma.
//
// Ren modul utan lokala imports.

export const LAST_KORG_KAKA = "fp_kassa_korg";
/** Lika länge som timjobbet låter en låst korg leva (lib/medlem/korgstadning.ts). */
export const LAST_KORG_SEK = 24 * 60 * 60;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lastKorgId(v: unknown): string | null {
  return typeof v === "string" && GUID.test(v) ? v : null;
}

const KAKA = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

/** Kakan som pekar ut den låsta korgen. */
export function lastKorgKaka(id: string) {
  return { name: LAST_KORG_KAKA, value: id, ...KAKA, maxAge: LAST_KORG_SEK };
}

/** Kakan bort. */
export const LAST_KORG_BORT = { name: LAST_KORG_KAKA, value: "", ...KAKA, maxAge: 0 };

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/**
 * Wix REST svarar med `id`, webbläsarens SDK med `_id`, och kassans rader läser
 * `_id` (lib/cart-shape.ts). Korgen och varje rad får `_id` från `id`.
 */
export function medSdkId(korg: unknown): unknown {
  const k = obj(korg);
  if (!k) return korg;
  const rader = Array.isArray(k.lineItems)
    ? k.lineItems.map((r) => {
        const o = obj(r);
        return o && str(o.id) && !str(o._id) ? { ...o, _id: o.id } : r;
      })
    : k.lineItems;
  return { ...k, ...(str(k.id) && !str(k._id) ? { _id: k.id } : {}), lineItems: rader };
}

/** Får kassan använda den låsta korgen? Den finns, har rader och har inte blivit en order. */
export function lastKorgAnvandbar(korg: unknown): boolean {
  const k = obj(korg);
  if (!k) return false;
  if (k.orderPlaced === true || str(k.orderId)) return false;
  return Array.isArray(k.lineItems) && k.lineItems.length > 0;
}

/** Varans nyckel: produkt och variant. */
export const varuNyckel = (produktId: string, variantId: string | null | undefined) => `${produktId}|${variantId ?? ""}`;

/** En korgrads vara: Cart V2 bär katalogreferensen i `source`, äldre former direkt på raden. */
export function radensNyckel(rad: unknown): string | null {
  const r = obj(rad);
  if (!r) return null;
  const ref = obj(obj(r.source)?.catalogReference) ?? obj(r.catalogReference);
  const produktId = str(ref?.catalogItemId);
  if (!produktId) return null;
  const val = obj(ref?.options);
  return varuNyckel(produktId, str(val?.variantId));
}

/**
 * Raderna i besökarens korg som köptes med medlemskorgen: samma produkt och
 * variant. Hela raden tas bort, också om antalet ändrats sedan.
 */
export function raderAttTaBort(besokarensRader: unknown[], kopta: readonly { produktId: string; variantId?: string | null }[]): string[] {
  const kopt = new Set(kopta.map((k) => varuNyckel(k.produktId, k.variantId)));
  const ut: string[] = [];
  for (const rad of besokarensRader) {
    const nyckel = radensNyckel(rad);
    const id = str(obj(rad)?.id) ?? str(obj(rad)?._id);
    if (nyckel && id && kopt.has(nyckel)) ut.push(id);
  }
  return ut;
}

/** Korgens innehåll som text: vara och antal per rad, sorterat. */
export function innehall(rader: readonly unknown[]): string {
  return rader
    .map((r) => `${radensNyckel(r) ?? "?"}x${typeof obj(r)?.quantity === "number" ? obj(r)!.quantity : 1}`)
    .sort()
    .join(",");
}

/**
 * Gäller den låsta korgen fortfarande? Den hör till besökarens nuvarande korg
 * och har samma varor och antal. Annars har kunden ändrat varukorgen sedan
 * medlemspriset räknades (eller kakan är gammal), och kassan släpper den.
 * En offert saknar besökarkorg och gäller alltid: dess rader är offertens.
 */
export function lastKorgStammer(
  last: { rader: readonly unknown[]; besokarensKorg: string | null },
  besokare: { id: string | null | undefined; rader: readonly unknown[] },
): boolean {
  if (!last.besokarensKorg) return true;
  if (besokare.id && last.besokarensKorg !== besokare.id) return false;
  return innehall(last.rader) === innehall(besokare.rader);
}

/** Ordern som kassan eller webhooken frågar om (Wix Orders, de fält som behövs). */
export interface OrderForRensning {
  cartId?: string | null;
  checkoutId?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
}

/** Wix räknar en order som betald (eller godkänd) med de här lägena. */
export const orderBetald = (o: OrderForRensning | null | undefined): boolean =>
  !!o && (o.paymentStatus === "PAID" || o.paymentStatus === "PARTIALLY_REFUNDED" || o.paymentStatus === "FULLY_REFUNDED" || o.status === "APPROVED");

export type Rensning =
  | { gor: "rensa"; besokarensKorg: string; kopta: { produktId: string; variantId: string | null }[] }
  | { gor: "inget"; varfor: "inget-beslut" | "offert" | "inga-rader" | "redan" | "annan-korg" | "obetald" };

/**
 * Prisbeslutets del av frågan: pekar det ut en besökarkorg (inte en offert),
 * har det köpta rader, och har ingen tömt korgen för det förut? Läses först,
 * så att ordern bara behöver läsas för en medlemskorg.
 */
export function beslutetsRensning(beslut: unknown): Rensning {
  const b = obj(beslut);
  if (!b) return { gor: "inget", varfor: "inget-beslut" };
  const besokarensKorg = str(b.besokarensKorg);
  if (!besokarensKorg) return { gor: "inget", varfor: "offert" };
  if (str(b.besokarensKorgRensad)) return { gor: "inget", varfor: "redan" };
  const kopta = (Array.isArray(b.rader) ? b.rader : [])
    .map((r) => obj(r))
    .filter((r): r is Obj => !!r && !!str(r.produktId))
    .map((r) => ({ produktId: str(r.produktId) as string, variantId: str(r.variantId) }));
  if (kopta.length === 0) return { gor: "inget", varfor: "inga-rader" };
  return { gor: "rensa", besokarensKorg, kopta };
}

/**
 * Ska besökarens korg tömmas på det som köptes? Beslutet ska tillåta det, och
 * ordern ska komma från just den låsta korgen och vara betald.
 */
export function rensningsplan(lastId: string, beslut: unknown, order: OrderForRensning | null | undefined): Rensning {
  const plan = beslutetsRensning(beslut);
  if (plan.gor === "inget") return plan;
  if (!order || (order.cartId !== lastId && order.checkoutId !== lastId)) return { gor: "inget", varfor: "annan-korg" };
  if (!orderBetald(order)) return { gor: "inget", varfor: "obetald" };
  return plan;
}
