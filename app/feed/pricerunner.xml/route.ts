// GET /feed/pricerunner.xml
//
// Produktfeed för PriceRunner, utan EAN (varorna är omärkta — se BRAND-
// kommentaren i ../google.xml/route.ts). Byggs ur Google-feeden så att båda
// alltid visar samma katalog, samma länkar och samma bilder; skillnaderna
// (pris kunden betalar, frakt per vara, bara varor i lager) ligger i
// lib/feed/pricerunner.ts.
//
// Körs vid anrop och skickas komprimerat, som Google-feeden (se kommentaren där): med
// route-ISR byggdes flödet vid deployen och sedan aldrig mer.

import { GET as googleFeed } from "../google.xml/route";
import { tillPricerunner } from "@/lib/feed/pricerunner";
import { flodessvar } from "@/lib/feed/prisjakt-svar";
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

export async function GET(request?: Request) {
  const googleXml = await (await googleFeed()).text();
  const xml = tillPricerunner(googleXml, {
    standardKr: STANDARD_SHIPPING_KR,
    freeFromKr: FREE_SHIPPING_FROM_KR,
    service: SHIPPING_SERVICE,
    minTransitDays: DELIVERY_MIN_DAYS,
    maxTransitDays: DELIVERY_MAX_DAYS,
  });

  return flodessvar(xml, request);
}
