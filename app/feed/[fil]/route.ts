// GET och HEAD /feed/<fil>
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
// ett lyckat svar. Ett flöde utan en enda vara (Wix svarade inte) får också
// 503, som de andra flödena (`arTomtFlode`).
//
// ☠️ Prisjakt får den sparade kopian (lib/feed/flodeslager.ts, namnet
// PRISJAKT_HEMLIG_KOPIA) när den är yngre än tre timmar. /api/cron/farska-floden
// bygger den varannan timme med samma byggare (`prisjaktHemligXml` i
// lib/feed/prisjakt-hemlig.ts), utan att känna till adressen. Prisjakt hämtar tre
// gånger om dygnet och fick förut vänta på ett bygge varje gång. Bara när ingen
// kopia duger byggs flödet här, och det som byggdes sparas efter svaret.
// Loggen och kopian bär namnet, aldrig adressen.

import { GET as googleFeed } from "../google.xml/route";
import { arHemligPrisjaktFil, prisjaktKod } from "@/lib/feed/prisjakt-adress";
import { hamtaPrisjaktArtiklar } from "@/lib/feed/prisjakt-motor";
import { PRISJAKT_HEMLIG_KOPIA, prisjaktHemligXml } from "@/lib/feed/prisjakt-hemlig";
import { anvandbarKopia, anvandbartHuvud, sparaEfterSvaret } from "@/lib/feed/kopiesvar";
import { arTomtFlode, flodessvarUrKopia, huvudsvar, kopiansCacheControl, lasare, strommatXml } from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const NOINDEX = { "X-Robots-Tag": "noindex" } as const;
/** Namnet i loggen. Aldrig adressen. */
const NAMN = "det hemliga Prisjakt-flödet";
/** CDN:en ger det gamla flödet i ett dygn om ett nytt bygge faller (503). */
const VID_FEL = "stale-if-error=86400";

function ingenFil(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { ...NOINDEX, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function kanInteByggas(): Response {
  return new Response("Flödet kan inte byggas just nu", {
    status: 503,
    headers: { ...NOINDEX, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600" },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ fil: string }> }) {
  const { fil } = await params;
  if (!arHemligPrisjaktFil(fil, prisjaktKod())) return ingenFil();

  const kopia = await anvandbarKopia(PRISJAKT_HEMLIG_KOPIA, request, NAMN);
  if (kopia) {
    const alderS = (Date.now() - kopia.byggd) / 1000;
    return flodessvarUrKopia(kopia, request, {
      rubriker: { ...NOINDEX, "Cache-Control": `${kopiansCacheControl(alderS)}, ${VID_FEL}` },
    });
  }

  const byggd = Date.now();
  // Google-flödet och motorns nummer hämtas samtidigt: flödet tar 35–40 s, motorn några sekunder.
  const [google, motorn] = await Promise.allSettled([
    googleFeed().then((r) => r.text()),
    hamtaPrisjaktArtiklar(),
  ]);
  if (google.status === "rejected" || motorn.status === "rejected") {
    const orsak = google.status === "rejected" ? "Google-flödet föll" : `motorns artikelnummer: ${motorn.status === "rejected" && motorn.reason instanceof Error ? motorn.reason.message : "okänt fel"}`;
    console.error(`[prisjakt-hemlig] flödet byggdes inte, ${orsak}`);
    return kanInteByggas();
  }

  const xml = prisjaktHemligXml(google.value, motorn.value);
  if (arTomtFlode(xml)) {
    console.error(`[prisjakt-hemlig] flödet byggdes utan en enda vara och skickas inte. Prisjakt behåller förra inläsningen.`);
    return kanInteByggas();
  }
  sparaEfterSvaret(PRISJAKT_HEMLIG_KOPIA, NAMN, byggd, xml);

  return new Response(strommatXml(xml), {
    headers: {
      ...NOINDEX,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400, ${VID_FEL}`,
    },
  });
}

// HEAD bygger aldrig (se `huvudsvar` i lib/feed/prisjakt-svar.ts). Ett fel
// filnamn får 404 också här, så att HEAD inte avslöjar mer än GET.
export async function HEAD(request: Request, { params }: { params: Promise<{ fil: string }> }) {
  const { fil } = await params;
  if (!arHemligPrisjaktFil(fil, prisjaktKod())) return ingenFil();
  console.log(`[flode] HEAD ${NAMN} (${lasare(request)})`);
  return huvudsvar({ komprimerat: false, kopia: await anvandbartHuvud(PRISJAKT_HEMLIG_KOPIA), rubriker: { ...NOINDEX } });
}
