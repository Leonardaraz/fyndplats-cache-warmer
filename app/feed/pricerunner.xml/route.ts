// GET /feed/pricerunner.xml
//
// Produktfeed för PriceRunner, utan EAN (varorna är omärkta — se BRAND-
// kommentaren i ../google.xml/route.ts). Byggs ur Google-feeden så att båda
// alltid visar samma katalog, samma länkar och samma bilder; skillnaderna
// (pris kunden betalar, frakt per vara, bara varor i lager) ligger i
// lib/feed/pricerunner.ts.
//
// Körs vid anrop och CDN:en cachar svaret en timme, samma upplägg som
// Google-feeden. Route-ISR förnyades aldrig för de här ~15 MB stora
// feederna; se ☠️-stycket i ../google.xml/route.ts.

import { GET as googleFeed } from "../google.xml/route";
import { tillPricerunner } from "@/lib/feed/pricerunner";
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
  const xml = tillPricerunner(googleXml, {
    standardKr: STANDARD_SHIPPING_KR,
    freeFromKr: FREE_SHIPPING_FROM_KR,
    service: SHIPPING_SERVICE,
    minTransitDays: DELIVERY_MIN_DAYS,
    maxTransitDays: DELIVERY_MAX_DAYS,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
