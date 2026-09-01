// Wix eCom Orders V1 läs-helper för lönsamhetspanelen (/admin/profitability).
//
// Använder POST /ecom/v1/orders/search som är den aktuella eCom-orders-API:t
// för V3-katalogen (vår headless-site e6d27e90-...). Den äldre /stores/v2/orders
// finns kvar för legacy V1-stores men returnerar inte V3-catalogReference-fält.
//
// Vi exponerar en aggregerad bild: enheter sålda per Wix-produkt + per SKU under
// en tidsperiod, samt brutto-intäkt per produkt (för intäkts-/vinst-summan).
//
// OBS: helt read-only — vi modifierar aldrig orderdata.

const WIX_BASE = "https://www.wixapis.com";
const DEFAULT_HEADLESS_SITE_ID = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

function headlessSiteId(): string {
  return process.env.HEADLESS_WIX_SITE_ID || DEFAULT_HEADLESS_SITE_ID;
}

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  return {
    Authorization: token,
    "wix-site-id": headlessSiteId(),
    "Content-Type": "application/json",
  };
}

export interface OrderLineSummary {
  /** Wix V3 productId (catalogItemId). Saknas för manuella/specialrader. */
  productId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
  /** Totalt fakturerat netto inkl. moms i butikens valuta (SEK). */
  grossSek: number;
  /** Order skapad (ISO). */
  createdAt: string;
}

export interface OrderUnitsByProduct {
  /** productId → { units, grossSek, lastSoldAt } */
  byProductId: Record<string, { units: number; grossSek: number; lastSoldAt?: string }>;
  /** sku → { units, grossSek, lastSoldAt } (fallback när productId saknas) */
  bySku: Record<string, { units: number; grossSek: number; lastSoldAt?: string }>;
  /** Total intäkts-summa och orderantal (statusfiltrerat). */
  totalGrossSek: number;
  orderCount: number;
  /** Tidsbucketar per dag (YYYY-MM-DD → grossSek) för trend-grafen. */
  dailyGrossSek: Record<string, number>;
  /** Råa rader (för debug/granulär aggregering). */
  lines: OrderLineSummary[];
}

interface WixOrder {
  id: string;
  number?: string;
  status?: string;
  paymentStatus?: string;
  archived?: boolean;
  _createdDate?: string;
  createdDate?: string;
  lineItems?: WixOrderLineItem[];
  priceSummary?: { total?: { amount?: string } };
  currency?: string;
}

interface WixOrderLineItem {
  id?: string;
  quantity?: number;
  productName?: { original?: string; translated?: string };
  catalogReference?: { catalogItemId?: string; appId?: string };
  physicalProperties?: { sku?: string };
  totalPriceAfterTax?: { amount?: string };
  price?: { amount?: string };
}

/**
 * Hämtar alla orders skapade efter `sinceIso` (paginerat). Default-statusfiltret
 * släpper igenom alla utom INITIATED/CANCELED — vi vill bara räkna riktiga
 * sålda enheter, inte avbrutna varukorgar.
 */
export async function fetchOrders(
  sinceIso: string,
  options?: { includeCancelled?: boolean; maxPages?: number; strict?: boolean },
): Promise<WixOrder[]> {
  const maxPages = options?.maxPages ?? 50;
  const all: WixOrder[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;

    const body: Record<string, unknown> = {
      search: {
        filter: {
          _createdDate: { $gte: sinceIso },
          // Endast riktiga köp — INITIATED är ofullständiga varukorgar.
          ...(options?.includeCancelled
            ? {}
            : { status: { $nin: ["INITIATED", "CANCELED"] } }),
        },
        sort: [{ fieldName: "_createdDate", order: "DESC" }],
        cursorPaging,
      },
    };

    const res = await fetch(`${WIX_BASE}/ecom/v1/orders/search`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      // 403/404 vid tom kollektion eller saknad scope → returnera tomt så att
      // panelen ändå laddar (med "Antal sålda: —"-fallback i UI:t).
      //
      // ☠️ `strict` finns för anropare där tomt INTE är ett harmlöst utfall.
      // Orderåterhämtningen (lib/orders/backfill.ts) jämför Wix-ordrar mot
      // tasks: får den noll ordrar drar den slutsatsen att inget saknas och
      // gör ingenting — ett tyst no-op som ser ut som en frisk körning.
      // Nätet under orderpipelinen får inte kunna sluta fungera osynligt.
      if ((res.status === 403 || res.status === 404) && !options?.strict) return all;
      throw new Error(
        `Wix orders/search misslyckades (${res.status}): ${text.slice(0, 400)}`,
      );
    }
    const data = (await res.json()) as {
      orders?: WixOrder[];
      metadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const o of data.orders ?? []) all.push(o);
    cursor = data.metadata?.cursors?.next;
    if (!cursor || data.metadata?.hasNext === false) break;
    if ((data.orders ?? []).length === 0) break;
  }
  return all;
}

/**
 * Aggregerar order-rader till en produktnyckel-bild. Robust mot rader som
 * saknar productId (matchas då bara via sku).
 */
export function aggregateOrders(orders: Array<Pick<WixOrder, "_createdDate" | "createdDate" | "lineItems" | "priceSummary">>): OrderUnitsByProduct {
  const byProductId: OrderUnitsByProduct["byProductId"] = {};
  const bySku: OrderUnitsByProduct["bySku"] = {};
  const dailyGrossSek: Record<string, number> = {};
  const lines: OrderLineSummary[] = [];
  let totalGrossSek = 0;
  let orderCount = 0;

  for (const o of orders) {
    orderCount++;
    const created = o._createdDate ?? o.createdDate ?? "";
    const day = created.slice(0, 10);
    const orderTotal = parseAmount(o.priceSummary?.total?.amount);
    if (day) dailyGrossSek[day] = round2((dailyGrossSek[day] ?? 0) + orderTotal);
    totalGrossSek = round2(totalGrossSek + orderTotal);

    for (const li of o.lineItems ?? []) {
      const productId = li.catalogReference?.catalogItemId;
      const sku = li.physicalProperties?.sku;
      const quantity = li.quantity ?? 0;
      // Föredra totalPriceAfterTax (radens slutbelopp inkl. moms × kvantitet)
      // — fallback till price × quantity om Wix inte returnerat det.
      const lineGross = parseAmount(li.totalPriceAfterTax?.amount)
        || parseAmount(li.price?.amount) * quantity;

      const productName = li.productName?.translated || li.productName?.original;
      lines.push({ productId, sku, productName, quantity, grossSek: round2(lineGross), createdAt: created });

      if (productId) {
        const cur = byProductId[productId] ?? { units: 0, grossSek: 0, lastSoldAt: undefined };
        cur.units += quantity;
        cur.grossSek = round2(cur.grossSek + lineGross);
        if (!cur.lastSoldAt || created > cur.lastSoldAt) cur.lastSoldAt = created;
        byProductId[productId] = cur;
      }
      if (sku) {
        const cur = bySku[sku] ?? { units: 0, grossSek: 0, lastSoldAt: undefined };
        cur.units += quantity;
        cur.grossSek = round2(cur.grossSek + lineGross);
        if (!cur.lastSoldAt || created > cur.lastSoldAt) cur.lastSoldAt = created;
        bySku[sku] = cur;
      }
    }
  }

  return { byProductId, bySku, totalGrossSek, orderCount, dailyGrossSek, lines };
}

function parseAmount(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Hjälpare: ISO-tid X dagar sedan. */
export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
