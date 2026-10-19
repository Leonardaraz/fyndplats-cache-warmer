// GET /feed/pricerunner.xml
//
// Produktfeed för PriceRunner, utan EAN (varorna är omärkta — se BRAND-
// kommentaren i ../google.xml/route.ts). Byggs ur Google-feeden så att båda
// alltid visar samma katalog, samma länkar och samma bilder; skillnaderna
// (pris kunden betalar, frakt per vara, bara varor i lager) ligger i
// lib/feed/pricerunner.ts.
//
// Samma route-ISR som Google-feeden: Wix anropas högst en gång i timmen.

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
export const revalidate = 3600;

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
