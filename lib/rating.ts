// lib/rating.ts
//
// Formatering av betygssammandraget ("4,7 av 5 · 14 omdömen").
//
// Bakgrund (2026-08-17): sammandraget renderades bara längst ner i
// recensionssektionen, alltså EFTER köpknappen — sociala beviset kom för sent
// för att hjälpa köpbeslutet. Samma siffror visas nu även direkt under
// produktrubriken, och då behöver de två ställena räkna och skriva likadant.
//
// Här ligger också decimalkommat: `toFixed(1)` ger "4.7", vilket är fel på en
// svensk sida. Bara siffran formateras om — stjärnorna är oförändrade.

export interface RatingSummary {
  /** Snittet avrundat till närmaste heltal, för stjärnraden (0–5). */
  stars: number;
  /** Snittet med en decimal och svenskt komma, t.ex. "4,7". */
  value: string;
  /** "1 omdöme" / "14 omdömen". */
  label: string;
}

/** Snittet med en decimal och komma. Klampas till 0–5. */
export function formatAverage(average: number): string {
  const n = Math.max(0, Math.min(5, average));
  return n.toFixed(1).replace(".", ",");
}

/** Räkneordet böjt. Singularis saknar s-plural på "omdöme". */
export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? "omdöme" : "omdömen"}`;
}

/**
 * Sammandraget, eller null när det inte finns något att visa.
 *
 * `null` returneras även när snittet saknas trots att antalet är > 0 — hellre
 * inget betyg än ett påhittat. (Den gamla koden föll tillbaka på 5 stjärnor
 * vid `average == null`, vilket hade visat toppbetyg utan täckning.)
 */
export function ratingSummary(count: number, average: number | null): RatingSummary | null {
  if (count <= 0 || average == null || !Number.isFinite(average)) return null;
  const clamped = Math.max(0, Math.min(5, average));
  return {
    stars: Math.round(clamped),
    value: formatAverage(clamped),
    label: reviewCountLabel(count),
  };
}

// --- Betyg per produkt för listningskorten ---------------------------------
//
// Ligger HÄR och inte i review-aggregates.ts av en praktisk anledning: testerna
// körs med `node --test --experimental-strip-types`, vars ESM-laddare kräver
// explicita filändelser i importer. Produktionskoden skriver dem utan (annars
// bråkar tsc/bygget), så bara löv-moduler utan körtidsimporter går att ladda i
// test — samma skäl som related-pick.ts. Genom att lägga den rena logiken
// bredvid formateringen den ändå använder blir den testbar utan att någon
// importstil behöver ändras. Nätanropet ligger kvar i review-aggregates.ts.

import type { Product } from "./products";

/**
 * Vad produktkortet behöver. `count` är ett tal (inte "14 omdömen") eftersom
 * kortet har ont om plats och skriver "(14)" — men stjärnorna och decimal-
 * kommat kommer från ratingSummary() ovan, så kort och produktsida kan aldrig
 * visa olika siffror för samma produkt.
 */
export interface CardRating {
  stars: number;
  value: string;
  count: number;
}

export type RatingMap = Record<string, CardRating>;

/** En rad ur Wix-aggregeringen (grupperad på productId). */
export interface AggregateRow {
  productId?: string;
  antal?: number;
  snitt?: number;
}

/**
 * Aggregeringsrader → karta. Rader utan produkt-id, utan omdömen eller utan
 * användbart snitt hoppas över: hellre inget betyg på kortet än ett påhittat.
 */
export function mapAggregateRows(rows: AggregateRow[]): RatingMap {
  const ut: RatingMap = {};
  for (const rad of rows) {
    const id = String(rad?.productId || "");
    if (!id) continue;
    const count = Number(rad?.antal) || 0;
    const average = typeof rad?.snitt === "number" ? rad.snitt : null;
    const sammandrag = ratingSummary(count, average);
    if (!sammandrag) continue;
    ut[id] = { stars: sammandrag.stars, value: sammandrag.value, count };
  }
  return ut;
}

/**
 * Med Trustpilot påslaget renderar produktsidan INTE våra egna omdömen
 * (app/produkt/[slug]/page.tsx skickar count=0). Korten måste följa samma
 * regel, annars lovar listningen ett betyg som produktsidan inte visar.
 */
export function ownReviewsHidden(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean((env.TRUSTPILOT_BUSINESS_UNIT_ID || "").trim());
}

/** Hänger på betyget. Produkter utan betyg returneras oförändrade (samma referens). */
export function applyRatings<T extends Product>(products: T[], map: RatingMap): T[] {
  return products.map((p) => (map[p.id] ? { ...p, rating: map[p.id] } : p));
}
