// lib/feed/prisjakt-svar.ts
//
// Svaret för de stora XML-flödena: komprimerat till den som tar emot gzip,
// annars strömmat.
//
// ☠️ Vercels CDN cachar icke-strömmade svar upp till 10 MB och strömmade upp
// till 20 MB (vercel.com/docs/caching/cdn-cache, "Cacheable response
// criteria", läst 2026-10-28). Prisjakt-flödet var 9,30 MB och växer med
// artikelnumren. Ett svar över gränsen cachas inte alls och byggs om vid varje
// hämtning (35–39 s uppmätt). Därför skickas XML:en som en ström i bitar om
// 64 kB, utan Content-Length.
//
// ☠️ MÄTT I PRODUKTION 2026-11-11: STRÖMMANDET RÄCKER INTE. /feed/prisjakt.xml
// var 11,4 MB, strömmat, och gav MISS tre gånger i rad (48–70 s per hämtning),
// medan bildsitemapen gav MISS och sedan HIT. CDN:en behåller alltså inte ett
// strömmat svar över 10 MB, vad dokumentationen än säger. Prisjakt-flödena
// byggs därför om vid varje hämtning i dag. De är alltid färska och lämnas så.
//
// Google-, Meta- och PriceRunner-flödena skickas i stället gzip-komprimerade
// (19,1 MB blir 2,5 MB), och det ryms i CDN:en.
//
// ☠️ MEN CDN:EN HÅLLER EN KOPIA PER ACCEPT-ENCODING-STRÄNG. Mätt på
// förhandsbygget 2026-11-11 med Vary: Accept-Encoding: "gzip" gav MISS och
// sedan HIT, men "gzip, deflate, br", "gzip, deflate" och "br, gzip" gav alla
// MISS. Varje läsare får alltså sin egen kopia, och den vi värmer hjälper inte
// Google. Därför två adresser:
//
//   /feed/<fil>      den adress läsarna har. next.config.ts skriver om den
//                    till /feed/gz/<fil> för den som tar emot gzip.
//   /feed/gz/<fil>   svarar ALLTID med gzip, utan Vary. En kopia i CDN:en,
//                    samma för alla (`komprimeratFlodessvar`).
//
// Den som inte tar emot gzip hamnar på /feed/<fil> som förut och får XML:en
// okomprimerad och strömmad (`flodessvar`); det svaret behålls inte av CDN:en.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

import { gzipSync } from "node:zlib";

/** Bitstorleken i strömmen. */
const BIT_BYTE = 64 * 1024;

/**
 * Prisjakt-rutternas varningsgräns för det strömmade svaret. Den sattes efter
 * dokumentationens 20 MB; mätningen ovan visar att gränsen i praktiken är 10 MB.
 */
export const PRISJAKT_VARNING_BYTE_STROMMAT = 19_000_000;

/**
 * CDN:en behåller ett svar upp till 10 MB. Varningen gäller det KOMPRIMERADE
 * svaret och ger marginal till det: Google-flödet var 2,5 MB som gzip
 * 2026-11-11 (19,1 MB okomprimerat), så varningen kommer vid ungefär tre
 * gånger dagens katalog.
 */
export const FLODE_VARNING_BYTE_GZIP = 8_000_000;

/** XML:en som en ström. Samma byte som strängen, i bitar. */
export function strommatXml(xml: string): ReadableStream<Uint8Array> {
  const byte = new TextEncoder().encode(xml);
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= byte.length) {
        controller.close();
        return;
      }
      controller.enqueue(byte.subarray(i, i + BIT_BYTE));
      i += BIT_BYTE;
    },
  });
}

/**
 * Flödena som har en komprimerad adress. next.config.ts skriver om
 * /feed/<fil> till /feed/gz/<fil> för just de här, och app/feed/gz/[fil]
 * bygger just de här. lib/feed/prisjakt-svar.test.ts håller ihop de tre listorna.
 */
export const KOMPRIMERADE_FLODEN = ["google.xml", "products.xml", "pricerunner.xml"] as const;

/**
 * Sant när flödet saknar varor. Ett tomt flöde är aldrig rätt: det betyder att
 * katalogen eller varianterna inte gick att läsa, och den som läser in det
 * tar bort varenda vara hos sig.
 */
export function arTomtFlode(xml: string): boolean {
  return !xml.includes("<item>");
}

/**
 * Svaret i stället för ett tomt flöde: 503 som inte sparas någonstans.
 * Läsaren behåller då sin förra inläsning, och CDN:en sin förra kopia.
 */
export function tomtFlodeSvar(vilket: string): Response {
  console.error(`[flode] ${vilket} byggdes utan en enda vara och skickas inte. Läsaren får 503 och behåller förra inläsningen.`);
  return new Response("Flödet kan inte byggas just nu", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600" },
  });
}

/**
 * Så här håller CDN:en ett flöde: färskt i en timme, och sedan det gamla i
 * högst två timmar till medan nästa byggs.
 *
 * ☠️ INTE ETT DYGN. Med stale-while-revalidate=86400 får den som hämtar en
 * gång om dygnet (Google Merchant Center) alltid förra hämtningens fil, alltså
 * gårdagens priser. Med två timmar är ett svar aldrig äldre än tre: ett äldre
 * svar räknas som borta, och hämtningen bygger ett nytt (långsamt men rätt).
 * /api/cron/farska-floden hämtar varannan timme, så det ska sällan hända.
 */
export const FLODE_CACHE = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200";

/**
 * Svaret på /feed/<fil>, adressen läsarna har.
 *
 * Utan `request`, eller utan gzip i Accept-Encoding, kommer flödet
 * okomprimerat och strömmat. Så läser rutterna varandra (Prisjakt, PriceRunner
 * och /feed/gz/<fil> bygger på flödets GET utan anrop), och så får en läsare
 * som inte kan gzip ett giltigt svar.
 *
 * Den som tar emot gzip ska inte komma hit alls: omskrivningen i
 * next.config.ts skickar den till /feed/gz/<fil>. Kommer den hit ändå (en
 * miljö utan omskrivningen) får den flödet komprimerat härifrån, och `Vary`
 * håller isär de två svaren.
 */
export function flodessvar(
  xml: string,
  request?: Request,
  opts: { cacheControl?: string; rubriker?: Record<string, string> } = {},
): Response {
  const rubriker: Record<string, string> = {
    ...opts.rubriker,
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": opts.cacheControl ?? FLODE_CACHE,
    Vary: "Accept-Encoding",
  };
  // Bara mot en läsare utifrån: rutterna som läser varandra utan anrop får
  // XML:en som den är och prövar den själva.
  if (request && arTomtFlode(xml)) return tomtFlodeSvar(new URL(request.url).pathname);
  if (!tarEmotGzip(request?.headers.get("accept-encoding"))) {
    return new Response(strommatXml(xml), { headers: rubriker });
  }
  return gzipSvar(xml, rubriker);
}

/**
 * Svaret på /feed/gz/<fil>: ALLTID gzip, och UTAN Vary.
 *
 * ☠️ Lägg aldrig Vary: Accept-Encoding här. Då delar CDN:en upp kopian per
 * rubriksträng igen, och det är just det adressen finns till för att slippa.
 * Hit kommer bara den som tar emot gzip (omskrivningen i next.config.ts) och
 * vårt eget jobb /api/cron/farska-floden.
 */
export function komprimeratFlodessvar(xml: string, vilket: string): Response {
  if (arTomtFlode(xml)) return tomtFlodeSvar(vilket);
  return gzipSvar(xml, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": FLODE_CACHE });
}

function gzipSvar(xml: string, rubriker: Record<string, string>): Response {
  const kropp = gzipSync(xml, { level: 6 });
  if (kropp.byteLength > FLODE_VARNING_BYTE_GZIP) {
    console.warn(
      `[flode] det komprimerade svaret är ${(kropp.byteLength / 1e6).toFixed(1)} MB. CDN:en behåller inget svar över 10 MB, ` +
        "och då byggs flödet om vid varje hämtning. Se lib/feed/prisjakt-svar.ts.",
    );
  }
  return new Response(kropp, {
    headers: { ...rubriker, "Content-Encoding": "gzip", "Content-Length": String(kropp.byteLength) },
  });
}

/**
 * Sant när Accept-Encoding tar emot gzip. "gzip;q=0" är ett uttryckligt nej,
 * och "*" räknas inte: den som inte nämner gzip får det okomprimerade svaret.
 */
export function tarEmotGzip(acceptEncoding: string | null | undefined): boolean {
  for (const del of (acceptEncoding ?? "").split(",")) {
    const [namn, ...parametrar] = del.trim().toLowerCase().split(";");
    if (namn.trim() !== "gzip" && namn.trim() !== "x-gzip") continue;
    const q = parametrar.map((p) => p.trim()).find((p) => p.startsWith("q="));
    return q === undefined || Number(q.slice(2)) > 0;
  }
  return false;
}

/**
 * Antal som går att logga: inga nummer, inga märken, bara räknare. Flödet har
 * en vara per rad (lib/feed/prisjakt.ts), så raderna räknas var för sig.
 */
export function prisjaktRakning(xml: string): { varor: number; gtin: number; mpn: number; mpnMedMarke: number; byte: number } {
  let varor = 0;
  let gtin = 0;
  let mpn = 0;
  let mpnMedMarke = 0;
  for (const rad of xml.split("\n")) {
    if (!rad.startsWith("<item>")) continue;
    varor++;
    if (rad.includes("<g:gtin>")) gtin++;
    if (rad.includes("<g:mpn>")) {
      mpn++;
      if (!rad.includes("<g:brand>Fyndplats</g:brand>")) mpnMedMarke++;
    }
  }
  return { varor, gtin, mpn, mpnMedMarke, byte: Buffer.byteLength(xml) };
}
