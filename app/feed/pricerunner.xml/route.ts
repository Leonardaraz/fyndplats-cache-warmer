// GET /feed/pricerunner.xml
//
// Produktfeed för PriceRunner. Byggs ur Google-feeden så att båda alltid visar
// samma katalog, samma länkar och samma bilder; skillnaderna (pris kunden
// betalar, frakt per vara, bara varor i lager och EAN på de varor som
// lib/feed/flode-gtin.ts pekar ut) ligger i lib/feed/pricerunner.ts.
//
// Körs vid anrop och skickas komprimerat, som Google-feeden (se kommentaren där): med
// route-ISR byggdes flödet vid deployen och sedan aldrig mer.

import { GET as googleFeed } from "../google.xml/route";
import { tillPricerunner } from "@/lib/feed/pricerunner";
import { gtinUrval } from "@/lib/feed/prisjakt";
import { FLODE_GTIN } from "@/lib/feed/flode-gtin";
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
  }, gtinUrval(googleXml, FLODE_GTIN));
  console.info(`[pricerunner] g:gtin på ${xml.split("<g:gtin>").length - 1} av ${Object.keys(FLODE_GTIN).length} varor i kartan`);

  return flodessvar(xml, request);
}
