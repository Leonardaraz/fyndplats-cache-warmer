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
