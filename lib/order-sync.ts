// lib/order-sync.ts
// Daglig synk: hämtar Wix-ordrar via Orders-API:t och speglar ev. MISSADE in i
// den lokala `orders`-tabellen. Skyddsnätets andra ben — order_created-webhooken
// (app/api/wix-webhook) speglar ordrar i realtid, men om en webhook tappas
// (Wix-leveransfel, deploy-fönster, en 500 under hög last) blir det ett hål i
// dashboard-datat. Det här cronet pollar Wix Orders-API:t och fyller diffen.
//
// Idempotent: varje order upsertas via recordOrder() (ON CONFLICT DO NOTHING på
// order-id), så redan speglade ordrar är no-ops. Wix-ordern från sök-API:t har
// samma shape som webhook-entiteten (`_id`, `priceSummary`, `lineItems`,
// `buyerInfo`, `createdDate`), så recordOrder återanvänds rakt av → en enda
// mappnings-väg, inga divergerande fält.
//
// Om Wix Orders-API:t saknar Read-behörighet (403 READ_ORDER_FORBIDDEN) blir det
// här en no-op och webhook-spegeln förblir enda källan — precis det fall hela
// spegel-arkitekturen finns för. Vi kastar inte; cronet rapporterar ok:false.

import { recordOrder } from "./order-record";

const WIX_ORDERS_SEARCH = "https://www.wixapis.com/ecom/v1/orders/search";

export interface OrderSyncResult {
  ok: boolean;
  fetched: number;
  inserted: number;
  alreadyMirrored: number;
  pages: number;
  note?: string;
}

interface WixOrdersSearchResponse {
  orders?: Record<string, unknown>[];
  metadata?: { cursors?: { next?: string } };
  pagingMetadata?: { cursors?: { next?: string } };
}

export async function syncOrdersFromWix(opts?: {
  lookbackDays?: number;
  maxPages?: number;
}): Promise<OrderSyncResult> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) {
    return {
      ok: false,
      fetched: 0,
      inserted: 0,
      alreadyMirrored: 0,
      pages: 0,
      note: "WIX_API_KEY/WIX_SITE_ID saknas — kan inte synka",
    };
  }

  const days = Math.max(1, Math.min(90, opts?.lookbackDays ?? 14));
  const maxPages = Math.max(1, Math.min(50, opts?.maxPages ?? 20));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let fetched = 0;
  let inserted = 0;
  let alreadyMirrored = 0;
  let pages = 0;
  let cursor: string | undefined;

  try {
    do {
      // Första sidan bär filtret; efterföljande sidor bär bara cursorn (Wix
      // kodar filtret i cursorn och avvisar att man skickar båda).
      const body = cursor
        ? { search: { cursorPaging: { cursor } } }
        : { search: { filter: { createdDate: { $gte: since } }, cursorPaging: { limit: 100 } } };

      const res = await fetch(WIX_ORDERS_SEARCH, {
        method: "POST",
        headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return {
          ok: false,
          fetched,
          inserted,
          alreadyMirrored,
          pages,
          note: `Wix Orders-API ${res.status}${txt ? `: ${txt.slice(0, 200)}` : ""} — spegeln förblir webhook-driven`,
        };
      }

      const data = (await res.json()) as WixOrdersSearchResponse;
      const orders = data.orders ?? [];
      pages += 1;

      for (const order of orders) {
        fetched += 1;
        const r = await recordOrder(order);
        if (r.recorded && (r as { inserted?: boolean }).inserted) inserted += 1;
        else if (r.recorded) alreadyMirrored += 1;
      }

      cursor = data.metadata?.cursors?.next ?? data.pagingMetadata?.cursors?.next ?? undefined;
    } while (cursor && pages < maxPages);

    return { ok: true, fetched, inserted, alreadyMirrored, pages };
  } catch (err) {
    return {
      ok: false,
      fetched,
      inserted,
      alreadyMirrored,
      pages,
      note: err instanceof Error ? err.message : String(err),
    };
  }
}
