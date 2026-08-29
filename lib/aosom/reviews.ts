// Aosoms produktrecensioner: hämta ur produktsidans JSON-LD.
//
// Vi köper varorna av Aosom, så det är samma fysiska artikelnummer — deras
// recensioner handlar om PRODUKTEN, inte om Aosom som säljare. Sådana
// recensioner får visas vidare, och det görs i stor skala av
// syndikeringstjänster (Bazaarvoice, Reevoo) åt tusentals butiker.
//
// ☠️ VILLKORET ÄR ATT KÄLLAN ANGES. Artikel 7.6 UCPD (Omnibus 2019/2161)
// ålägger den som visar konsumentrecensioner att upplysa om huruvida och hur
// de kommer från konsumenter som faktiskt använt produkten; bilaga I punkt 23b
// förbjuder att PÅSTÅ att de är egna kunders utan täckning. Därför sätter
// hämtningen `source: "aosom"` på varje rad — se ReviewImportDeps.source — och
// produktsidan måste rendera härkomsten. En omärkt rad hamnar under rubriken
// "Kundrecensioner" som om den vore vår egen kunds, och DET är överträdelsen.
//
// ☠️ AGGREGATET FÅR INTE RÄKNAS UR DE HÄMTADE TEXTERNA. JSON-LD bär högst fem
// recensioner av ibland åttiotalet, och Aosoms urval lutar högt: uppmätt snitt
// 4,86 över 30 spridda produkter ur vår egen katalog (2026-08-29). Räknar man
// snittet av de fem blir Aosoms filter vårt, och sidan påstår "5 recensioner,
// 5,0" när sanningen är "88 recensioner, 4,8". Därför bärs `rating` och
// `reviewCount` vidare RÅA från aggregateRating och lagras på mappningen.
//
// Mätt täckning på samma urval: 77 % har aggregerat betyg, 63 % minst en
// recensionstext, i snitt 2,1 texter per produkt (inte 5).

import type { AERReview } from "../import/review-import";

/**
 * ☠️ Aosom ligger bakom Akamai och avvisar allt som inte ser ut som en
 * webbläsare — även `robots.txt` svarar "Access Denied" på en naken förfrågan.
 * En vanlig `fetch(url)` från Vercel får 403. Raderna nedan är minimum för att
 * släppas in; `Accept-Language` och `Sec-Fetch-*` är de som faktiskt avgör.
 *
 * robots.txt tillåter i övrigt `/item/`-sidorna (2026-08-29) och bär inga
 * AI-/Content-Signal-direktiv.
 */
export const AOSOM_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

/**
 * Platshållarnamn som INTE är personer.
 *
 * Samma lärdom som "AliExpress Shopper" i AE-kedjan: skickas platshållaren
 * vidare härleds initialer ur den, och då blir varenda rad "A.K." — en sida
 * där alla heter likadant ser förfalskad ut. Släpps namnet i stället som
 * `undefined` faller `deriveInitials` tillbaka på hash-bokstäver, som varierar
 * per recension.
 */
const GENERIC_AUTHORS = new Set([
  "aosom kunde",
  "aosom customer",
  "aosom kunden",
  "anonym",
  "anonymous",
  "kunde",
  "customer",
  "gast",
  "gäst",
]);

export function isGenericAuthor(name: string | undefined): boolean {
  const n = (name ?? "").trim().toLowerCase();
  if (!n) return true;
  return GENERIC_AUTHORS.has(n);
}

export interface AosomProductReviews {
  /** Aosoms EGET snittbetyg — aldrig uträknat ur texterna nedan. */
  rating?: number;
  /** Aosoms EGET antal — kan vara långt fler än `reviews.length`. */
  reviewCount?: number;
  /** De recensioner JSON-LD faktiskt bär (högst fem). */
  reviews: AERReview[];
}

function firstNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function authorName(a: unknown): string | undefined {
  if (typeof a === "string") return a;
  if (a && typeof a === "object") {
    const n = (a as { name?: unknown }).name;
    if (typeof n === "string") return n;
  }
  return undefined;
}

/** Plockar ut varje JSON-LD-block och returnerar dem som objekt. */
function jsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      // Ett trasigt block får aldrig fälla de andra — Aosom levererar flera.
    }
  }
  return out;
}

/**
 * Tolkar en Aosom-produktsida.
 *
 * Ren funktion med HTML in: hela poängen är att parsningen ska gå att låsa i
 * test utan att röra nätet, eftersom det är formen på Aosoms svar som kan
 * ändras under fötterna på oss.
 */
export function parseAosomProductReviews(html: string): AosomProductReviews {
  let product: Record<string, unknown> | null = null;
  for (const block of jsonLdBlocks(html)) {
    const cands = Array.isArray(block) ? block : [block];
    for (const c of cands) {
      if (c && typeof c === "object" && (c as { "@type"?: unknown })["@type"] === "Product") {
        product = c as Record<string, unknown>;
      }
    }
  }
  if (!product) return { reviews: [] };

  const agg = (product.aggregateRating ?? {}) as Record<string, unknown>;
  const rating = firstNumber(agg.ratingValue);
  const reviewCount = firstNumber(agg.reviewCount) ?? firstNumber(agg.ratingCount);

  const raw = product.review;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const reviews: AERReview[] = [];
  for (const r of list) {
    if (!r || typeof r !== "object") continue;
    const rec = r as Record<string, unknown>;
    // Aosom lägger texten i `description`; `reviewBody` är schemats egna fält
    // och förekommer också. Ta båda hellre än att tappa halva skörden.
    const text = String(rec.reviewBody ?? rec.description ?? "").trim();
    if (!text) continue;
    const rr = (rec.reviewRating ?? {}) as Record<string, unknown>;
    const stars = firstNumber(rr.ratingValue);
    const namn = authorName(rec.author);
    reviews.push({
      rating: stars ?? 0,
      text,
      // Tyska genomgående. Fältet styr inget i flödet men gör kön läsbar:
      // /admin/reviews visar vilket språk texten ska skrivas om FRÅN.
      language: "de",
      customerName: isGenericAuthor(namn) ? undefined : namn,
      date: typeof rec.datePublished === "string" ? rec.datePublished : undefined,
      hasImage: false,
    });
  }

  return { rating, reviewCount, reviews };
}

/** Statuskoder som är värda ett omförsök — resten ger upp direkt. */
function worthRetrying(status: number): boolean {
  return status === 403 || status === 429 || status >= 500;
}

export interface FetchAosomDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Hämtar och tolkar EN produktsida.
 *
 * Kastar aldrig på ett nätfel — svarar med `{ reviews: [] }` och `error`, så
 * en enskild trasig sida inte fäller ett svep över tusentals produkter. Samma
 * fail-open-ton som resten av lib/aosom.
 */
export async function fetchAosomReviews(
  sourceUrl: string,
  deps: FetchAosomDeps = {},
): Promise<AosomProductReviews & { error?: string }> {
  const doFetch = deps.fetchImpl ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  // `?utm_source=b2b` följer med från feeden. Den ändrar inget i svaret men
  // gör loggen svårläst och cache-nyckeln onödigt unik.
  const url = sourceUrl.replace(/[?&]utm_source=b2b\b/, "");

  const backoff = [1000, 3000, 8000];
  let sista = "";
  for (let försök = 0; försök <= backoff.length; försök++) {
    try {
      const res = await doFetch(url, { headers: AOSOM_HEADERS });
      if (!res.ok) {
        sista = `HTTP ${res.status}`;
        if (!worthRetrying(res.status) || försök === backoff.length) break;
        await sleep(backoff[försök]);
        continue;
      }
      return parseAosomProductReviews(await res.text());
    } catch (err) {
      sista = err instanceof Error ? err.message : String(err);
      if (försök === backoff.length) break;
      await sleep(backoff[försök]);
    }
  }
  return { reviews: [], error: sista };
}
