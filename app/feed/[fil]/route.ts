// GET och HEAD /feed/<fil>
//
// De hemliga adresserna. Varje annat filnamn svarar 404. De öppna flödena
// (google.xml, products.xml, pinterest.xml) har egna rutter, och Next låter dem
// gå före den här. PriceRunner- och GoWish-flödet har bara sina hemliga
// adresser sedan 2026-11-26, så /feed/pricerunner.xml och /feed/gowish.xml
// svarar 404 härifrån.
//
//   /feed/prisjakt-<kod>.xml      Prisjakt-flödet MED märke och artikelnummer.
//                                 Koden är PRISJAKT_FLODE_KOD i Vercel
//                                 (lib/feed/prisjakt-adress.ts).
//   /feed/pricerunner-<kod>.xml   PriceRunner-flödet och GoWish-flödet, utan
//   /feed/gowish-<kod>.xml        artikelnummer. Koderna är
//                                 PRICERUNNER_FLODE_KOD och GOWISH_FLODE_KOD
//                                 (lib/feed/hemlig-adress.ts, Leonard 2026-11-26).
//
// ☠️ LEONARDS BESLUT 2026-10-28, OCH BARA PÅ PRISJAKTS ADRESS. Prisjakt matchade
// 9 av 6 818 erbjudanden, och deras sidor för Aosom-varor heter märke plus
// Aosoms artikelnummer. Där får Aosom-varorna g:mpn = Aosoms artikelnummer och
// g:brand = varans riktiga märke (motorns /api/prisjakt-artiklar). Det är ett
// medvetet undantag från två husregler: att märket är Fyndplats och att
// artikelnumret aldrig når kunden. Google-, PriceRunner- och GoWish-flödet
// byggs utan numren, också på sina hemliga adresser.
//
// ☠️ Det öppna /feed/prisjakt.xml är borttaget (2026-11-26): Prisjakts läsare
// hämtade den hemliga adressen tre gånger på 23 timmar, och ingen hämtade den
// öppna. Adressen svarar nu 404 härifrån.
//
// ☠️ Loggraden bär ett namn och antal. Aldrig koden, adressen, ett nummer eller
// ett märke. Den här filen läser därför aldrig anropets adress. Svaret bär
// X-Robots-Tag: noindex, så att en läckt adress inte hamnar i ett sökindex.
//
// Når motorn inte fram svarar Prisjakts adress 503, och CDN:en serverar förra
// flödet (stale-if-error). Ett flöde där numren plötsligt saknas hade sett ut
// som ett lyckat svar. Ett flöde utan en enda vara (Wix svarade inte) får också
// 503, som de andra flödena (`arTomtFlode`).
//
// ☠️ Läsaren får den sparade kopian (lib/feed/flodeslager.ts) när den är yngre
// än tre timmar. /api/cron/farska-floden bygger kopiorna varannan timme med
// samma byggare, utan att känna till någon adress. Bara när ingen kopia duger
// byggs flödet här, och det som byggdes sparas efter svaret. PriceRunner- och
// GoWish-flödet har bara den hemliga adressen och läser jobbets kopia.

import { GET as googleFeed } from "../google.xml/route";
import { arHemligPrisjaktFil, prisjaktKod } from "@/lib/feed/prisjakt-adress";
import { HEMLIGA_FLODEN, type HemligtFlode, hemligtFlode } from "@/lib/feed/hemlig-adress";
import { gowishXml, pricerunnerXml } from "@/lib/feed/harledda";
import { hamtaPrisjaktArtiklar } from "@/lib/feed/prisjakt-motor";
import { PRISJAKT_HEMLIG_KOPIA, prisjaktHemligXml } from "@/lib/feed/prisjakt-hemlig";
import { anvandbarKopia, anvandbartHuvud, sparaEfterSvaret } from "@/lib/feed/kopiesvar";
import {
  arTomtFlode,
  flodessvar,
  flodessvarUrKopia,
  huvudsvar,
  kopiansCacheControl,
  lasare,
  strommatXml,
} from "@/lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const NOINDEX = { "X-Robots-Tag": "noindex" } as const;
/** Namnet i loggen. Aldrig adressen. */
const NAMN = "det hemliga Prisjakt-flödet";
/** CDN:en ger det gamla flödet i ett dygn om ett nytt bygge faller (503). */
const VID_FEL = "stale-if-error=86400";

/** PriceRunner- och GoWish-flödet ur Google-flödets XML: samma byggare som jobbet. */
const UR_GOOGLE: Record<HemligtFlode, (googleXml: string) => string> = {
  "pricerunner.xml": pricerunnerXml,
  "gowish.xml": gowishXml,
};

/** En hemlig adress: namnet för loggen, kopians namn och flödet (null för Prisjakts, som har en egen byggare). */
type Adress = { namn: string; kopia: string; flode: HemligtFlode | null };

/**
 * Den hemliga adress filnamnet är, eller null. Båda prövningarna görs alltid,
 * så att svarstiden inte säger vilken som stämde.
 */
function hemligAdress(fil: string): Adress | null {
  const prisjakt = arHemligPrisjaktFil(fil, prisjaktKod());
  const flode = hemligtFlode(fil);
  if (prisjakt) return { namn: NAMN, kopia: PRISJAKT_HEMLIG_KOPIA, flode: null };
  return flode ? { namn: HEMLIGA_FLODEN[flode].namn, kopia: flode, flode } : null;
}

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

/**
 * PriceRunner- eller GoWish-flödet på sin hemliga adress: kopian när den duger,
 * annars ett bygge som sparas efter svaret. Loggen bär namnet, aldrig adressen.
 */
async function harlettFlode(flode: HemligtFlode, namn: string, request: Request): Promise<Response> {
  const kopia = await anvandbarKopia(flode, request, namn);
  if (kopia) return flodessvarUrKopia(kopia, request, { rubriker: { ...NOINDEX } });

  const byggd = Date.now();
  let xml: string;
  try {
    xml = UR_GOOGLE[flode](await (await googleFeed()).text());
  } catch (e) {
    console.error(`[flode] ${namn} byggdes inte: ${e instanceof Error ? e.message.slice(0, 160) : "okänt fel"}`);
    return kanInteByggas();
  }
  if (arTomtFlode(xml)) {
    console.error(`[flode] ${namn} byggdes utan en enda vara och skickas inte. Läsaren får 503 och behåller förra inläsningen.`);
    return kanInteByggas();
  }
  console.log(`[flode] ${namn} byggdes på ${((Date.now() - byggd) / 1000).toFixed(1)} s, ingen kopia dög (${lasare(request)})`);
  sparaEfterSvaret(flode, namn, byggd, xml);
  return flodessvar(xml, request, { rubriker: { ...NOINDEX } });
}

export async function GET(request: Request, { params }: { params: Promise<{ fil: string }> }) {
  const { fil } = await params;
  const adress = hemligAdress(fil);
  if (!adress) return ingenFil();
  if (adress.flode) return harlettFlode(adress.flode, adress.namn, request);

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
  const adress = hemligAdress(fil);
  if (!adress) return ingenFil();
  console.log(`[flode] HEAD ${adress.namn} (${lasare(request)})`);
  return huvudsvar({ komprimerat: false, kopia: await anvandbartHuvud(adress.kopia), rubriker: { ...NOINDEX } });
}
