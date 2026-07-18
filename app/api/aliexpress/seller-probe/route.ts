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
import { getProduct } from "@/lib/aliexpress/client";
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

  // Namnrymds-diagnos (F1): ta en KÄND importerad produkt-id och slå upp dess
  // DS-store_id. Matchar den din mappnings supplierId → säljarfiltret biter.
  // Annars säger svaret exakt vilket id du ska lägga i SUPPLIER_WATCH_SELLER_IDS.
  const sampleProductId = req.nextUrl.searchParams.get("productId");
  let namespaceCheck: unknown = null;
  if (sampleProductId) {
    try {
      const p = await getProduct(sampleProductId);
      namespaceCheck = {
        productId: sampleProductId,
        resolvedStoreId: p.storeId ?? null,
        resolvedStoreName: p.storeName ?? null,
        matchesRequestedStore: p.storeId === storeId,
        verdict:
          p.storeId == null
            ? "DS-svaret saknade ae_store_info.store_id — säljarfiltret kan inte fungera; hör av dig."
            : p.storeId === storeId
              ? "OK — DS store_id matchar. Säljarfiltret biter."
              : `MISMATCH — DS store_id=${p.storeId}. Lägg DET id:t i SUPPLIER_WATCH_SELLER_IDS (inte mappnings-supplierId).`,
      };
    } catch (err) {
      namespaceCheck = { productId: sampleProductId, error: err instanceof Error ? err.message.slice(0, 200) : String(err) };
    }
  }

  // Probe:a ALLTID båda källorna (oavsett cron-konfig) så man kan jämföra
  // storefront vs api-search-extend innan man bestämmer SUPPLIER_WATCH_SOURCES.
  const sources = buildSellerSources({ ...process.env, SUPPLIER_WATCH_SOURCES: "storefront,api" });

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
    namespaceCheck,
    sources: results,
    hint:
      "1) Kör med ?productId=<känd-Aosom/SucceBuy-produkt> för att bekräfta att DS store_id matchar din supplierId (namespaceCheck). " +
      "2) Om storefront ger 0 id blockerar AliExpress troligen datacenter-IP:t → sätt SUPPLIER_WATCH_SCRAPE_PROXY_URL.",
  });
}
