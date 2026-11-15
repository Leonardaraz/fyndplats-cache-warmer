// GET /feed/pinterest.xml
//
// Produktflöde för Pinterests katalog (Kataloger → Fyndplats → Datakälla, hämtas
// en gång per dygn). Byggs ur Google-flödet så att båda alltid visar samma
// katalog; skillnaderna (lagerstatus med mellanslag, extrabilder utan
// kommatecken, g:gtin) ligger i lib/feed/pinterest.ts och koderna i
// lib/feed/pinterest-gtin.ts.
//
// Körs vid anrop och skickas komprimerat via /feed/gz/pinterest.xml, som de
// andra stora flödena (lib/feed/prisjakt-svar.ts).

import { GET as googleFeed } from "../google.xml/route";
import { pinterestRakning, tillPinterest } from "@/lib/feed/pinterest";
import { PINTEREST_GTIN } from "@/lib/feed/pinterest-gtin";
import { flodessvar } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request?: Request) {
  const googleXml = await (await googleFeed()).text();
  const xml = tillPinterest(googleXml, PINTEREST_GTIN);
  const r = pinterestRakning(xml);
  console.log(
    `[pinterest] ${r.varor} varor, ${r.iLager} i lager, g:gtin på ${r.gtin} av ${Object.keys(PINTEREST_GTIN).length} i kartan, ${r.extrabilder} extrabilder`,
  );
  return flodessvar(xml, request);
}
