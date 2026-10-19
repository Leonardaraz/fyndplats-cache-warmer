// GET /feed/prisjakt.xml
//
// Produktfeed för Prisjakt (Business Center → Feedhantering, typ Produktfeed,
// format Prisjakt XML). Byggs ur Google-feeden så att alla feeds visar samma
// katalog, samma länkar och samma bilder; skillnaderna (pris kunden betalar,
// frakt med Prisjakts fyra leveranstider, bara varor i lager) ligger i
// lib/feed/prisjakt.ts.
//
// ☠️ INGEN ROUTE-ISR HÄR, OCH FLÖDET MÅSTE HÅLLA SIG UNDER 10 MB. Google- och
// PriceRunner-feeden (revalidate = 3600, ~15 MB) förnyades aldrig efter bygget:
// 2026-10-19 svarade /feed/google.xml STALE med age 77 000 s och bar produkter
// som dolts kvällen innan. Vercels CDN cachar inte svar över 10 MB, och ett
// flöde på 15 MB som körs vid anrop byggs om vid varje hämtning (35–105 s,
// uppmätt). Den här rutten körs vid anrop, flödet är ~9 MB (se punkt 6 i
// lib/feed/prisjakt.ts), och CDN:en cachar svaret en timme och serverar det
// gamla medan nästa byggs (stale-while-revalidate).

import { GET as googleFeed } from "../google.xml/route";
import { PRISJAKT_VARNING_BYTE, tillPrisjakt } from "@/lib/feed/prisjakt";
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
  const xml = tillPrisjakt(googleXml, {
    standardKr: STANDARD_SHIPPING_KR,
    freeFromKr: FREE_SHIPPING_FROM_KR,
    service: SHIPPING_SERVICE,
    minDays: DELIVERY_MIN_DAYS,
    maxDays: DELIVERY_MAX_DAYS,
  });

  const byte = Buffer.byteLength(xml);
  if (byte > PRISJAKT_VARNING_BYTE) {
    console.warn(
      `[prisjakt] flödet är ${(byte / 1e6).toFixed(1)} MB. Vercels CDN cachar inte svar över 10 MB, ` +
        "och då byggs flödet om vid varje hämtning. Se punkt 6 i lib/feed/prisjakt.ts.",
    );
  }

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
