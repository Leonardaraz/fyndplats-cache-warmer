// Skydd mot kontaminerad import-data.
//
// Bakgrund (bug 2026-05-31): när AliExpress-skrapningen misslyckades skickades
// en tom/tunn produkt in i pipelinen. generateSeo bad då LLM:en om "säljande
// svenskt innehåll" UTAN någon produktdata att utgå från — och modellen
// genererade istället butiks-/startsidescopy om Fyndplats självt
// ("Fyndplats – Bästa Deals & Fynd Online", "Välkommen till Fyndplats …").
// Detta cachades och spelades upp för alla efterföljande tunna importer.
//
// Dessa helpers används både i API-gränssnittet (avvisa kontaminerad payload)
// och i seo.ts (avvisa LLM-output som ser ut som butikscopy → fail-open).

import { parseAliExpressUrl } from "../bulk-import/url";

/**
 * Mönster som avslöjar Fyndplats butiks-/startsidescopy. En riktig
 * produkttitel/-beskrivning från AliExpress beskriver PRODUKTEN och nämner
 * aldrig butiksnamnet "Fyndplats" eller startsidans slogans.
 */
const STORE_COPY_MARKERS: RegExp[] = [
  /\bfyndplats\b/i, // butikens eget namn — produktcopy nämner det aldrig
  /välkommen till/i,
  /bästa\s+deals/i,
  /bästa\s+fynd/i,
  /din destination för/i,
  /de bästa fynden/i,
  /fynd online/i,
];

/**
 * True om texten ser ut som Fyndplats butiks-/startsidescopy snarare än
 * produktspecifikt innehåll. Tom sträng räknas inte som butikscopy (det är
 * "tunt", hanteras separat).
 */
export function looksLikeStoreCopy(text: string | null | undefined): boolean {
  if (!text) return false;
  return STORE_COPY_MARKERS.some((re) => re.test(text));
}

/**
 * True om produktdatan är för tunn för att generera meningsfull SEO. En äkta
 * AliExpress-titel är i praktiken alltid lång; en misslyckad skrapning ger en
 * tom eller trivial titel (t.ex. "AliExpress" från document.title).
 */
export function isThinProductInput(rawTitle: string | null | undefined): boolean {
  return (rawTitle ?? "").trim().length < 10;
}

export interface SourceUrlCheck {
  ok: boolean;
  reason?: string;
}

/** Validerar att källan faktiskt är en AliExpress-produkt-URL. */
export function isAliExpressSourceUrl(url: string | null | undefined): SourceUrlCheck {
  if (!url) return { ok: false, reason: "sourceUrl saknas" };
  const parsed = parseAliExpressUrl(url);
  if (!parsed.productId) {
    return { ok: false, reason: parsed.error ?? "sourceUrl är inte en giltig AliExpress-produkt-URL" };
  }
  return { ok: true };
}
