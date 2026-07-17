// GET /api/aliexpress/seller-probe?storeId=1104096404
//
// Read-only feasibility-probe för supplier-watchens seller-läge. Kör varje
// aktiv säljar-källa mot en butik och rapporterar hur många kandidat-id den
// gav + ett stickprov — så vi kan verifiera I PROD vilken bindning som faktiskt
// funkar (searchExtend-filter vs storefront) INNAN vi sätter mode=seller live.
//
// Ändrar inget. Auth: samma som cron (CRON_SECRET-bearer eller x-fyndplats-token).

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { buildSellerSources, storefrontUrl } from "@/lib/discover/seller-sources";
import { DEFAULT_WATCHED_SELLER_IDS } from "@/lib/discover/supplier-watch";

export const runtime = "nodejs";
export const maxDuration = 120;

function authorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const storeId = req.nextUrl.searchParams.get("storeId") ?? DEFAULT_WATCHED_SELLER_IDS[0];
  const sources = buildSellerSources();

  const results = await Promise.all(
    sources.map(async (source) => {
      const started = Date.now();
      try {
        const res = await source.listProductIds(storeId);
        return {
          source: source.name,
          ok: res.ok,
          idCount: res.productIds.length,
          sample: res.productIds.slice(0, 8),
          note: res.note,
          ms: Date.now() - started,
        };
      } catch (err) {
        return {
          source: source.name,
          ok: false,
          idCount: 0,
          sample: [],
          note: err instanceof Error ? err.message.slice(0, 200) : String(err),
          ms: Date.now() - started,
        };
      }
    }),
  );

  return NextResponse.json({
    ok: true,
    storeId,
    storefrontUrl: storefrontUrl(storeId),
    sources: results,
    hint:
      "Om storefront ger 0 id blockerar AliExpress troligen datacenter-IP:t → sätt SUPPLIER_WATCH_SCRAPE_PROXY_URL. api-search-extend bör ge id oavsett (officiellt API).",
  });
}
