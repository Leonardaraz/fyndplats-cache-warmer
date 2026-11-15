// GET och HEAD /feed/pricerunner.xml
//
// Produktfeed för PriceRunner, utan EAN (varorna är omärkta — se BRAND-
// kommentaren i ../google.xml/route.ts). Byggs ur Google-feeden så att båda
// alltid visar samma katalog, samma länkar och samma bilder; skillnaderna
// (pris kunden betalar, frakt per vara, bara varor i lager) ligger i
// lib/feed/pricerunner.ts. Byggaren är `pricerunnerXml` (lib/feed/harledda.ts),
// samma som jobbet använder.
//
// Körs vid anrop och skickas komprimerat, som Google-feeden (se kommentaren där): med
// route-ISR byggdes flödet vid deployen och sedan aldrig mer.
//
// ☠️ En läsare utifrån får den sparade kopian (lib/feed/flodeslager.ts) när den
// är yngre än tre timmar. Bara när ingen kopia duger byggs flödet här, och det
// som byggdes sparas efter svaret. Anropad utan anrop bygger rutten ALLTID.

import { GET as googleFeed } from "../google.xml/route";
import { pricerunnerXml } from "@/lib/feed/harledda";
import { anvandbarKopia, anvandbartHuvud, sparaEfterSvaret } from "@/lib/feed/kopiesvar";
import { arTomtFlode, flodessvar, flodessvarUrKopia, huvudsvar, lasare } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FIL = "pricerunner.xml";

export async function GET(request?: Request) {
  if (request) {
    const kopia = await anvandbarKopia(FIL, request, `/feed/${FIL}`);
    if (kopia) return flodessvarUrKopia(kopia, request);
  }
  const byggd = Date.now();
  const xml = pricerunnerXml(await (await googleFeed()).text());
  if (request && !arTomtFlode(xml)) sparaEfterSvaret(FIL, `/feed/${FIL}`, byggd, xml);
  return flodessvar(xml, request);
}

// HEAD bygger aldrig: utan den körde Next GET och byggde hela flödet för ett
// svar utan kropp. Se `huvudsvar` i lib/feed/prisjakt-svar.ts.
export async function HEAD(request: Request) {
  console.log(`[flode] HEAD /feed/${FIL} (${lasare(request)})`);
  return huvudsvar({ komprimerat: false, kopia: await anvandbartHuvud(FIL) });
}
