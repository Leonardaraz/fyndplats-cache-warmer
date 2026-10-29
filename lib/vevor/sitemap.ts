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
import { hamtaFil, type Hamtare, type Svar, type Takt } from "./hamtning";
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

/** Produktsidorna i en karta. Adresser på andra värdar och utan webb-id räknas, inte tas med. */
export function kartrader(xml: string): { rader: Kartrad[]; ogiltiga: number } {
  const rader: Kartrad[] = [];
  const sedda = new Set<string>();
  let ogiltiga = 0;
  for (const u of locVarden(xml)) {
    const sokvag = sokvagUr(u);
    const webbId = sokvag ? webbIdUr(sokvag) : null;
    if (!sokvag || !webbId) {
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

function text(data: Uint8Array, gz: boolean): string {
  return Buffer.from(gz ? gunzipSync(data) : data).toString("utf8");
}

/** Läser indexet och varje produktkarta, i takt. */
export async function lasKartan(opts: { takt: Takt; hamtare?: Hamtare }): Promise<Kartsvar> {
  const index = await hamtaFil(SITEMAP_INDEX, opts);
  if (index.typ !== "fil") return { ok: false, skal: `indexet: ${index.typ}`, svar: index };
  const kartor = produktkartor(text(index.data, false));
  if (kartor.length === 0) return { ok: false, skal: "indexet saknar produktkartor" };
  const rader: Kartrad[] = [];
  const sedda = new Set<string>();
  let ogiltiga = 0;
  for (const k of kartor) {
    const fil = await hamtaFil(k, opts);
    if (fil.typ !== "fil") return { ok: false, skal: `en produktkarta: ${fil.typ}`, svar: fil };
    let xml: string;
    try {
      xml = text(fil.data, true);
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
