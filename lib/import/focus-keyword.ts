// Deterministisk härledning av Wix "fokusord" (focus keyword) ur en produkttitel.
// INGA AI-anrop — ren strängbearbetning, $0. Fokusordet lagras i Wix V3 under
// seoData.settings.keywords[{ term, isMain:true, origin:"USER" }]; posten med
// isMain:true är den som Wix-adminens SEO-panel visar som "Fokusord".

/** Svenska kopplingsord vi inte vill börja/sluta ett fokusord på. */
const STOP_WORDS = new Set([
  "med", "för", "och", "i", "till", "på", "av", "den", "det", "en", "ett",
  "de", "som", "x", "st", "mart", "eller",
]);

/**
 * Sant om token är ett rent mått-/antalsvärde (t.ex. "360°", "2000lm", "6",
 * "144") som vi trimmar bort i SLUTET (spec-brus). Tokens med internt
 * bindestreck ("8-i-1", "4-pack", "16-tum") matchar INTE → bevaras, eftersom de
 * oftast är en del av produktnamnet.
 */
function isTrailingSpecNumber(token: string): boolean {
  return /^[0-9]+([.,][0-9]+)?(°|%|[a-zåäö]{1,4})?$/.test(token) && !token.includes("-");
}

/**
 * Härleder ett fokusord ur produktnamnet:
 *  1. Klipp vid första streck-separatorn (–/—/-) som är OMGIVEN av mellanslag.
 *     Interna bindestreck i ord (T-shirt, LED-skärm, 8-i-1) bevaras.
 *  2. Gemener, trimma kantskräp per token, släng rena symboltokens (&, /, +).
 *  3. Ta de första 4 orden.
 *  4. Trimma efterföljande stoppord OCH spec-nummer; trimma ledande stoppord.
 *     Ledande nummer ("3D", "550 ml", "12-pack") behålls — de hör till identiteten.
 *
 * Exempel:
 *   "Sverige Fotboll T-shirt Herr – 3D-tryckt Sommarplagg" → "sverige fotboll t-shirt herr"
 *   "Automatisk Tvåldispenser – Touchless Sensor, …"       → "automatisk tvåldispenser"
 *   "Taktisk LED-ficklampa 2000LM – USB-laddbar …"          → "taktisk led-ficklampa"
 */
export function deriveFocusKeyword(productName: string): string {
  const mainPart = String(productName || "")
    .replace(/[­​﻿]/g, "") // mjukt bindestreck/zero-width (osynliga) → bort
    .split(/\s+[–—-]\s+/)[0]
    .trim();

  const tokens = mainPart
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/^[^0-9a-zåäöéü]+|[^0-9a-zåäöéü%°]+$/g, ""))
    .filter((t) => t.length > 0 && !/^[&/+.,]+$/.test(t));

  const out = tokens.slice(0, 4);
  while (
    out.length > 1
    && (STOP_WORDS.has(out[out.length - 1]) || isTrailingSpecNumber(out[out.length - 1]))
  ) {
    out.pop();
  }
  while (out.length > 1 && STOP_WORDS.has(out[0])) out.shift();

  return out.join(" ");
}

/**
 * Bygger Wix seoData.settings.keywords-arrayen för ett fokusord. Tom array om
 * inget meningsfullt ord kunde härledas (call-site hoppar då över att sätta det).
 */
export function buildFocusKeywordEntries(
  productName: string,
): Array<{ term: string; isMain: boolean; origin: string }> {
  const term = deriveFocusKeyword(productName);
  if (!term) return [];
  return [{ term, isMain: true, origin: "USER" }];
}
