// GET och HEAD /feed/gowish.xml
//
// Produktflöde för GoWish (Leonard 2026-11-25). GoWish bad om butikens Google
// Shopping-flöde i XML, och Leonard om att det ska bära alla EAN-koder, som
// PriceRunner-flödet. Byggs ur Google-flödet så att båda alltid visar samma
// katalog, samma länkar och samma bilder; skillnaderna (EAN på de varor som
// lib/feed/flode-gtin.ts pekar ut, frakt per vara och inga kampanjetiketter)
// ligger i lib/feed/gowish.ts. Byggaren är `gowishXml` (lib/feed/harledda.ts),
// samma som jobbet använder.
//
// Körs vid anrop och skickas komprimerat via /feed/gz/gowish.xml, som de andra
// stora flödena (se kommentaren i Google-flödets rutt).
//
// ☠️ En läsare utifrån får den sparade kopian (lib/feed/flodeslager.ts) när den
// är yngre än tre timmar. Bara när ingen kopia duger byggs flödet här, och det
// som byggdes sparas efter svaret. Anropad utan anrop bygger rutten ALLTID.

import { GET as googleFeed } from "../google.xml/route";
import { gowishXml } from "@/lib/feed/harledda";
import { anvandbarKopia, anvandbartHuvud, sparaEfterSvaret } from "@/lib/feed/kopiesvar";
import { arTomtFlode, flodessvar, flodessvarUrKopia, huvudsvar, lasare } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FIL = "gowish.xml";

export async function GET(request?: Request) {
  if (request) {
    const kopia = await anvandbarKopia(FIL, request, `/feed/${FIL}`);
    if (kopia) return flodessvarUrKopia(kopia, request);
  }
  const byggd = Date.now();
  const xml = gowishXml(await (await googleFeed()).text());
  if (request && !arTomtFlode(xml)) sparaEfterSvaret(FIL, `/feed/${FIL}`, byggd, xml);
  return flodessvar(xml, request);
}

// HEAD bygger aldrig: utan den körde Next GET och byggde hela flödet för ett
// svar utan kropp. Se `huvudsvar` i lib/feed/prisjakt-svar.ts.
export async function HEAD(request: Request) {
  console.log(`[flode] HEAD /feed/${FIL} (${lasare(request)})`);
  return huvudsvar({ komprimerat: false, kopia: await anvandbartHuvud(FIL) });
}
