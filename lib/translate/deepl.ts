// DeepL Free-översättning. Används för att översätta AliExpress-recensioner
// (engelska/kinesiska) → svenska. GRATIS — Anthropic/Claude rörs INTE av detta.
//
// DeepL Free-tiern ger 500 000 tecken/månad. Budgetbevakningen sker i
// lib/translate/usage.ts (FyndplatsTranslationUsage) och i orchestreringen i
// lib/import/review-import.ts — den här modulen gör bara själva nätverksanropet.
//
// API: https://developers.deepl.com/docs/api-reference/translate
//   - Free endpoint: https://api-free.deepl.com/v2/translate
//   - Auth-header: "Authorization: DeepL-Auth-Key <key>"
//   - Body (JSON): { text: string[], target_lang: "SV" } — upp till 50 texter/anrop.
//   - Svar: { translations: [{ detected_source_language, text }] } i samma ordning.

const FREE_ENDPOINT = "https://api-free.deepl.com/v2/translate";
const PRO_ENDPOINT = "https://api.deepl.com/v2/translate";

/** DeepL tillåter max 50 text-parametrar per request. */
export const MAX_TEXTS_PER_REQUEST = 50;

export interface DeeplTranslation {
  text: string;
  detected_source_language?: string;
}

interface DeeplResponse {
  translations: DeeplTranslation[];
}

/** Summan av tecken över en lista texter — för budgetberäkning (DeepL-quota). */
export function countChars(texts: string[]): number {
  return texts.reduce((sum, t) => sum + (t ? t.length : 0), 0);
}

function endpointFor(apiKey: string): string {
  // DeepL signalerar Free-nycklar med suffixet ":fx". Välj endpoint därefter så
  // en Pro-nyckel också fungerar utan kodändring.
  return apiKey.trim().endsWith(":fx") ? FREE_ENDPOINT : PRO_ENDPOINT;
}

/**
 * Översätter en lista texter till `targetLang` (default svenska). Behåller
 * ordningen, chunkar automatiskt i block om <=50 texter och slår ihop svaren.
 * Tomma strängar skickas inte till DeepL (sparar quota) men behåller sin plats
 * i resultatet. Käll-språk autodetekteras (hanterar både EN och ZH).
 *
 * Kastar om DEEPL_API_KEY saknas eller om DeepL svarar med fel — callern
 * (review-import) fångar och faller tillbaka på originaltexten så att en
 * översättningsmiss aldrig fäller produktimporten.
 */
export async function translateBatchDetailed(
  texts: string[],
  targetLang = "SV",
  apiKey = process.env.DEEPL_API_KEY,
  fetchImpl: typeof fetch = fetch,
): Promise<DeeplTranslation[]> {
  if (!apiKey) {
    throw new Error("DEEPL_API_KEY saknas i miljön.");
  }
  if (texts.length === 0) return [];

  const endpoint = endpointFor(apiKey);
  const out: DeeplTranslation[] = new Array(texts.length);

  // Indexera de icke-tomma texterna så vi kan skippa tomma utan att tappa ordning.
  const nonEmpty: { idx: number; text: string }[] = [];
  texts.forEach((t, i) => {
    if (t && t.trim()) nonEmpty.push({ idx: i, text: t });
    else out[i] = { text: t ?? "" };
  });

  for (let start = 0; start < nonEmpty.length; start += MAX_TEXTS_PER_REQUEST) {
    const chunk = nonEmpty.slice(start, start + MAX_TEXTS_PER_REQUEST);
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: chunk.map((c) => c.text), target_lang: targetLang }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`DeepL ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as DeeplResponse;
    const translations = data.translations ?? [];
    chunk.forEach((c, i) => {
      out[c.idx] = {
        text: translations[i]?.text ?? c.text,
        detected_source_language: translations[i]?.detected_source_language,
      };
    });
  }

  return out;
}

/** Bekvämlighet: bara de översatta texterna (ordningsbevarande). */
export async function translateBatch(
  texts: string[],
  targetLang = "SV",
  apiKey = process.env.DEEPL_API_KEY,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const detailed = await translateBatchDetailed(texts, targetLang, apiKey, fetchImpl);
  return detailed.map((d) => d.text);
}
