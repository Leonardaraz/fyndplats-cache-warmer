// IndexNow: pingar sökmotorer (Bing, Yandex m.fl. via api.indexnow.org) direkt
// när en produkt PUBLICERAS eller ändras, så nya sidor crawlas på minuter i
// stället för dagar. Ren uppsida — protokollet kan bara BE om en crawl; det kan
// aldrig avindexera eller sänka en ranking.
//
// Best-effort by design: varje fel sväljs (loggas), funktionen kastar ALDRIG,
// så en IndexNow-miss aldrig kan fälla en import eller en publicering. No-op om
// INDEXNOW_KEY saknas eller INDEXNOW_ENABLED === "false".
//
// Krav (en gång): nyckelfilen `${INDEXNOW_KEY}.txt` (innehåll = själva nyckeln)
// måste ligga på storefront-roten, dvs `https://www.fyndplats.se/<key>.txt`.

import { productUrl, DEFAULT_URL_CONFIG } from "./urls";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10000; // IndexNow-protokollets tak per anrop.

function host(): string {
  return new URL(DEFAULT_URL_CONFIG.baseUrl).host; // t.ex. www.fyndplats.se
}

/** True om IndexNow är konfigurerat (nyckel finns och inte avstängt via env). */
export function indexNowConfigured(): boolean {
  if (process.env.INDEXNOW_ENABLED === "false") return false;
  return Boolean(process.env.INDEXNOW_KEY);
}

export interface IndexNowResult {
  ok: boolean;
  submitted: number;
  status?: number;
  skipped?: "not-configured" | "no-urls";
  error?: string;
}

/**
 * Skickar en lista absoluta URL:er till IndexNow. **Kastar aldrig.**
 * Deduplicerar, hoppar över tomma, och batchar i grupper om MAX_URLS_PER_REQUEST.
 */
export async function submitUrls(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!indexNowConfigured() || !key) {
    return { ok: true, submitted: 0, skipped: "not-configured" };
  }
  const list = [...new Set(urls.filter(Boolean))];
  if (list.length === 0) return { ok: true, submitted: 0, skipped: "no-urls" };

  let lastStatus: number | undefined;
  try {
    // Inuti try: en felkonfigurerad SEO_BASE_URL får aldrig kasta (new URL).
    const h = host();
    const keyLocation = `https://${h}/${key}.txt`;
    for (let i = 0; i < list.length; i += MAX_URLS_PER_REQUEST) {
      const urlList = list.slice(i, i + MAX_URLS_PER_REQUEST);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: h, key, keyLocation, urlList }),
      });
      lastStatus = res.status;
      // IndexNow svarar 200/202 vid accept. Vi loggar avvikelser men kastar aldrig.
      if (!res.ok) {
        console.warn(`[indexnow] ${res.status} för ${urlList.length} URL:er (host=${h})`);
      }
    }
    return { ok: true, submitted: list.length, status: lastStatus };
  } catch (err) {
    console.warn(
      "[indexnow] submit failade (icke-fatalt):",
      err instanceof Error ? err.message : err,
    );
    return {
      ok: false,
      submitted: 0,
      status: lastStatus,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Bekvämlighet: pinga produktsidor från slugs (bygger URL:erna). Kastar aldrig. */
export async function pingProductSlugs(slugs: string[]): Promise<IndexNowResult> {
  return submitUrls(slugs.filter(Boolean).map((s) => productUrl(s)));
}
