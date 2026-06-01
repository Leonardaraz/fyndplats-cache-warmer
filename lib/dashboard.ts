// lib/dashboard.ts
// All datainsamling för morgon-dashboarden (app/admin/dashboard) + morgonmejlet.
// En enda buildDashboard() hämtar ALLT parallellt via Promise.all och degraderar
// varje sektion oberoende: en trasig källa (DB nere, API saknar behörighet,
// env-variabel ej satt) ger ett { connected:false, note } istället för att fälla
// hela sidan. Inget kastar uppåt.
//
// Datakällor och deras status (2026-06-02):
//   • Orders      → lokal `orders`-tabell (speglad från order_created-webhooken).
//                   Wix Orders-API:t är 403 (nyckeln saknar Read Orders) → fallback.
//   • Lager       → getProducts() (publika OAuth-SDK:t, fungerar). stock.quantity.
//   • Abandoned   → Postgres `abandoned_carts` (status != 'converted').
//   • Nyhetsbrev  → Postgres `newsletter_subscribers`.
//   • Analytics   → GA4 Data API om GA4_PROPERTY_ID + GA4_ACCESS_TOKEN finns,
//                   annars "ej kopplat".
//   • Meta Ads    → om META_ADS_ACCESS_TOKEN + META_ADS_ACCOUNT_ID finns, annars
//                   "ej kopplat".

import { sql } from "./db";
import { getProducts, type Product } from "./products";

const STOCKHOLM_TZ = "Europe/Stockholm";
const LOW_STOCK_THRESHOLD = 5;
const STALE_DAYS = 90;
const STALE_HIGH_STOCK = 10;

// ---------------------------------------------------------------------------
// Datum-hjälpare (allt i svensk tidszon så "igår" stämmer med Leonards dygn)
// ---------------------------------------------------------------------------

/** YYYY-MM-DD i svensk tidszon för ett givet datum. */
function ymdStockholm(d: Date): string {
  // en-CA ger ISO-likt YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Senaste N kalenderdagarna (äldst först), inkl. idag, som YYYY-MM-DD-strängar. */
function lastNDates(n: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(ymdStockholm(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Typer
// ---------------------------------------------------------------------------

export type TopProduct = { name: string; qty: number; revenueMinor: number };
export type DayPoint = { date: string; orders: number; revenueMinor: number };

export type OrdersSection = {
  source: "wix-api" | "local-mirror";
  last24h: { orders: number; revenueMinor: number; aov: number; currency: string };
  topProducts: TopProduct[];
  trend7d: DayPoint[];
  note?: string;
};

export type InventorySection = {
  total: number;
  lowStock: { name: string; slug: string; qty: number }[];
  outOfStock: { name: string; slug: string }[];
  staleHighStock: { name: string; slug: string; qty: number }[];
  staleNote: string;
  syncFailNote: string;
};

export type AbandonedSection = {
  available: boolean;
  notRecovered24h: number;
  pendingTotal: number;
  note?: string;
};

export type NewsletterSection = { available: boolean; new7d: number; total: number; note?: string };

export type AnalyticsSection = {
  connected: boolean;
  visitors24h?: number;
  conversionPct?: number | null;
  topSources?: { source: string; sessions: number }[];
  note?: string;
};

export type MarketingSection = {
  metaConnected: boolean;
  metaSpendYesterday?: number;
  metaRoas?: number | null;
  note?: string;
};

export type ServiceSection = {
  returnsAvailable: boolean;
  openReturns: number;
  unreadInboxNote: string;
  returnsNote?: string;
};

export type DashboardData = {
  generatedAt: string;
  orders: OrdersSection;
  inventory: InventorySection;
  abandoned: AbandonedSection;
  newsletter: NewsletterSection;
  analytics: AnalyticsSection;
  marketing: MarketingSection;
  service: ServiceSection;
  warnings: string[]; // topp-varningar för mejl-tl;dr
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

type OrderRow = {
  total_minor: number;
  currency: string;
  items_json: { name: string; qty: number; lineMinor: number }[];
  created_at: string;
};

function aggregateOrders(rows: OrderRow[], now: Date): Omit<OrdersSection, "source" | "note"> {
  const dates = lastNDates(7, now);
  const byDate = new Map<string, DayPoint>(dates.map((d) => [d, { date: d, orders: 0, revenueMinor: 0 }]));
  const cutoff24h = now.getTime() - 24 * 60 * 60 * 1000;

  let o24 = 0;
  let rev24 = 0;
  const topMap = new Map<string, TopProduct>();
  let currency = "SEK";

  for (const r of rows) {
    const created = new Date(r.created_at);
    const ymd = ymdStockholm(created);
    const bucket = byDate.get(ymd);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenueMinor += r.total_minor || 0;
    }
    if (r.currency) currency = r.currency;
    if (created.getTime() >= cutoff24h) {
      o24 += 1;
      rev24 += r.total_minor || 0;
      for (const it of r.items_json || []) {
        const key = it.name || "Produkt";
        const cur = topMap.get(key) ?? { name: key, qty: 0, revenueMinor: 0 };
        cur.qty += it.qty || 0;
        cur.revenueMinor += it.lineMinor || 0;
        topMap.set(key, cur);
      }
    }
  }

  const topProducts = [...topMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);
  return {
    last24h: { orders: o24, revenueMinor: rev24, aov: o24 ? Math.round(rev24 / o24) : 0, currency },
    topProducts,
    trend7d: dates.map((d) => byDate.get(d)!),
  };
}

async function getOrdersSection(now: Date): Promise<OrdersSection> {
  // 1. Försök Wix Orders-API:t (auktoritativt om behörigheten finns).
  try {
    const wix = await tryWixOrders(now);
    if (wix) return wix;
  } catch {
    /* faller igenom till lokal spegel */
  }

  // 2. Fallback: lokal spegel-tabell.
  try {
    const since = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const res = await sql/*sql*/`
      SELECT total_minor, currency, items_json, created_at
        FROM orders
       WHERE created_at >= ${since}
       ORDER BY created_at DESC
    `;
    const agg = aggregateOrders(res.rows as unknown as OrderRow[], now);
    return {
      source: "local-mirror",
      ...agg,
      note:
        "Källa: lokal order-spegel (Wix Orders-API saknar Read-behörighet på nyckeln). " +
        "Visar ordrar gjorda efter att speglingen aktiverades.",
    };
  } catch (e) {
    return {
      source: "local-mirror",
      last24h: { orders: 0, revenueMinor: 0, aov: 0, currency: "SEK" },
      topProducts: [],
      trend7d: lastNDates(7, now).map((d) => ({ date: d, orders: 0, revenueMinor: 0 })),
      note: `Ingen orderdata: ${(e as Error).message}`,
    };
  }
}

/** Returnerar null om Wix-API:t inte är tillgängligt (behörighet/fel) → använd spegel. */
async function tryWixOrders(now: Date): Promise<OrdersSection | null> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) return null;
  const since = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch("https://www.wixapis.com/ecom/v1/orders/search", {
    method: "POST",
    headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
    body: JSON.stringify({
      search: { filter: { createdDate: { $gte: since } }, cursorPaging: { limit: 100 } },
    }),
    cache: "no-store",
  });
  if (!res.ok) return null; // 403 READ_ORDER_FORBIDDEN m.m. → spegel
  const data = await res.json();
  const orders = (data?.orders ?? []) as Record<string, unknown>[];
  const rows: OrderRow[] = orders.map((o) => {
    const totals = (o.priceSummary ?? {}) as { total?: { amount?: string; currency?: string } };
    const items = ((o.lineItems ?? []) as Record<string, unknown>[]).map((li) => ({
      name:
        (li.productName as { original?: string })?.original ??
        (li.productName as string) ??
        "Produkt",
      qty: Number(li.quantity ?? 1) || 1,
      lineMinor: Math.round(parseFloat(((li.totalPriceAfterTax ?? li.price) as { amount?: string })?.amount ?? "0") * 100) || 0,
    }));
    return {
      total_minor: Math.round(parseFloat(totals.total?.amount ?? "0") * 100) || 0,
      currency: totals.total?.currency ?? "SEK",
      items_json: items,
      created_at: (o.createdDate as string) ?? new Date().toISOString(),
    };
  });
  return { source: "wix-api", ...aggregateOrders(rows, now) };
}

// ---------------------------------------------------------------------------
// Lager (från produkt-SDK:t — fungerar utan Orders/Inventory-behörighet)
// ---------------------------------------------------------------------------

async function getInventorySection(): Promise<InventorySection> {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }
  const low: InventorySection["lowStock"] = [];
  const oos: InventorySection["outOfStock"] = [];
  for (const p of products) {
    const q = p.stockQuantity;
    if (!p.inStock || q === 0) {
      oos.push({ name: p.name, slug: p.slug });
    } else if (typeof q === "number" && q > 0 && q < LOW_STOCK_THRESHOLD) {
      low.push({ name: p.name, slug: p.slug, qty: q });
    }
  }
  low.sort((a, b) => a.qty - b.qty);
  return {
    total: products.length,
    lowStock: low,
    outOfStock: oos,
    // "Slut >3 dagar" och "osåld 90+ dagar" kräver historik/försäljningsdata som
    // vi inte har förrän order-speglingen ackumulerat data. Visas som not tills dess.
    staleHighStock: [],
    staleNote:
      `Kräver order-historik (≥${STALE_DAYS} dagar) — ackumuleras i order-spegeln framöver. ` +
      `Tröskel: osåld ${STALE_DAYS}+ dagar med lager ≥${STALE_HIGH_STOCK}.`,
    syncFailNote: "Ingen AliExpress-synk-logg kopplad — lägg till en synk-status-tabell för att visa fel här.",
  };
}

// ---------------------------------------------------------------------------
// Övergivna kundvagnar
// ---------------------------------------------------------------------------

async function getAbandonedSection(now: Date): Promise<AbandonedSection> {
  try {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    // "Inte återhämtade senaste 24h": kundvagnar som blev övergivna senaste dygnet
    // och INTE konverterat till order.
    const r24 = await sql/*sql*/`
      SELECT COUNT(*)::int AS n FROM abandoned_carts
       WHERE abandoned_at >= ${since} AND status <> 'converted'
    `;
    const rPending = await sql/*sql*/`
      SELECT COUNT(*)::int AS n FROM abandoned_carts WHERE status = 'pending'
    `;
    return {
      available: true,
      notRecovered24h: (r24.rows[0]?.n as number) ?? 0,
      pendingTotal: (rPending.rows[0]?.n as number) ?? 0,
    };
  } catch (e) {
    return { available: false, notRecovered24h: 0, pendingTotal: 0, note: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Nyhetsbrev
// ---------------------------------------------------------------------------

async function getNewsletterSection(now: Date): Promise<NewsletterSection> {
  try {
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const r7 = await sql/*sql*/`
      SELECT COUNT(*)::int AS n FROM newsletter_subscribers
       WHERE subscribed_at >= ${since} AND status = 'subscribed'
    `;
    const rTotal = await sql/*sql*/`
      SELECT COUNT(*)::int AS n FROM newsletter_subscribers WHERE status = 'subscribed'
    `;
    return { available: true, new7d: (r7.rows[0]?.n as number) ?? 0, total: (rTotal.rows[0]?.n as number) ?? 0 };
  } catch (e) {
    return { available: false, new7d: 0, total: 0, note: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Analytics (GA4 Data API — valfritt, degraderar till "ej kopplat")
// ---------------------------------------------------------------------------

async function getAnalyticsSection(orders24h: number): Promise<AnalyticsSection> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const accessToken = process.env.GA4_ACCESS_TOKEN;
  if (!propertyId || !accessToken) {
    return {
      connected: false,
      note: "Ej kopplat — sätt GA4_PROPERTY_ID + GA4_ACCESS_TOKEN (eller använd Vercel Analytics referrer-export).",
    };
  }
  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          limit: 5,
        }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return { connected: false, note: `GA4 svarade ${res.status} — kontrollera token/behörighet.` };
    }
    const data = await res.json();
    const rows = (data?.rows ?? []) as { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
    let visitors = 0;
    const topSources: { source: string; sessions: number }[] = [];
    for (const row of rows) {
      const sessions = Number(row.metricValues?.[0]?.value ?? 0);
      visitors += Number(row.metricValues?.[1]?.value ?? 0);
      topSources.push({ source: row.dimensionValues?.[0]?.value ?? "(okänd)", sessions });
    }
    topSources.sort((a, b) => b.sessions - a.sessions);
    const totalSessions = topSources.reduce((n, s) => n + s.sessions, 0);
    return {
      connected: true,
      visitors24h: visitors,
      conversionPct: totalSessions ? Math.round((orders24h / totalSessions) * 1000) / 10 : null,
      topSources: topSources.slice(0, 5),
    };
  } catch (e) {
    return { connected: false, note: `GA4-fel: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Marknadsföring (Meta Ads — valfritt)
// ---------------------------------------------------------------------------

async function getMarketingSection(revenue24hMinor: number): Promise<MarketingSection> {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const account = process.env.META_ADS_ACCOUNT_ID;
  if (!token || !account) {
    return {
      metaConnected: false,
      note: "Inte kopplat — lägg till META_ADS_ACCESS_TOKEN + META_ADS_ACCOUNT_ID.",
    };
  }
  try {
    const acct = account.startsWith("act_") ? account : `act_${account}`;
    const url =
      `https://graph.facebook.com/v19.0/${acct}/insights` +
      `?fields=spend&date_preset=yesterday&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { metaConnected: false, note: `Meta Ads svarade ${res.status}.` };
    const data = await res.json();
    const spend = parseFloat(data?.data?.[0]?.spend ?? "0") || 0;
    const revenueSek = revenue24hMinor / 100;
    return {
      metaConnected: true,
      metaSpendYesterday: spend,
      metaRoas: spend > 0 ? Math.round((revenueSek / spend) * 100) / 100 : null,
    };
  } catch (e) {
    return { metaConnected: false, note: `Meta Ads-fel: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Kundservice (returer — FyndplatsReturns finns ej; inbox kräver mail-MCP)
// ---------------------------------------------------------------------------

async function getServiceSection(): Promise<ServiceSection> {
  // FyndplatsReturns-collection / returns-tabell finns inte ännu.
  return {
    returnsAvailable: false,
    openReturns: 0,
    unreadInboxNote:
      "Olästa mejl: ingen Gmail/Outlook-MCP kopplad server-side — se Resend inbound eller info@fyndplats.com direkt.",
    returnsNote: "Ingen returns-datakälla (FyndplatsReturns saknas) — koppla en returns-tabell för att visa här.",
  };
}

// ---------------------------------------------------------------------------
// Huvudfunktion
// ---------------------------------------------------------------------------

export async function buildDashboard(now = new Date()): Promise<DashboardData> {
  const [orders, inventory, abandoned, newsletter] = await Promise.all([
    getOrdersSection(now),
    getInventorySection(),
    getAbandonedSection(now),
    getNewsletterSection(now),
  ]);
  // Analytics + marknadsföring behöver order-siffror → hämtas efter (men billiga).
  const [analytics, marketing, service] = await Promise.all([
    getAnalyticsSection(orders.last24h.orders),
    getMarketingSection(orders.last24h.revenueMinor),
    getServiceSection(),
  ]);

  const warnings: string[] = [];
  if (inventory.outOfStock.length > 0) warnings.push(`${inventory.outOfStock.length} produkter slut i lager`);
  if (inventory.lowStock.length > 0) warnings.push(`${inventory.lowStock.length} produkter med lågt lager (<${LOW_STOCK_THRESHOLD})`);
  if (abandoned.available && abandoned.notRecovered24h > 0)
    warnings.push(`${abandoned.notRecovered24h} ej återhämtade kundvagnar (24h)`);

  return {
    generatedAt: now.toISOString(),
    orders,
    inventory,
    abandoned,
    newsletter,
    analytics,
    marketing,
    service,
    warnings: warnings.slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Format-hjälpare (delas av sida + mejl)
// ---------------------------------------------------------------------------

export function sek(minor: number): string {
  return (minor / 100).toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}
