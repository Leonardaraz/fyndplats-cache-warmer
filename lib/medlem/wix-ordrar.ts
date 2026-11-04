// lib/medlem/wix-ordrar.ts
//
// Orderuppslagen som orderliggaren behöver: en order, dess transaktioner och
// en sökning på datum. Samma nyckel och behörighet som lib/order-sync.ts
// (Read Orders). Läsningar görs om vid 429 och 5xx, tre försök.
//
// ☠️ Loggar aldrig ordrarnas innehåll, bara status och antal: Vercels loggar
// läses av fler än Leonard, och ordrarna bär namn och adresser.

import type { WixOrder, WixTransaktioner } from "./orderliggare";

const BAS = "https://www.wixapis.com/ecom/v1";
const PAUSER_MS = [0, 1_000, 3_000];

function rubriker(): Record<string, string> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) throw new Error("WIX_API_KEY eller WIX_SITE_ID saknas");
  return { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" };
}

async function anropa<T>(metod: "GET" | "POST", sokvag: string, kropp?: unknown): Promise<{ status: number; json: T | null }> {
  const h = rubriker();
  let senaste = 0;
  for (let i = 0; i < PAUSER_MS.length; i++) {
    if (PAUSER_MS[i]) await new Promise((r) => setTimeout(r, PAUSER_MS[i]));
    let res: Response;
    try {
      res = await fetch(`${BAS}${sokvag}`, {
        method: metod,
        headers: h,
        body: kropp === undefined ? undefined : JSON.stringify(kropp),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      senaste = 0;
      continue;
    }
    senaste = res.status;
    if (res.ok) return { status: res.status, json: (await res.json()) as T };
    if (res.status === 404) return { status: 404, json: null };
    if (res.status !== 429 && res.status < 500) break;
  }
  throw new Error(`Wix ${metod} ${sokvag.split("?")[0].replace(/[0-9a-f-]{36}/g, ":id")}: ${senaste || "nätverk"}`);
}

/** Ordern, eller null om den inte finns. */
export async function hamtaOrder(orderId: string): Promise<WixOrder | null> {
  const { json } = await anropa<{ order?: WixOrder }>("GET", `/orders/${encodeURIComponent(orderId)}`);
  return json?.order ?? null;
}

/**
 * Orderns transaktioner, eller null om Wix inte har några. Null och inte en
 * tom lista: för en återbetald order fäller liggarradUrOrder då raden, i
 * stället för att räkna hela ordern som om inget betalats tillbaka
 * (granskningen 2026-11-04). Nattens avstämning försöker igen.
 */
export async function hamtaTransaktioner(orderId: string): Promise<WixTransaktioner | null> {
  const { json } = await anropa<WixTransaktioner>("GET", `/payments/orders/${encodeURIComponent(orderId)}`);
  return json;
}

export interface Ordersida {
  ordrar: WixOrder[];
  nasta: string | null;
}

/**
 * En sida ordrar där `falt` (createdDate eller updatedDate) är minst `sedanIso`,
 * stigande. Med markör skickas bara markören: Wix kodar filtret i den.
 */
export async function sokOrdrar(falt: "createdDate" | "updatedDate", sedanIso: string, markor: string | null, antal = 100): Promise<Ordersida> {
  const search = markor
    ? { cursorPaging: { cursor: markor, limit: antal } }
    : { filter: { [falt]: { $gte: sedanIso } }, sort: [{ fieldName: falt, order: "ASC" }], cursorPaging: { limit: antal } };
  const { json } = await anropa<{ orders?: WixOrder[]; metadata?: { cursors?: { next?: string } }; pagingMetadata?: { cursors?: { next?: string } } }>(
    "POST",
    "/orders/search",
    { search },
  );
  const ordrar = json?.orders ?? [];
  const nasta = json?.metadata?.cursors?.next ?? json?.pagingMetadata?.cursors?.next ?? null;
  return { ordrar, nasta: ordrar.length ? nasta : null };
}
