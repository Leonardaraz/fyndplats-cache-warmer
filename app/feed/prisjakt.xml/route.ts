// GET /feed/prisjakt.xml
//
// Produktfeed för Prisjakt (Business Center → Feedhantering, typ Produktfeed,
// format Prisjakt XML). Byggs ur Google-feeden så att alla feeds visar samma
// katalog, samma länkar och samma bilder; skillnaderna (pris kunden betalar,
// frakt med Prisjakts fyra leveranstider, bara varor i lager) ligger i
// lib/feed/prisjakt.ts.
//
// ☠️ INGEN ROUTE-ISR HÄR. Google- och PriceRunner-feeden (revalidate = 3600,
// ~15 MB) förnyades aldrig efter bygget: 2026-10-19 svarade /feed/google.xml
// STALE med age 77 000 s och bar produkter som dolts kvällen innan. Den här
// rutten körs vid anrop, och CDN:en cachar svaret en timme och serverar det
// gamla medan nästa byggs (stale-while-revalidate).
//
// ☠️ SVARET ÄR STRÖMMAT (2026-10-28). Vercels CDN cachar icke-strömmade svar
// upp till 10 MB och strömmade upp till 20 MB, och flödet var 9,30 MB. Se
// lib/feed/prisjakt-svar.ts.
//
// ☠️ DET HÄR ÄR DET ÖPPNA FLÖDET, UTAN MÄRKE OCH ARTIKELNUMMER. Flödet med dem
// finns bara på den hemliga adressen (app/feed/[fil]/route.ts). Den här rutten
// tas bort när Leonard bytt adress i Prisjakts Business Center.

import { GET as googleFeed } from "../google.xml/route";
import { tillPrisjakt } from "@/lib/feed/prisjakt";
import { PRISJAKT_GTIN } from "@/lib/feed/prisjakt-gtin";
import { PRISJAKT_VARNING_BYTE_STROMMAT, strommatXml } from "@/lib/feed/prisjakt-svar";
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

export async function GET() {
  const googleXml = await (await googleFeed()).text();
  const xml = tillPrisjakt(
    googleXml,
    {
      standardKr: STANDARD_SHIPPING_KR,
      freeFromKr: FREE_SHIPPING_FROM_KR,
      service: SHIPPING_SERVICE,
      minDays: DELIVERY_MIN_DAYS,
      maxDays: DELIVERY_MAX_DAYS,
    },
    PRISJAKT_GTIN,
  );

  // Testet med koder (lib/feed/prisjakt-gtin.ts): färre g:gtin i flödet än i
  // kartan betyder att en vara fått en andra variant, gått ur lager eller
  // försvunnit ur katalogen.
  const gtinIKartan = Object.keys(PRISJAKT_GTIN).length;
  if (gtinIKartan > 0) {
    console.info(`[prisjakt] g:gtin på ${xml.split("<g:gtin>").length - 1} av ${gtinIKartan} varor i kartan`);
  }

  const byte = Buffer.byteLength(xml);
  if (byte > PRISJAKT_VARNING_BYTE_STROMMAT) {
    console.warn(
      `[prisjakt] flödet är ${(byte / 1e6).toFixed(1)} MB. Vercels CDN cachar inte strömmade svar över 20 MB, ` +
        "och då byggs flödet om vid varje hämtning. Se lib/feed/prisjakt-svar.ts.",
    );
  }

  return new Response(strommatXml(xml), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
