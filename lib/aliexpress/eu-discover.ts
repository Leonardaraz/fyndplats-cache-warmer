// EU-lager-filter för "Alla EU"-vyn (discover-panelen i tillägget).
//
// Problemet: aliexpress.ds.text.search returnerar INGEN ship-from per träff
// (se kommentaren ovanför searchAliExpressByText i client.ts). Det gamla filtret
// i /api/aliexpress/discover släppte därför igenom alla träffar med okänd
// ship-from (fail-open) → "Alla EU"-panelen visade i praktiken hela
// sökresultatet (mest Kina-lager), alla med badgen "okänt lager".
//
// Lösning: berika varje träff som saknar känd ship-from via detalj-API:t
// (aliexpress.ds.product.get → getProduct), som HAR pålitlig ship-from
// (samma källa som importen litar på). Sedan FAIL-CLOSED: en produkt
// inkluderas bara om vi kan BEKRÄFTA minst ett EU-lager.
//
// Kostnad: ett detalj-anrop per okänd träff. Vi dämpar med (a) en concurrency-
// gräns, (b) en in-memory-cache per process (icke-tomma svar) så paginering/
// omsökning inte berikar samma produkt igen. Allt tunbart via env.

import { classifyWarehouses, isEuCountry } from "./eu-countries";
import type { AliExpressSearchResult } from "./client";

interface CacheEntry {
  codes: string[];
  expires: number;
}

// Process-lokal cache. Serverless-instanser är kortlivade så träffgraden är
// måttlig, men den räcker för att slippa berika samma produkt om och om under
// en bläddringssession (paginering, sortering, "Visa fler").
const moduleCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 5000;

export interface FilterEuDeps {
  /** Hämtar bekräftade ship-from-koder för en produkt (detalj-API:t). */
  getShipFrom: (productId: string) => Promise<string[]>;
  /** Max parallella detalj-anrop. Default 4 (skona AliExpress rate-limit). */
  concurrency?: number;
  /** Cache-TTL för icke-tomma svar. Default 24 h. */
  cacheTtlMs?: number;
  /** Injicerbar klocka (test). */
  now?: () => number;
  /** Injicerbar cache (test). Default: process-cachen. */
  cache?: Map<string, CacheEntry>;
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const workers = Math.max(1, Math.min(limit, items.length));
  let idx = 0;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (idx < items.length) {
        const i = idx++;
        await fn(items[i]);
      }
    }),
  );
}

function cacheGet(cache: Map<string, CacheEntry>, id: string, now: number): string[] | undefined {
  const hit = cache.get(id);
  if (hit && hit.expires > now) return hit.codes;
  if (hit) cache.delete(id); // utgången
  return undefined;
}

function cacheSet(
  cache: Map<string, CacheEntry>,
  id: string,
  codes: string[],
  expires: number,
): void {
  // Cacha BARA icke-tomma svar: ett tomt svar kan vara ett övergående detalj-fel
  // (rate-limit/timeout) — då vill vi försöka igen nästa gång hellre än att
  // felaktigt utesluta produkten under hela TTL:n.
  if (codes.length === 0) return;
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(id, { codes, expires });
}

/**
 * Filtrerar sökträffar till bara bekräftade EU-lager-produkter.
 *
 * - Träffar som redan har ship-from-koder (om sök-API:t någon gång ger det)
 *   används direkt utan extra anrop.
 * - Träffar utan känd ship-from berikas via `getShipFrom` (med cache + concurrency).
 * - FAIL-CLOSED: en produkt tas bara med om minst en kod är EU. Okänd ship-from
 *   (även efter berikning, t.ex. detalj-fel) → utesluts.
 * - Ordningen från sökningen bevaras (sortByn respekteras).
 */
export async function filterEuWarehouses(
  results: AliExpressSearchResult[],
  deps: FilterEuDeps,
): Promise<AliExpressSearchResult[]> {
  const {
    getShipFrom,
    concurrency = 4,
    cacheTtlMs = 24 * 60 * 60 * 1000,
    now = Date.now,
    cache = moduleCache,
  } = deps;

  const codes: string[][] = results.map((r) => r.shipsFromCountries ?? []);

  // Gruppera index per productId så DUBBLETTER på samma sida bara berikas EN gång
  // (sök-API:t deduppar inte träffar → annars dubbla, betalda detalj-anrop).
  const todoById = new Map<string, number[]>();
  for (let i = 0; i < results.length; i++) {
    if (codes[i].length > 0) continue; // redan känd → inget detalj-anrop
    const id = results[i].productId;
    if (!id) continue;
    const cached = cacheGet(cache, id, now());
    if (cached) {
      codes[i] = cached;
      continue;
    }
    const arr = todoById.get(id);
    if (arr) arr.push(i);
    else todoById.set(id, [i]);
  }

  await mapWithConcurrency([...todoById.keys()], concurrency, async (id) => {
    let got: string[] = [];
    try {
      got = await getShipFrom(id);
    } catch {
      got = []; // detalj-fel → okänd → utesluts (fail-closed)
    }
    for (const i of todoById.get(id) ?? []) codes[i] = got;
    cacheSet(cache, id, got, now() + cacheTtlMs);
  });

  const out: AliExpressSearchResult[] = [];
  for (let i = 0; i < results.length; i++) {
    const c = codes[i];
    if (c.length === 0 || !c.some((code) => isEuCountry(code))) continue;
    const original = results[i];
    // Berikade träffar får uppdaterade ship-from-fält så badgen i UI:t blir rätt.
    out.push(
      c === (original.shipsFromCountries ?? [])
        ? original
        : {
            ...original,
            shipsFromCountries: c,
            hasEuWarehouse: true,
            warehouseClass: classifyWarehouses(c),
          },
    );
  }
  return out;
}

/** Töm process-cachen (test/admin). */
export function clearShipFromCache(): void {
  moduleCache.clear();
}
