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

import { gunzipSync, gzipSync } from "node:zlib";

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
  return strommadeByte(new TextEncoder().encode(xml));
}

/** Byte som en ström, i bitar om 64 kB. */
function strommadeByte(byte: Uint8Array): ReadableStream<Uint8Array> {
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
export const KOMPRIMERADE_FLODEN = ["google.xml", "products.xml", "pinterest.xml"] as const;

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
  return komprimeratSvar(gzipFlode(xml));
}

/** Svaret på /feed/gz/<fil> för ett flöde som redan är komprimerat: gzip, utan Vary. */
export function komprimeratSvar(gz: Uint8Array<ArrayBuffer>): Response {
  return gzSvar(gz, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": FLODE_CACHE });
}

/** Flödet komprimerat, som det skickas och sparas. Varnar när det närmar sig CDN:ens gräns. */
export function gzipFlode(xml: string): Buffer<ArrayBuffer> {
  const kropp = gzipSync(xml, { level: 6 });
  if (kropp.byteLength > FLODE_VARNING_BYTE_GZIP) {
    console.warn(
      `[flode] det komprimerade svaret är ${(kropp.byteLength / 1e6).toFixed(1)} MB. CDN:en behåller inget svar över 10 MB, ` +
        "och då byggs flödet om vid varje hämtning. Se lib/feed/prisjakt-svar.ts.",
    );
  }
  return kropp;
}

function gzipSvar(xml: string, rubriker: Record<string, string>): Response {
  return gzSvar(gzipFlode(xml), rubriker);
}

function gzSvar(kropp: Uint8Array<ArrayBuffer>, rubriker: Record<string, string>): Response {
  return new Response(kropp, {
    headers: { ...rubriker, "Content-Encoding": "gzip", "Content-Length": String(kropp.byteLength) },
  });
}

// ---------------------------------------------------------------------------
// Svaren ur den sparade kopian (lib/feed/flodeslager.ts).
//
// ☠️ CDN:EN BEHÅLLER INTE ETT FLÖDE SOM SÄLLAN HÄMTAS (mätt 2026-11-15). Varje
// körning av /api/cron/farska-floden fick MISS på Google-, PriceRunner- och
// Pinterest-flödet, fast förra körningen byggt kopian två timmar tidigare och
// den skulle ha gällt i tre. Vercel: "If your asset is rarely requested (e.g.
// once a day), it may be evicted from the regional cache"
// (vercel.com/docs/caching/cdn-cache, Limits). Den som hämtar en gång om
// dygnet (Google Merchant Center, PriceRunner, Pinterest) eller tre gånger om
// dygnet (Prisjakt) fick därför nästan alltid vänta på ett bygge: 50–78 s.
// En kopia sparad i Vercels Runtime Cache läses i stället på en sekund eller
// två, och svaren nedan byggs ur den.
// ---------------------------------------------------------------------------

/** En sparad kopia av ett flöde: gzip-filen, när bygget började och den okomprimerade storleken. */
export type FlodesKopia = { gz: Uint8Array<ArrayBuffer>; byggd: number; xmlByte: number };

/** Det HEAD behöver veta om kopian, utan att läsa själva filen. */
export type KopiansHuvud = { byggd: number; gzByte: number; xmlByte: number };

/**
 * CDN-tiden för ett svar ur kopian: färskt tills kopian är en timme gammal,
 * minst en minut, och sedan det gamla i högst två timmar medan nästa hämtas,
 * som FLODE_CACHE. En kopia som redan är två timmar gammal ska alltså inte
 * hållas en timme till.
 */
export function kopiansCacheControl(alderS: number): string {
  const s = Math.min(3600, Math.max(60, Math.round(3600 - Math.max(0, alderS))));
  return `public, max-age=${s}, s-maxage=${s}, stale-while-revalidate=7200`;
}

function kopiansRubriker(kopia: FlodesKopia, nu: number): Record<string, string> {
  return {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": kopiansCacheControl((nu - kopia.byggd) / 1000),
    "Last-Modified": new Date(kopia.byggd).toUTCString(),
  };
}

/** /feed/gz/<fil> ur kopian: samma gzip-byte som sparades, utan Vary (se komprimeratFlodessvar). */
export function komprimeratSvarUrKopia(kopia: FlodesKopia, nu = Date.now()): Response {
  return gzSvar(kopia.gz, kopiansRubriker(kopia, nu));
}

/**
 * /feed/<fil> ur kopian. Den som inte tar emot gzip får XML:en uppackad och
 * strömmad, som från ett bygge: ett svar över 10 MB behålls inte av CDN:en,
 * och då ska läsaren åtminstone slippa vänta på bygget.
 *
 * Mätt på förhandsbygget 2026-11-15: Vercel skickar `Accept-Encoding: gzip`
 * till rutten också när läsaren inte skickat någon, och packar själv upp
 * svaret åt en sådan läsare (19,9 MB på 2,0 s). Svaret är rätt åt båda hållen.
 *
 * `rubriker` läggs till sist: det hemliga Prisjakt-flödet skickar
 * X-Robots-Tag och en egen CDN-tid med stale-if-error.
 */
export function flodessvarUrKopia(
  kopia: FlodesKopia,
  request: Request | undefined,
  opts: { nu?: number; rubriker?: Record<string, string> } = {},
): Response {
  const rubriker = { ...kopiansRubriker(kopia, opts.nu ?? Date.now()), Vary: "Accept-Encoding", ...opts.rubriker };
  if (tarEmotGzip(request?.headers.get("accept-encoding"))) return gzSvar(kopia.gz, rubriker);
  return new Response(strommadeByte(gunzipSync(kopia.gz)), { headers: rubriker });
}

/**
 * Svaret på HEAD: samma rubriker som GET skulle ge, utan att något byggs.
 *
 * ☠️ MÄTT 2026-11-15: CDN:EN NYCKLAR PÅ METODEN. En HEAD läser aldrig GET:s
 * kopia (vercel.com/docs/caching/cdn-cache/purge, "Cache keys"), och utan en
 * egen HEAD kör Next GET och bygger hela flödet: 52 s för ett svar utan kropp,
 * medan GET-kopian låg i samma region. Pinterest gör en HEAD före varje
 * inläsning (loggen 09:12–09:13 UTC samma dag).
 *
 * Längden och tiden står med när det finns en sparad kopia att läsa dem ur.
 * `no-store`: svaret ska spegla kopian som den är nu, inte för en timme sedan.
 */
export function huvudsvar(opts: { komprimerat: boolean; kopia?: KopiansHuvud | null; rubriker?: Record<string, string> }): Response {
  const rubriker: Record<string, string> = {
    ...opts.rubriker,
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (opts.komprimerat) {
    rubriker["Content-Encoding"] = "gzip";
    if (opts.kopia) rubriker["Content-Length"] = String(opts.kopia.gzByte);
  } else {
    rubriker.Vary = "Accept-Encoding";
  }
  if (opts.kopia) rubriker["Last-Modified"] = new Date(opts.kopia.byggd).toUTCString();
  return new Response(null, { status: 200, headers: rubriker });
}

/**
 * Vem som hämtar, för loggen: Accept-Encoding och läsarens namn ur
 * User-Agent ("Pinterestbot/1.0", "Googlebot/2.1"), aldrig mer än så. Där
 * syns vad Pinterest och de andra läsarna skickar.
 */
export function lasare(request?: Request): string {
  const ae = (request?.headers.get("accept-encoding") ?? "").trim().slice(0, 40) || "utan accept-encoding";
  // Bara början av User-Agent: regexen nedan tar kvadratisk tid mot längden,
  // och vem som helst kan skicka tiotals kB (32 kB: 2,3 s CPU per anrop, mätt
  // 2026-11-15). Robotarnas namn står långt före tecken 512.
  const ua = (request?.headers.get("user-agent") ?? "").slice(0, 512);
  const robot = ua.match(/[\w.-]*(?:bot|pinterest|google|facebook|meta|pricerunner|gowish|onskeskyen|heylink|crawler|spider)[\w./-]*/i)?.[0];
  const namn = (robot ?? ua.split(/[\s(;]/)[0] ?? "").slice(0, 40) || "okänd";
  return `${ae}; ${namn}`;
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
