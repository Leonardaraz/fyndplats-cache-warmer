// GET och HEAD /feed/pinterest.xml
//
// Produktflöde för Pinterests katalog (Kataloger → Fyndplats → Datakälla, hämtas
// en gång per dygn). Byggs ur Google-flödet så att båda alltid visar samma
// katalog; skillnaderna (lagerstatus med mellanslag, extrabilder utan
// kommatecken, g:gtin) ligger i lib/feed/pinterest.ts och koderna i
// lib/feed/pinterest-gtin.ts.
//
// Skickas komprimerat via /feed/gz/pinterest.xml, som de andra stora flödena
// (lib/feed/prisjakt-svar.ts). Hit kommer bara den som inte tar emot gzip, och
// gz-rutten när den bygger (utan anrop).
//
// ☠️ En läsare utifrån får den sparade kopian (lib/feed/flodeslager.ts) när den
// är yngre än tre timmar, uppackad. Bara när ingen kopia duger byggs flödet här,
// och det som byggdes sparas efter svaret. Anropad utan anrop bygger rutten
// ALLTID: det är så gz-rutten och /api/cron/farska-floden får ett färskt flöde.

import { after } from "next/server";
import { GET as googleFeed } from "../google.xml/route";
import { pinterestRakning, tillPinterest } from "@/lib/feed/pinterest";
import { PINTEREST_GTIN } from "@/lib/feed/pinterest-gtin";
import { alderText, anvandbar, lasHuvud, lasKopia, sparaKopia } from "@/lib/feed/flodeslager";
import { arTomtFlode, flodessvar, flodessvarUrKopia, gzipFlode, huvudsvar, lasare } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FIL = "pinterest.xml";

export async function GET(request?: Request) {
  if (request) {
    const kopia = await lasKopia(FIL);
    if (kopia && anvandbar(kopia.byggd)) {
      console.log(`[flode] /feed/${FIL} ur kopian, ${alderText(kopia.byggd)} gammal (${lasare(request)})`);
      return flodessvarUrKopia(kopia, request);
    }
  }
  const byggd = Date.now();
  const googleXml = await (await googleFeed()).text();
  const xml = tillPinterest(googleXml, PINTEREST_GTIN);
  const r = pinterestRakning(xml);
  console.log(
    `[pinterest] ${r.varor} varor, ${r.iLager} i lager, g:gtin på ${r.gtin} av ${Object.keys(PINTEREST_GTIN).length} i kartan, ${r.extrabilder} extrabilder`,
  );
  if (request && !arTomtFlode(xml)) {
    after(async () => {
      if (!(await sparaKopia(FIL, gzipFlode(xml), { byggd, xmlByte: Buffer.byteLength(xml) }))) {
        console.warn(`[flode] /feed/${FIL}: kopian sparades inte`);
      }
    });
  }
  return flodessvar(xml, request);
}

export async function HEAD(request: Request) {
  const kopia = await lasHuvud(FIL);
  console.log(`[flode] HEAD /feed/${FIL} (${lasare(request)})`);
  return huvudsvar({ komprimerat: false, kopia: kopia && anvandbar(kopia.byggd) ? kopia : null });
}
