// Aosoms produktmanual för en av våra sidor — rena funktioner, ingen IO.
//
// VARFÖR (Leonard 2026-09-30). Fyra publicerade torktumlare saknar
// energimärkning på sidan: "kolla produkt pdf om du kan hitta där". Feeden har
// ingen energikolumn, men kolumnen `pdf` bär manualen på 97 % av raderna
// (feed-info, 2026-09-15), och en torktumlares manual kan bära etiketten,
// produktbladet eller EPREL-numret.
//
// ☠️ MANUALENS ADRESS BÄR ARTIKELNUMRET. Den lämnar därför aldrig servern i
// ett svar som kan nå en publik logg. Rutten ger den bara till en anropare
// med CRON_SECRET, och workflowen maskerar den innan den skriver något.
//
// ☠️ GÅR INTE VIA `parseAosomFeed`. `AosomRow` har inget pdf-fält, precis
// samma blinda fläck som ean-jakt.ts beskriver. Rubrikraden läses här, med
// samma tokenizer som feeden (`parseCsvRecords`), eftersom feedens
// beskrivningar bär radbrytningar inuti citerade fält. En radvis delning
// hade tappat rader.

import { parseCsvRecords } from "../bulk-import/csv";
import { aosomArtikelbild } from "./artiklar";
import type { ProductMappingRecord } from "../store";

/** Sidans Aosom-artiklar, en per variant på en sammanslagen sida, i variantordning. */
export function artiklarPaSidan(m: Pick<ProductMappingRecord, "supplierProductId" | "variants">): string[] {
  const bild = aosomArtikelbild(m);
  const lista = bild.typ === "flera" ? bild.varianter.map((v) => v.artikel) : [bild.artikel];
  return [...new Set(lista.map((a) => a.trim()).filter(Boolean))];
}

/**
 * Manualadressen per artikel, ur feedens kolumner `SKU` och `pdf`. Bara
 * artiklar med en http-adress kommer med. Saknas en kolumn blir svaret tomt.
 */
export function manualLankar(csv: string, artiklar: readonly string[]): Map<string, string> {
  const ut = new Map<string, string>();
  const sokta = new Set(artiklar);
  if (sokta.size === 0) return ut;
  const text = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rader = parseCsvRecords(text, ",");
  if (rader.length < 2) return ut;
  const rubriker = rader[0].map((h) => h.trim().toLowerCase());
  const iSku = rubriker.indexOf("sku");
  const iPdf = rubriker.indexOf("pdf");
  if (iSku < 0 || iPdf < 0) return ut;
  for (let i = 1; i < rader.length; i++) {
    const sku = (rader[i][iSku] ?? "").trim();
    if (!sokta.has(sku) || ut.has(sku)) continue;
    const lank = (rader[i][iPdf] ?? "").trim();
    if (/^https?:\/\//i.test(lank)) ut.set(sku, lank);
  }
  return ut;
}

/** Manualerna i variantordning, utan dubbletter — färgerna delar ofta en manual. */
export function unikaManualer(artiklar: readonly string[], lankar: ReadonlyMap<string, string>): string[] {
  const ut: string[] = [];
  for (const a of artiklar) {
    const l = lankar.get(a);
    if (l && !ut.includes(l)) ut.push(l);
  }
  return ut;
}
