// lib/auction-view.ts
//
// Storefrontens läs-vy för Fyndauktionen. Motorn (prisstegning, rotation,
// PATCH:ar) bor i cache-warmer-appen på main-grenen (lib/auction/engine.ts +
// /api/cron/auction-tick); här LÄSER vi bara:
//
//   1. FyndplatsAuctions (Wix Data) — vilka auktioner är live/sålda + stegen.
//   2. Produktkatalogen — priset som VISAS är alltid Wix-priset (källan till
//      sanning = det som debiteras i kassan). Skulle cron-ticken faila visas
//      alltså aldrig ett lägre pris än det kunden betalar.
//
// SÄKERHET: golvpriset och prisstegen skickas ALDRIG till klienten — annars
// kan man läsa ut slutpriset och snajpa golvet. Klienten får bara aktuellt
// pris + tidpunkt för NÄSTA sänkning.

import { getProducts, type Product } from "./products";

const WIX_BASE = "https://www.wixapis.com";
const COL = "FyndplatsAuctions";

function wixDataHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

type AuctionRow = {
  productId?: string;
  slug?: string;
  name?: string;
  listPrice?: number;
  ladder?: number[];
  stepMinutes?: number;
  slot?: number;
  status?: string;
  startAt?: string;
  endedAt?: string;
  soldPrice?: number;
};

/** Det som klienten får se för en live-auktion (inget golv, ingen stege). */
export type LiveAuctionView = {
  slug: string;
  name: string;
  img: string;
  priceNum: number;
  priceFormatted: string;
  listPrice: number;
  discountPercent: number;
  /** ISO för nästa prissänkning, null = golvet nått (sista pris). */
  nextDropAt: string | null;
  slot: number;
  inStock: boolean;
};

export type SoldAuctionView = {
  slug: string;
  name: string;
  img: string;
  soldPrice: number;
  listPrice: number;
  discountPercent: number;
  endedAt: string;
};

async function queryAuctionRows(statuses: string[]): Promise<AuctionRow[]> {
  const h = wixDataHeaders();
  if (!h) return [];
  try {
    const res = await fetch(`${WIX_BASE}/wix-data/v2/items/query`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        dataCollectionId: COL,
        query: { filter: { status: { $in: statuses } }, paging: { limit: 50 } },
      }),
      next: { revalidate: 60, tags: ["auctions"] },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { dataItems?: Array<{ data?: AuctionRow }> };
    return (body.dataItems ?? []).map((d) => d.data ?? {}).filter((d) => d.slug);
  } catch {
    return [];
  }
}

/** Nästa steggräns ur stegen — samma matematik som motorns nextDropAt. */
function nextDropAtOf(row: AuctionRow, nowMs: number): string | null {
  const ladder = row.ladder ?? [];
  if (!row.startAt || !row.stepMinutes || ladder.length < 2) return null;
  const idx = Math.min(
    Math.floor(Math.max(0, nowMs - Date.parse(row.startAt)) / (row.stepMinutes * 60_000)),
    ladder.length - 1,
  );
  if (idx >= ladder.length - 1) return null;
  return new Date(Date.parse(row.startAt) + (idx + 1) * row.stepMinutes * 60_000).toISOString();
}

const fmtKr = (n: number) => `${n.toLocaleString("sv-SE")},00kr`;

/** Live-auktioner (max 5), joinade mot katalogen. Fail-open: tom lista. */
export async function getLiveAuctions(): Promise<LiveAuctionView[]> {
  const [rows, products] = await Promise.all([queryAuctionRows(["live"]), getProducts()]);
  const bySlug = new Map<string, Product>(products.map((p) => [p.slug, p]));
  const now = Date.now();
  return rows
    .map((r) => {
      const p = bySlug.get(r.slug ?? "");
      if (!p || !r.listPrice) return null;
      const discount = Math.max(0, Math.round((1 - p.priceNum / r.listPrice) * 100));
      return {
        slug: p.slug,
        name: p.name,
        img: p.img,
        priceNum: p.priceNum,
        priceFormatted: p.price || fmtKr(p.priceNum),
        listPrice: r.listPrice,
        discountPercent: discount,
        nextDropAt: nextDropAtOf(r, now),
        slot: r.slot ?? 0,
        inStock: p.inStock,
      } satisfies LiveAuctionView;
    })
    .filter((x): x is LiveAuctionView => Boolean(x))
    .sort((a, b) => a.slot - b.slot);
}

/** Senast sålda fynd (för social proof-listan). */
export async function getSoldAuctions(limit = 6): Promise<SoldAuctionView[]> {
  const [rows, products] = await Promise.all([queryAuctionRows(["sold"]), getProducts()]);
  const bySlug = new Map<string, Product>(products.map((p) => [p.slug, p]));
  return rows
    .filter((r) => r.soldPrice && r.listPrice && r.endedAt)
    .sort((a, b) => Date.parse(b.endedAt!) - Date.parse(a.endedAt!))
    .slice(0, limit)
    .map((r) => ({
      slug: r.slug!,
      name: r.name || bySlug.get(r.slug!)?.name || r.slug!,
      img: bySlug.get(r.slug!)?.img || "",
      soldPrice: r.soldPrice!,
      listPrice: r.listPrice!,
      discountPercent: Math.max(0, Math.round((1 - r.soldPrice! / r.listPrice!) * 100)),
      endedAt: r.endedAt!,
    }));
}
