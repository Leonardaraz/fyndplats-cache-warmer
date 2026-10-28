// GET /feed/<fil>
//
// Prisjakt-flödet MED märke och artikelnummer, på en hemlig adress:
// /feed/prisjakt-<kod>.xml, där koden är miljövariabeln PRISJAKT_FLODE_KOD i
// Vercel (lib/feed/prisjakt-adress.ts). Varje annat filnamn svarar 404. De
// andra flödena (google.xml, prisjakt.xml, pricerunner.xml …) har egna rutter,
// och Next låter dem gå före den här.
//
// ☠️ LEONARDS BESLUT 2026-10-28, OCH BARA HÄR. Prisjakt matchade 9 av 6 818
// erbjudanden, och deras sidor för Aosom-varor heter märke plus Aosoms
// artikelnummer. Här får Aosom-varorna g:mpn = Aosoms artikelnummer och
// g:brand = varans riktiga märke (motorns /api/prisjakt-artiklar). Det är ett
// medvetet undantag från två husregler: att märket är Fyndplats och att
// artikelnumret aldrig når kunden. Google-, PriceRunner- och det öppna
// Prisjakt-flödet byggs utan numren.
//
// ☠️ Loggraden bär bara antal. Aldrig koden, adressen, ett nummer eller ett
// märke. Svaret bär X-Robots-Tag: noindex, så att en läckt adress inte hamnar
// i ett sökindex.
//
// Når motorn inte fram svarar adressen 503, och CDN:en serverar förra flödet
// (stale-if-error). Ett flöde där numren plötsligt saknas hade sett ut som
// ett lyckat svar.

import { GET as googleFeed } from "../google.xml/route";
import { tillPrisjakt } from "@/lib/feed/prisjakt";
import { PRISJAKT_GTIN } from "@/lib/feed/prisjakt-gtin";
import { arHemligPrisjaktFil, prisjaktKod } from "@/lib/feed/prisjakt-adress";
import { hamtaPrisjaktArtiklar } from "@/lib/feed/prisjakt-motor";
import { PRISJAKT_VARNING_BYTE_STROMMAT, prisjaktRakning, strommatXml } from "@/lib/feed/prisjakt-svar";
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

const NOINDEX = { "X-Robots-Tag": "noindex" } as const;

function ingenFil(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { ...NOINDEX, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ fil: string }> }) {
  const { fil } = await params;
  if (!arHemligPrisjaktFil(fil, prisjaktKod())) return ingenFil();

  // Google-flödet och motorns nummer hämtas samtidigt: flödet tar 35–40 s, motorn några sekunder.
  const [google, motorn] = await Promise.allSettled([
    googleFeed().then((r) => r.text()),
    hamtaPrisjaktArtiklar(),
  ]);
  if (google.status === "rejected" || motorn.status === "rejected") {
    const orsak = google.status === "rejected" ? "Google-flödet föll" : `motorns artikelnummer: ${motorn.status === "rejected" && motorn.reason instanceof Error ? motorn.reason.message : "okänt fel"}`;
    console.error(`[prisjakt-hemlig] flödet byggdes inte, ${orsak}`);
    return new Response("Flödet kan inte byggas just nu", {
      status: 503,
      headers: { ...NOINDEX, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600" },
    });
  }

  const xml = tillPrisjakt(
    google.value,
    {
      standardKr: STANDARD_SHIPPING_KR,
      freeFromKr: FREE_SHIPPING_FROM_KR,
      service: SHIPPING_SERVICE,
      minDays: DELIVERY_MIN_DAYS,
      maxDays: DELIVERY_MAX_DAYS,
    },
    PRISJAKT_GTIN,
    motorn.value.artiklar,
  );

  const r = prisjaktRakning(xml);
  console.info(
    `[prisjakt-hemlig] ${r.varor} varor, g:mpn på ${r.mpn}, varans märke på ${r.mpnMedMarke} av dem ` +
      `(motorn gav ${motorn.value.poster} poster, ${motorn.value.ogiltiga} ogiltiga), g:gtin på ${r.gtin}, ` +
      `${(r.byte / 1e6).toFixed(2)} MB`,
  );
  if (r.byte > PRISJAKT_VARNING_BYTE_STROMMAT) {
    console.warn(`[prisjakt-hemlig] flödet är ${(r.byte / 1e6).toFixed(1)} MB. Vercels CDN cachar inte strömmade svar över 20 MB.`);
  }

  return new Response(strommatXml(xml), {
    headers: {
      ...NOINDEX,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400",
    },
  });
}
