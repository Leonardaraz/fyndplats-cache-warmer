// lib/feed/harledda.ts
//
// PriceRunner- och Pinterest-flödet ur Google-flödets XML. En enda byggare per
// flöde: rutterna (app/feed/pricerunner.xml, app/feed/pinterest.xml) och
// /api/cron/farska-floden använder samma funktioner.
//
// Jobbet bygger Google-flödet EN gång och gör de andra ur det. Förut byggdes
// det tre gånger varannan timme, en gång per flöde (2026-11-15).

import { tillPricerunner } from "@/lib/feed/pricerunner";
import { pinterestRakning, tillPinterest } from "@/lib/feed/pinterest";
import { PINTEREST_GTIN } from "@/lib/feed/pinterest-gtin";
import {
  DELIVERY_MAX_DAYS,
  DELIVERY_MIN_DAYS,
  FREE_SHIPPING_FROM_KR,
  SHIPPING_SERVICE,
  STANDARD_SHIPPING_KR,
} from "@/lib/shipping";

/** PriceRunner-flödet: pris kunden betalar, frakt per vara, bara varor i lager (lib/feed/pricerunner.ts). */
export function pricerunnerXml(googleXml: string): string {
  return tillPricerunner(googleXml, {
    standardKr: STANDARD_SHIPPING_KR,
    freeFromKr: FREE_SHIPPING_FROM_KR,
    service: SHIPPING_SERVICE,
    minTransitDays: DELIVERY_MIN_DAYS,
    maxTransitDays: DELIVERY_MAX_DAYS,
  });
}

/** Pinterest-flödet (lib/feed/pinterest.ts), och en rad med antalen i loggen. */
export function pinterestXml(googleXml: string): string {
  const xml = tillPinterest(googleXml, PINTEREST_GTIN);
  const r = pinterestRakning(xml);
  console.log(
    `[pinterest] ${r.varor} varor, ${r.iLager} i lager, g:gtin på ${r.gtin} av ${Object.keys(PINTEREST_GTIN).length} i kartan, ${r.extrabilder} extrabilder`,
  );
  return xml;
}
