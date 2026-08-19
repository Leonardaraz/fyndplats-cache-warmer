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
 * Skalar bort leverantörsmarknadsplatsens namn ur en råtitel.
 *
 * Råtiteln kommer från sidans `document.title`, som hos AliExpress alltid ser ut
 * som `<produktnamn> - AliExpress <säljar-id>`. I RÅ-läget
 * (`AI_ENRICHMENT_ENABLED=false`) blir råtiteln produktens namn i Wix rakt av —
 * alltså skulle butiken visa "…Rattan Garden Table 40X40X40 cm - AliExpress"
 * för kunden tills någon polerar den. Uppmätt 2026-08-19: 67 mappningar bär
 * suffixet i den sparade titeln. De är alla polerade i efterhand, men nästa
 * opolerade import hade nått kunden.
 *
 * Kapar från skiljetecknet och ut, så även det avhuggna "- AliExpre" försvinner
 * (70-teckensgränsen slog mitt i ordet). Körs FÖRE längdkapningen — då går de
 * tecknen till produktnamnet i stället för till leverantörens varumärke.
 *
 * En äkta produkttitel nämner aldrig marknadsplatsen, så mönstret kan inte
 * råka äta upp något vi vill ha kvar.
 */
// `ex` räcker som fäste i stället för hela `express`: de sparade titlarna är
// redan kapade på tecken 70 och slutar på allt från "- AliEx" till "- AliExpre".
// Två bokstäver mer än "ali" håller ändå namn som "Alice" och "Alexander"
// utanför — de skulle annars ätas upp av ett prefix-tolerant mönster.
const MARKETPLACE_SUFFIX = /\s*[-–—|]+\s*ali\s?(?:ex|baba).*$/i;
/** Hela titeln ÄR marknadsplatsen — misslyckad skrapning som gav document.title rakt av. */
const MARKETPLACE_ONLY = /^\s*ali\s?(?:ex\w*|baba\w*)[\s\d.]*$/i;

export function stripMarketplaceSuffix(rawTitle: string | null | undefined): string {
  const t = String(rawTitle ?? "").trim();
  // Tom sträng i stället för "AliExpress": då fångar isThinProductInput den och
  // importen faller tillbaka i stället för att döpa produkten till butiken vi
  // köper av. ("AliExpress" är exakt 10 tecken och slank annars igenom.)
  if (MARKETPLACE_ONLY.test(t)) return "";
  return t.replace(MARKETPLACE_SUFFIX, "").trim();
}

/**
 * True om produktdatan är för tunn för att generera meningsfull SEO. En äkta
 * AliExpress-titel är i praktiken alltid lång; en misslyckad skrapning ger en
 * tom eller trivial titel (t.ex. "AliExpress" från document.title).
 */
export function isThinProductInput(rawTitle: string | null | undefined): boolean {
  return (rawTitle ?? "").trim().length < 10;
}

/**
 * True om någon bild-URL pekar på fyndplats.se (= butikens egen logotyp/sida
 * smög in). Produktbilder ska alltid ligga på AliExpress-CDN (alicdn.com).
 */
export function hasFyndplatsImageUrl(urls: string[] | null | undefined): boolean {
  return (urls ?? []).some((u) => /fyndplats\.se/i.test(String(u)));
}

/**
 * True om minst en INKLUDERAD variant har ett pris > 0. En misslyckad skrapning
 * ger costUsd=0 på alla varianter → produkten kan inte prissättas korrekt.
 */
export function hasUsablePrice(
  variants: Array<{ costUsd?: number; included?: boolean }> | null | undefined,
): boolean {
  const list = variants ?? [];
  const included = list.filter((v) => v.included !== false);
  const pool = included.length > 0 ? included : list;
  return pool.some((v) => Number(v.costUsd) > 0);
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
