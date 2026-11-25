// lib/feed/harledda.ts
//
// PriceRunner-, Pinterest- och GoWish-flödet ur Google-flödets XML. En enda
// byggare per flöde: rutterna (app/feed/pricerunner.xml, app/feed/pinterest.xml,
// app/feed/gowish.xml) och /api/cron/farska-floden använder samma funktioner.
//
// Jobbet bygger Google-flödet EN gång och gör de andra ur det. Förut byggdes
// det tre gånger varannan timme, en gång per flöde (2026-11-15).

import { tillPricerunner } from "@/lib/feed/pricerunner";
import { gtinUrval } from "@/lib/feed/prisjakt";
import { FLODE_GTIN } from "@/lib/feed/flode-gtin";
import { pinterestRakning, tillPinterest } from "@/lib/feed/pinterest";
import { PINTEREST_GTIN } from "@/lib/feed/pinterest-gtin";
import { gowishRakning, tillGowish } from "@/lib/feed/gowish";
import {
  DELIVERY_MAX_DAYS,
  DELIVERY_MIN_DAYS,
  FREE_SHIPPING_FROM_KR,
  SHIPPING_SERVICE,
  STANDARD_SHIPPING_KR,
} from "@/lib/shipping";

/**
 * PriceRunner-flödet: pris kunden betalar, frakt per vara, bara varor i lager
 * (lib/feed/pricerunner.ts) och EAN på de varor som FLODE_GTIN pekar ut
 * (lib/feed/flode-gtin.ts, regeln i `gtinUrval`). En rad med antalet i loggen.
 *
 * ☠️ Utan koderna faller PriceRunner tillbaka på identifier_exists=no och
 * matchar varorna sämre. lib/feed/flode-gtin-anvandning.test.ts fäller om
 * kartan tappas här.
 */
export function pricerunnerXml(googleXml: string): string {
  const xml = tillPricerunner(
    googleXml,
    {
      standardKr: STANDARD_SHIPPING_KR,
      freeFromKr: FREE_SHIPPING_FROM_KR,
      service: SHIPPING_SERVICE,
      minTransitDays: DELIVERY_MIN_DAYS,
      maxTransitDays: DELIVERY_MAX_DAYS,
    },
    gtinUrval(googleXml, FLODE_GTIN),
  );
  console.info(`[pricerunner] g:gtin på ${xml.split("<g:gtin>").length - 1} av ${Object.keys(FLODE_GTIN).length} varor i kartan`);
  return xml;
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

/**
 * GoWish-flödet (Leonard 2026-11-25): Google-flödet som det är, med EAN på de
 * varor som FLODE_GTIN pekar ut (samma urval som PriceRunner och Prisjakt),
 * frakt per vara och utan Googles kampanjetiketter (lib/feed/gowish.ts). En rad
 * med antalen i loggen.
 *
 * ☠️ Leonard bad om att flödet till GoWish ska bära alla EAN-koder.
 * lib/feed/gowish.test.ts fäller om kartan tappas här.
 */
export function gowishXml(googleXml: string): string {
  const xml = tillGowish(
    googleXml,
    {
      standardKr: STANDARD_SHIPPING_KR,
      freeFromKr: FREE_SHIPPING_FROM_KR,
      service: SHIPPING_SERVICE,
      minTransitDays: DELIVERY_MIN_DAYS,
      maxTransitDays: DELIVERY_MAX_DAYS,
    },
    gtinUrval(googleXml, FLODE_GTIN),
  );
  const r = gowishRakning(xml);
  console.info(`[gowish] ${r.varor} varor, ${r.iLager} i lager, g:gtin på ${r.gtin} av ${Object.keys(FLODE_GTIN).length} i kartan, ${r.rea} med reapris`);
  return xml;
}
