// VEVOR:s produktkarta: vilka produktsidor som finns.
//
// Kartan läses en gång per dygn. Den ger alla produktadresser (15 631 den
// 2026-10-29), och varje ny adress blir en rad att läsa. En adress som
// försvinner ur kartan läses om samma dag — men den räknas inte som borta
// för det. Se `borta` i lib/vevor/lasare.ts.
//
// ☠️ EN KARTA SOM SER TRASIG UT RÖR INGENTING. En halvhämtad fil hade fått
// tusentals levande sidor att se ut att ha försvunnit. Samma tanke som
// Aosom-synkens MIN_FEED_RADER.

import { gunzipSync } from "node:zlib";
import { hamtaFil, tillatenSokvag, type Hamtare, type Svar, type Takt } from "./hamtning";
import { sokvagUr, webbIdUr } from "./sida";

export const SITEMAP_INDEX = "/sitemap/sitemap-index.xml";

/** Färre produkter än så är en trasig karta, aldrig ett krympt sortiment. */
export const MIN_KARTRADER = 5_000;

export interface Kartrad {
  webbId: string;
  sokvag: string;
}

/** `<loc>`-värdena i en sajtkarta. */
export function locVarden(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/** Produktkartornas sökvägar ur indexet. */
export function produktkartor(indexXml: string): string[] {
  return locVarden(indexXml)
    .map((u) => sokvagUr(u))
    .filter((s): s is string => !!s && /^\/sitemap\/sitemap_product_\d+\.xml\.gz$/.test(s));
}

/**
 * Produktsidorna i en karta. Adresser på andra värdar, utan webb-id eller på en
 * sökväg läsaren aldrig får läsa (`tillatenSokvag`) räknas, men tas inte med:
 * en sådan rad i kön hade aldrig gått att läsa.
 */
export function kartrader(xml: string): { rader: Kartrad[]; ogiltiga: number } {
  const rader: Kartrad[] = [];
  const sedda = new Set<string>();
  let ogiltiga = 0;
  for (const u of locVarden(xml)) {
    const sokvag = sokvagUr(u);
    const webbId = sokvag ? webbIdUr(sokvag) : null;
    if (!sokvag || !webbId || !tillatenSokvag(sokvag)) {
      ogiltiga++;
      continue;
    }
    if (sedda.has(webbId)) continue;
    sedda.add(webbId);
    rader.push({ webbId, sokvag });
  }
  return { rader, ogiltiga };
}

export type Kartsvar =
  | { ok: true; rader: Kartrad[]; ogiltiga: number }
  | { ok: false; skal: string; svar?: Exclude<Svar, { typ: "sida" }> };

/** Största uppackade karta. Den mätta är ~1 MB packad. */
const MAX_UPPACKAD = 200_000_000;

/**
 * Filen som text. Packas upp bara när den börjar som gzip: en server som skickar
 * `.gz` med `Content-Encoding: gzip` får fetch att packa upp den redan på vägen,
 * och då är byten vanlig XML.
 */
export function kartText(data: Uint8Array): string {
  const gz = data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
  return Buffer.from(gz ? gunzipSync(data, { maxOutputLength: MAX_UPPACKAD }) : data).toString("utf8");
}

/**
 * Läser indexet och varje produktkarta, i takt. `tillaten` är robots.txt:s
 * regler: en karta som robots.txt spärrar hämtas inte.
 */
export async function lasKartan(opts: {
  takt: Takt;
  hamtare?: Hamtare;
  tillaten?: (sokvag: string) => boolean;
}): Promise<Kartsvar> {
  const tillaten = opts.tillaten ?? (() => true);
  if (!tillaten(SITEMAP_INDEX)) return { ok: false, skal: "robots.txt spärrar kartan" };
  const index = await hamtaFil(SITEMAP_INDEX, opts);
  if (index.typ !== "fil") return { ok: false, skal: `indexet: ${index.typ}`, svar: index };
  let indexXml: string;
  try {
    indexXml = kartText(index.data);
  } catch {
    return { ok: false, skal: "indexet gick inte att packa upp" };
  }
  const kartor = produktkartor(indexXml);
  if (kartor.length === 0) return { ok: false, skal: "indexet saknar produktkartor" };
  const rader: Kartrad[] = [];
  const sedda = new Set<string>();
  let ogiltiga = 0;
  for (const k of kartor) {
    if (!tillaten(k)) return { ok: false, skal: "robots.txt spärrar kartan" };
    const fil = await hamtaFil(k, opts);
    if (fil.typ !== "fil") return { ok: false, skal: `en produktkarta: ${fil.typ}`, svar: fil };
    let xml: string;
    try {
      xml = kartText(fil.data);
    } catch {
      return { ok: false, skal: "en produktkarta gick inte att packa upp" };
    }
    const r = kartrader(xml);
    ogiltiga += r.ogiltiga;
    for (const rad of r.rader) {
      if (sedda.has(rad.webbId)) continue;
      sedda.add(rad.webbId);
      rader.push(rad);
    }
  }
  if (rader.length < MIN_KARTRADER) return { ok: false, skal: `bara ${rader.length} produkter i kartan` };
  return { ok: true, rader, ogiltiga };
}
