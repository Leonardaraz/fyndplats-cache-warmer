// GET och HEAD /feed/pinterest.xml
//
// Produktflöde för Pinterests katalog (Kataloger → Fyndplats → Datakälla, hämtas
// en gång per dygn). Byggs ur Google-flödet så att båda alltid visar samma
// katalog; skillnaderna (lagerstatus med mellanslag, extrabilder utan
// kommatecken, g:gtin) ligger i lib/feed/pinterest.ts och koderna i
// lib/feed/pinterest-gtin.ts. Byggaren är `pinterestXml` (lib/feed/harledda.ts),
// samma som jobbet använder.
//
// Skickas komprimerat via /feed/gz/pinterest.xml, som de andra stora flödena
// (lib/feed/prisjakt-svar.ts). Hit kommer den som inte tar emot gzip, och
// gz-rutten när den bygger (utan anrop).
//
// ☠️ En läsare utifrån får den sparade kopian (lib/feed/flodeslager.ts) när den
// är yngre än tre timmar. Bara när ingen kopia duger byggs flödet här, och det
// som byggdes sparas efter svaret. Anropad utan anrop bygger rutten ALLTID: det
// är så gz-rutten får ett färskt flöde.

import { GET as googleFeed } from "../google.xml/route";
import { pinterestXml } from "@/lib/feed/harledda";
import { anvandbarKopia, anvandbartHuvud, sparaEfterSvaret } from "@/lib/feed/kopiesvar";
import { arTomtFlode, flodessvar, flodessvarUrKopia, huvudsvar, lasare } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FIL = "pinterest.xml";

export async function GET(request?: Request) {
  if (request) {
    const kopia = await anvandbarKopia(FIL, request, `/feed/${FIL}`);
    if (kopia) return flodessvarUrKopia(kopia, request);
  }
  const byggd = Date.now();
  const xml = pinterestXml(await (await googleFeed()).text());
  if (request && !arTomtFlode(xml)) sparaEfterSvaret(FIL, `/feed/${FIL}`, byggd, xml);
  return flodessvar(xml, request);
}

export async function HEAD(request: Request) {
  console.log(`[flode] HEAD /feed/${FIL} (${lasare(request)})`);
  return huvudsvar({ komprimerat: false, kopia: await anvandbartHuvud(FIL) });
}
