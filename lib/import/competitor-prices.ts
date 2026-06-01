// Konkurrentpris-check (Feature 2, 2026-06-02).
//
// Innan import (eller i admin-kön) frågar vi svenska prisjämförelsetjänster om
// samma/liknande produkt: Pricerunner, Prisjakt och Google Shopping. Allt sker via
// vanlig HTTP-skrapning + lokal HTML-parsing — INGA betaltjänster, INGA AI-anrop ($0).
//
// Resultat cachas i Wix Data i 7 dagar (keyed på SHA-256 av sökfrågan) och varje
// källa throttlas till max 1 sökning/sekund för att inte bli IP-bannad.
//
// OBS om tillförlitlighet: dessa sajter är React-/bot-skyddade. En serverless
// fetch utan browser får inte alltid strukturerad data tillbaka. Parsningen är
// därför defensiv (JSON-LD → embedded JSON → pris-regex) och faller tyst tillbaka
// till tom lista per källa. findCompetitorPrices returnerar det som faktiskt gick
// att läsa — aldrig ett fel som fäller importen.

import { createHash } from "node:crypto";
import {
  getCachedCompetitorPrices,
  putCachedCompetitorPrices,
} from "../store/competitor-price-cache";

export type CompetitorSource = "Pricerunner" | "Prisjakt" | "Google Shopping";

export interface CompetitorPrice {
  source: CompetitorSource;
  title: string;
  priceSek: number;
  url: string;
  /** 0–1: hur väl träffens titel matchar sökfrågan (ordmängd-overlap). */
  matchConfidence: number;
}

// --- Sökfråge-byggare (ren, enhetstestbar) ----------------------------------

/**
 * Filler/marknadsföringsord och måttenheter som inte hjälper en cross-store-match.
 * Tas bort så att "brand + produkttyp" blir kvar. Färger tas bort (samma produkt
 * säljs i flera färger hos konkurrenter).
 */
const QUERY_STOPWORDS = new Set([
  // Marknadsföring / generiska adjektiv
  "ny", "nya", "het", "premium", "professionell", "pro", "bärbar", "portabel",
  "uppladdningsbar", "laddbar", "justerbar", "hopfällbar", "vattentät", "vattentat",
  "high", "quality", "best", "hot", "sale", "original", "äkta", "akta", "universal",
  "multifunktionell", "smart", "mini", "stor", "liten", "set", "kit",
  // Kopplingsord
  "med", "och", "för", "for", "till", "i", "på", "pa", "av", "the", "and", "with",
  // Pack/antal
  "pack", "st", "styck", "stycken", "par", "förpackning", "forpackning",
  // Färger
  "svart", "vit", "vita", "röd", "rod", "blå", "bla", "grön", "gron", "gul",
  "rosa", "lila", "grå", "gra", "brun", "beige", "guld", "silver", "orange",
  "black", "white", "red", "blue", "green", "pink", "grey", "gray", "gold",
]);

/** Måttenhets-token (t.ex. "500ml", "12cm", "2000mah", "1080p") tas bort. */
const MEASUREMENT_RE = /^\d+([.,]\d+)?(mm|cm|m|ml|l|g|kg|w|v|mah|tum|p|k|hz|gb|tb)?$/i;

/**
 * Trimmar en produkt-titel till en kärnfull sökfråga: gemener, ta bort skiljetecken,
 * släng filler/mått/färger, behåll de första `maxWords` (default 6) orden.
 */
export function buildSearchQuery(title: string, maxWords = 6): string {
  const tokens = (title || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length >= 2)
    .filter((w) => !QUERY_STOPWORDS.has(w))
    .filter((w) => !MEASUREMENT_RE.test(w));
  return tokens.slice(0, maxWords).join(" ");
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

// --- HTML-/pris-parsing (rena hjälpare) -------------------------------------

/** Ordmängd-overlap (jaccard) mellan sökfråga och en träfftitel, 0–1. */
export function titleMatchConfidence(query: string, candidate: string): number {
  const q = new Set(query.toLowerCase().split(/\s+/).filter((w) => w.length >= 2));
  const c = new Set(
    (candidate || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2),
  );
  if (q.size === 0 || c.size === 0) return 0;
  let inter = 0;
  for (const w of q) if (c.has(w)) inter++;
  return inter / q.size;
}

/**
 * Plockar pris (SEK) ur en sträng som kan vara "1 299 kr", "1299:-", "299 kr",
 * "kr 1 299", "\"price\":\"299.00\"". Returnerar första rimliga priset eller null.
 */
export function parseSekPrice(text: string): number | null {
  if (!text) return null;
  const patterns = [
    /(\d[\d\s.]{0,8}\d|\d)\s*(?:kr|:-|sek)/i,
    /(?:kr|sek)\s*(\d[\d\s.]{0,8}\d|\d)/i,
    /"price"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
    /"amount"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1].replace(/\s/g, "").replace(",", "."));
      if (Number.isFinite(n) && n > 0 && n < 1_000_000) return Math.round(n);
    }
  }
  return null;
}

/** Extraherar { name, price } ur JSON-LD Product/Offer-block i en HTML-sida. */
export function extractJsonLdPrices(html: string): { name: string; priceSek: number }[] {
  const out: { name: string; priceSek: number }[] = [];
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const json = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      continue;
    }
    const nodes = Array.isArray(parsed)
      ? parsed
      : [parsed, ...((parsed as { "@graph"?: unknown[] })?.["@graph"] ?? [])];
    for (const node of nodes) {
      const n = node as {
        "@type"?: string | string[];
        name?: string;
        offers?: { price?: string | number; priceCurrency?: string } | Array<{ price?: string | number; priceCurrency?: string }>;
      };
      const type = Array.isArray(n["@type"]) ? n["@type"].join(",") : n["@type"];
      if (!type || !/product/i.test(type)) continue;
      const offers = Array.isArray(n.offers) ? n.offers : n.offers ? [n.offers] : [];
      for (const o of offers) {
        const price = Number(String(o.price ?? "").replace(",", "."));
        if (Number.isFinite(price) && price > 0) {
          out.push({ name: String(n.name ?? "").slice(0, 140), priceSek: Math.round(price) });
        }
      }
    }
  }
  return out;
}

// --- Throttle ----------------------------------------------------------------

const lastRequestAt = new Map<string, number>();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Väntar så att minst `minIntervalMs` passerat sedan förra anropet mot källan. */
async function throttle(source: string, minIntervalMs = 1000): Promise<void> {
  const last = lastRequestAt.get(source) ?? 0;
  const wait = last + minIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(source, Date.now());
}

async function fetchHtml(url: string, timeoutMs = 12_000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // En realistisk browser-UA minskar (men eliminerar inte) bot-blockering.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Generisk källa-skrapare: hämtar sök-URL:en, parsar priser, returnerar topp N. */
async function scrapeSource(
  source: CompetitorSource,
  searchUrl: string,
  query: string,
  limit = 5,
): Promise<CompetitorPrice[]> {
  await throttle(source);
  const html = await fetchHtml(searchUrl);
  if (!html) return [];

  const found: CompetitorPrice[] = [];
  // 1. JSON-LD (mest tillförlitligt när det finns).
  for (const { name, priceSek } of extractJsonLdPrices(html)) {
    found.push({
      source,
      title: name || query,
      priceSek,
      url: searchUrl,
      matchConfidence: name ? titleMatchConfidence(query, name) : 0.3,
    });
  }
  // 2. Fallback: råa SEK-priser i sidan (lägre confidence — vi vet inte titeln).
  if (found.length === 0) {
    const prices = new Set<number>();
    const re = /(\d[\d\s.]{0,8}\d|\d)\s*(?:kr|:-)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null && prices.size < limit * 3) {
      const n = Number(m[1].replace(/\s/g, "").replace(",", "."));
      if (Number.isFinite(n) && n >= 10 && n < 100_000) prices.add(Math.round(n));
    }
    for (const p of prices) {
      found.push({ source, title: query, priceSek: p, url: searchUrl, matchConfidence: 0.25 });
    }
  }

  // Sortera på pris stigande, behåll topp `limit`.
  return found.sort((a, b) => a.priceSek - b.priceSek).slice(0, limit);
}

function pricerunnerUrl(q: string): string {
  return `https://www.pricerunner.se/search?q=${encodeURIComponent(q)}`;
}
function prisjaktUrl(q: string): string {
  return `https://www.prisjakt.nu/search?query=${encodeURIComponent(q)}`;
}
function googleShoppingUrl(q: string): string {
  return `https://www.google.com/search?tbm=shop&hl=sv&gl=se&q=${encodeURIComponent(q)}`;
}

// --- Huvud-API ---------------------------------------------------------------

export interface FindCompetitorOptions {
  /** Hoppa över cachen (tvinga färsk skrapning). */
  noCache?: boolean;
  /** Begränsa vilka källor som frågas (default: alla tre). */
  sources?: CompetitorSource[];
}

/**
 * Hämtar konkurrentpriser för en produkt-titel. Kollar 7-dagars Wix-cache först;
 * vid miss skrapas valda källor parallellt, resultatet cachas och returneras.
 * Fail-open: en källa som failar bidrar bara med 0 träffar.
 */
export async function findCompetitorPrices(
  productTitle: string,
  _optionalImageUrl?: string,
  opts: FindCompetitorOptions = {},
): Promise<CompetitorPrice[]> {
  const query = buildSearchQuery(productTitle);
  if (!query) return [];

  const key = sha256(query);
  if (!opts.noCache) {
    const cached = await getCachedCompetitorPrices(key);
    if (cached) return cached.prices;
  }

  const sources = opts.sources ?? (["Pricerunner", "Prisjakt", "Google Shopping"] as CompetitorSource[]);
  const tasks: Promise<CompetitorPrice[]>[] = sources.map((s) => {
    if (s === "Pricerunner") return scrapeSource(s, pricerunnerUrl(query), query);
    if (s === "Prisjakt") return scrapeSource(s, prisjaktUrl(query), query);
    return scrapeSource(s, googleShoppingUrl(query), query);
  });
  const settled = await Promise.allSettled(tasks);
  const prices = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Cacha även tomma resultat (7 dgr) — slipper hamra en blockerande källa.
  const now = Date.now();
  await putCachedCompetitorPrices({
    key,
    query,
    prices,
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return prices;
}

// --- Prisrekommendation (ren, enhetstestbar) --------------------------------

export type CompetitionSignal = "green" | "yellow" | "red" | "none";

export interface CompetitionSummary {
  signal: CompetitionSignal;
  /** Färdig svensk rekommendationstext (med emoji) för UI:t. */
  message: string;
  lowestSek: number | null;
  highestSek: number | null;
  /** Antal träffar totalt. */
  count: number;
  /** Antal distinkta källor som gav träff. */
  sources: number;
}

/** Pris under detta = "säljs överallt billigt, passar inte". Override: COMPETITOR_RED_FLOOR_SEK. */
function redFloorSek(): number {
  const n = Number(process.env.COMPETITOR_RED_FLOOR_SEK);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

/**
 * Väger samman konkurrentpriser till en signal + rekommendation. `ourPriceSek`
 * (vårt tänkta pris) är valfritt — anges det kan vi säga om vi kan bli prisledare.
 */
export function summarizeCompetition(
  prices: CompetitorPrice[],
  ourPriceSek?: number,
): CompetitionSummary {
  const values = prices.map((p) => p.priceSek).filter((n) => Number.isFinite(n) && n > 0);
  const sources = new Set(prices.map((p) => p.source)).size;
  if (values.length === 0) {
    return {
      signal: "none",
      message: "Inga konkurrentpriser hittades — fri prissättning (eller nischprodukt).",
      lowestSek: null,
      highestSek: null,
      count: 0,
      sources: 0,
    };
  }

  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const floor = redFloorSek();

  // 🔴 Säljs överallt billigt → tunn marginal, passar sällan.
  if (lowest < floor) {
    return {
      signal: "red",
      message: `🔴 Säljs redan från ${lowest} kr (under ${floor} kr) hos konkurrenter — svårt att få marginal.`,
      lowestSek: lowest,
      highestSek: highest,
      count: values.length,
      sources,
    };
  }

  // 🟡 Hög konkurrens: många träffar i ett tätt prisband.
  if (values.length >= 4) {
    return {
      signal: "yellow",
      message: `🟡 Hög konkurrens: ${values.length} träffar på ${sources} sajt(er) mellan ${lowest}–${highest} kr — kräver marginal-flex.`,
      lowestSek: lowest,
      highestSek: highest,
      count: values.length,
      sources,
    };
  }

  // 🟢 Få konkurrenter → utrymme att vara prisledare.
  if (ourPriceSek && ourPriceSek < lowest) {
    return {
      signal: "green",
      message: `🟢 Du kan bli prisledare på ${Math.round(ourPriceSek)} kr (lägsta konkurrent ${lowest} kr).`,
      lowestSek: lowest,
      highestSek: highest,
      count: values.length,
      sources,
    };
  }
  const leaderPrice = Math.max(floor, lowest - 10);
  return {
    signal: "green",
    message: `🟢 Låg konkurrens (${values.length} träff(ar), lägsta ${lowest} kr) — du kan prisleda runt ${leaderPrice} kr.`,
    lowestSek: lowest,
    highestSek: highest,
    count: values.length,
    sources,
  };
}
