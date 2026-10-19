// GET /feed/prisjakt.xml
//
// Produktfeed för Prisjakt (Business Center → Feedhantering, typ Produktfeed,
// format Prisjakt XML). Byggs ur Google-feeden så att alla feeds visar samma
// katalog, samma länkar och samma bilder; skillnaderna (pris kunden betalar,
// frakt med Prisjakts fyra leveranstider, bara varor i lager) ligger i
// lib/feed/prisjakt.ts.
//
// ☠️ INGEN ROUTE-ISR HÄR. Google- och PriceRunner-feeden (revalidate = 3600,
// ~15 MB) förnyades aldrig efter bygget: 2026-10-19 svarade /feed/google.xml
// STALE med age 77 000 s och bar produkter som dolts kvällen innan, medan
// /feed/products.xml (8 MB) och bildsitemapen förnyades som de skulle. Rutten
// körs därför vid anrop, och CDN:en cachar svaret en timme (s-maxage) och
// serverar det gamla medan nästa byggs (stale-while-revalidate), samma upplägg
// som /api/feed/image-sitemap.xml.

import { GET as googleFeed } from "../google.xml/route";
import { tillPrisjakt } from "@/lib/feed/prisjakt";
import {
  DELIVERY_MAX_DAYS,
  DELIVERY_MIN_DAYS,
  FREE_SHIPPING_FROM_KR,
  SHIPPING_SERVICE,
  STANDARD_SHIPPING_KR,
} from "@/lib/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const googleXml = await (await googleFeed()).text();
  const xml = tillPrisjakt(googleXml, {
    standardKr: STANDARD_SHIPPING_KR,
    freeFromKr: FREE_SHIPPING_FROM_KR,
    service: SHIPPING_SERVICE,
    minDays: DELIVERY_MIN_DAYS,
    maxDays: DELIVERY_MAX_DAYS,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
