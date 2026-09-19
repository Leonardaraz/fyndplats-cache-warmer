// GET /api/feed/shopit
//
// Produktflödet Shopit (business.shopit.com) pollar en gång om dagen via
// fältet "Product Feed URL" i deras dashboard. Formatet är Google Shopping
// (RSS 2.0 + g:-namespace) — Shopits egen hjälpdokumentation säger att de
// föredrar det formatet, eftersom det redan bär allt de behöver.
//
// Ingen auth: samma resonemang som /api/review-aggregates — det här är en
// EXTERN part som SKA kunna läsa listan, och varje rad ligger redan på en
// synlig, publik produktsida. `/api/seo/sitemap` är token-skyddad av ett
// annat skäl (oro för tredjeparts-scraping av produktnamn) — den avvägningen
// gäller inte här, hela poängen är att en extern part ska läsa allt.
//
// Bara `visible: true`-produkter (se listV3ProductsForFeed i
// lib/wix/v3-products.ts) och bara produkter med ETT entydigt pris och en
// bild tas med — rader som saknar det som Google/Shopit kräver hoppas över,
// gissas inte fram.
//
// 502, inte en tom 200, om sveparen kastar — annars ser "läsningen föll" ut
// exakt som "katalogen är tom" för Shopits poller.

import { NextResponse } from "next/server";
import { listV3ProductsForFeed } from "@/lib/wix/v3-products";
import { storeProductUrl } from "@/lib/admin-links";
import { buildShopitFeedXml, type ShopitFeedItem } from "@/lib/feed/shopit-xml";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE_TITLE = "Fyndplats";

export async function GET() {
  try {
    const products = await listV3ProductsForFeed();

    const items: ShopitFeedItem[] = [];
    for (const p of products) {
      // Inget entydigt pris (variantspann) → hoppas över, gissas inte fram.
      if (p.priceSek === null) continue;
      if (!p.imageUrl) continue;
      const link = storeProductUrl(p.slug);
      if (!link) continue;
      items.push({
        id: p.id,
        title: p.name,
        descriptionHtml: p.plainDescription,
        link,
        imageUrl: p.imageUrl,
        priceSek: p.priceSek,
        inStock: p.inStock,
      });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_STORE_URL ?? "https://fyndplats.se").replace(/\/$/, "");
    const xml = buildShopitFeedXml(items, { siteTitle: SITE_TITLE, siteUrl });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    console.error("[api/feed/shopit] sveparen föll:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
