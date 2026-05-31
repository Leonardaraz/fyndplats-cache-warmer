// GET /api/admin/profitability — aggregerar lönsamhet per produkt.
//
// Hämtar parallellt:
//   1. V3-katalogens produkter (sälj-pris, lagerstatus, bild)
//   2. FyndplatsMappings (inköpskostnad per variant från importpipeline)
//   3. FyndplatsImportCosts (manuella overrides — tom collection = OK)
//   4. eCom orders (antal sålda + brutto under perioden)
// Joiner och returnerar ProfitabilityReport. Cachas 5 min via unstable_cache
// (admin-bara: ingen risk för stale data för slutkund).
//
// Endpoint är skyddad av samma EXTENSION_API_TOKEN som andra interna API:er.
// Server-component-sidan /admin/profitability anropar funktionen direkt
// utan HTTP/token, så denna route är primärt för manuell debug / CSV-pull.

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import { listAllV3Products } from "@/lib/wix/v3-products";
import { aggregateOrders, fetchOrders, isoDaysAgo } from "@/lib/wix/orders";
import {
  computeProfitabilityReport,
  type ProductInput,
  type ProfitabilityReport,
} from "@/lib/analytics/profitability";
import { profitabilitySettingsFromEnv } from "@/lib/settings";

export const dynamic = "force-dynamic";
// Hela join:en kan ta ett par sekunder första gången; ge route tid.
export const maxDuration = 60;

export type ProfitabilityPeriod = "30d" | "90d" | "all";

function daysFor(period: ProfitabilityPeriod): number {
  if (period === "30d") return 30;
  if (period === "all") return 3650; // 10 år = "hela tiden" i praktiken
  return 90;
}

/**
 * Bygger rapporten utan HTTP. Exporteras så att server-komponenter
 * kan kalla den direkt (sparar in en runtrip + token).
 */
export async function buildReport(period: ProfitabilityPeriod = "90d"): Promise<ProfitabilityReport> {
  const periodDays = daysFor(period);
  const sinceIso = isoDaysAgo(periodDays);

  const settings = profitabilitySettingsFromEnv();

  const [productsRaw, mappings, importCosts, orders] = await Promise.all([
    listAllV3Products().catch((err) => {
      console.warn("[profitability] listAllV3Products misslyckades:", err);
      return [];
    }),
    getStore().listMappings().catch((err) => {
      console.warn("[profitability] listMappings misslyckades:", err);
      return [];
    }),
    getImportCostStore().listAll().catch((err) => {
      console.warn("[profitability] importCosts.listAll misslyckades:", err);
      return [];
    }),
    fetchOrders(sinceIso).catch((err) => {
      console.warn("[profitability] fetchOrders misslyckades:", err);
      return [];
    }),
  ]);

  const products: ProductInput[] = productsRaw.map((p) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl ? toCdnUrl(p.imageUrl) : undefined,
    priceSek: p.priceMin ? Number(p.priceMin) : undefined,
    inStock: p.inStock,
    variantCount: p.variantCount,
  }));

  const orderAgg = aggregateOrders(orders);

  return computeProfitabilityReport({
    products,
    mappings,
    importCosts,
    orders: orderAgg,
    settings,
    periodDays,
  });
}

/**
 * 5-minuters cache per period. Tag:en låter oss invalida via revalidateTag
 * (t.ex. när settings ändras eller manuell kostdata uppdateras).
 */
const cachedBuildReport = unstable_cache(
  async (period: ProfitabilityPeriod) => buildReport(period),
  ["admin-profitability-v1"],
  { revalidate: 300, tags: ["admin-profitability"] },
);

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const url = new URL(req.url);
  const periodParam = (url.searchParams.get("period") ?? "90d") as ProfitabilityPeriod;
  const period: ProfitabilityPeriod =
    periodParam === "30d" || periodParam === "90d" || periodParam === "all" ? periodParam : "90d";

  try {
    const report = await cachedBuildReport(period);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Aggregering misslyckades", message }, { status: 500 });
  }
}

/**
 * Wix Media-URL:er kommer som "wix:image://v1/<id>/..." — konvertera till
 * publik CDN-URL för rendering i admin-tabellen.
 */
function toCdnUrl(raw: string): string {
  if (raw.startsWith("https://")) return raw;
  const m = raw.match(/^wix:image:\/\/v1\/([^/]+)\//);
  if (m) return `https://static.wixstatic.com/media/${m[1]}`;
  return raw;
}
