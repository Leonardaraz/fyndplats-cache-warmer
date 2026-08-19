// lib/aliexpress/reviews.ts
//
// Hämtar produktrecensioner från AliExpress SERVER-SIDE.
//
// Bakgrund (Leonards fråga 2026-08-16): "många av produkterna har ju
// recensioner i AliExpress, kommer dom inte?" — nej. Recensionskedjan
// (filtrering → DeepL → FyndplatsImportedReviews → PDP) har funnits sedan
// 2026-07-08 men har ALDRIG matats: kollektionen innehåller 0 rader.
//
// Orsaken är att den enda inmatningsvägen var webbläsartilläggets DOM-skrapa
// (extension/content.js → scrapeReviews), och den har två hål:
//   1. AE lazy-laddar recensionssektionen — klickar man importera högst upp på
//      sidan har den oftast inte renderats, och skrapan returnerar [].
//   2. Bulk-/CSV-importen (lib/bulk-import/worker.ts) kör helt utan webbläsare
//      och rör aldrig recensioner. Katalogens senaste ~800 produkter kom in
//      den vägen.
//
// Den här modulen ersätter DOM-skrapan med AliExpress egna feedback-endpoint,
// som svarar med ren JSON och kan köras för hela katalogen utan tillägg.
//
// Mätning 2026-08-16 (20 äldre produkter): 17 har recensioner, 16 har text
// över 50 tecken, 278 textrecensioner totalt. De nyaste Aosom-EU-listningarna
// har oftast 0 — de är nya listningar, inte ett fel i hämtningen.

import type { AERReview } from "../import/review-import";

export const AE_FEEDBACK_ENDPOINT = "https://feedback.aliexpress.com/pc/searchEvaluation.do";

/** Sidstorlek per anrop (AE:s eget tak för endpointen). */
export const AE_REVIEW_PAGE_SIZE = 20;
/** Hur många sidor vi hämtar per produkt som standard. */
export const AE_REVIEW_DEFAULT_PAGES = 2;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Fälten vi läser ur AE:s `evaViewList`. Övriga fält ignoreras medvetet. */
export interface AeRawReview {
  evaluationIdStr?: string;
  evaluationId?: number | string;
  /** Recensionstext på ORIGINALSPRÅK — det är den vi lagrar som bevis. */
  buyerFeedback?: string;
  /** AE:s egen (crowdsourcade) engelska översättning. Reserv. */
  buyerTranslationFeedback?: string;
  buyerFbType?: { sourceLang?: string };
  /** 0–100. 100 = 5 stjärnor. */
  buyerEval?: number;
  buyerName?: string;
  buyerCountry?: string;
  anonymous?: boolean;
  /** AE:s EGEN markering av AI-genererat innehåll. */
  aigc?: boolean;
  /** "1" = publicerad. */
  status?: string;
  /** "04 Dec 2025" */
  evalDate?: string;
  images?: string[];
  thumbnails?: string[];
}

export interface AeReviewFetchResult {
  reviews: AERReview[];
  /** AE:s totalsiffra för produkten (alla recensioner, även utan text). */
  totalNum: number;
  /** true om AE strypte oss (503/429) — SKILJS från "inga recensioner". */
  throttled: boolean;
  /** Antal HTTP-anrop som gjordes. */
  requests: number;
}

/**
 * Namn vi vägrar härleda initialer ur. AE sätter dem på anonyma recensioner,
 * och de är inte namn — utan spärren blir varenda anonym recension "A.S." och
 * produktsidan ser förfalskad ut. Faller igenom till reviewId-hashen i stället.
 */
const PLACEHOLDER_NAMES = new Set(["aliexpress shopper", "aliexpress user", "anonymous", "a***s"]);

/**
 * "04 Dec 2025" → ISO. AE skickar alltid engelsk månadsförkortning här,
 * oavsett `lang`-parametern.
 */
export function parseAeDate(raw: string | undefined): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
}

/**
 * Översätter EN rå AE-recension till vår interna form.
 * Returnerar null när recensionen inte får publiceras.
 *
 * Bortsorteringen sker HÄR (inte i filtret) eftersom den handlar om äkthet,
 * inte kvalitet:
 *   - `aigc` = AliExpress egen markering av AI-genererat innehåll. Att visa
 *     sådan text som ett kundomdöme vore att påstå att en människa skrivit
 *     den. Samma princip som att vi aldrig strippar C2PA-metadata ur bilder.
 *   - `status !== "1"` = inte publicerad hos AE (borttagen/under granskning).
 */
export function mapAeReview(raw: AeRawReview): AERReview | null {
  if (!raw || typeof raw !== "object") return null;
  if (raw.aigc === true) return null;
  if (raw.status !== undefined && raw.status !== "1") return null;

  // Originaltexten först — DeepL översätter bättre från källspråket än från
  // AE:s crowdsourcade engelska mellanled.
  const text = (raw.buyerFeedback || raw.buyerTranslationFeedback || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return null;

  const evalPct = typeof raw.buyerEval === "number" ? raw.buyerEval : NaN;
  const rating = Number.isFinite(evalPct) ? Math.max(1, Math.min(5, Math.round(evalPct / 20))) : 5;

  const rawName = (raw.buyerName ?? "").trim();
  const anonymous = raw.anonymous === true || PLACEHOLDER_NAMES.has(rawName.toLowerCase());
  const images = Array.isArray(raw.images) ? raw.images.filter((u) => typeof u === "string" && u) : [];

  const id = raw.evaluationIdStr ?? (raw.evaluationId != null ? String(raw.evaluationId) : undefined);

  return {
    reviewIdAE: id,
    rating,
    text,
    language: raw.buyerFbType?.sourceLang || undefined,
    hasImage: images.length > 0,
    imageUrl: images[0],
    // ALLA bilderna, inte bara den första. AliExpress-recensenter postar ofta
    // flera foton, och fram till 2026-08-19 behöll importen `images[0]` och
    // slängde resten — bilder vi redan fått betalt för i form av API-anrop och
    // som gör recensionen mer trovärdig. Taket sätts när raden skrivs
    // (reviewImageFields), inte här; här bevaras vad leverantören gav.
    imageUrls: images,
    // Anonyma får INGET namn vidare — initialerna hashas ur reviewId i stället.
    customerName: anonymous ? undefined : rawName || undefined,
    customerCountry: (raw.buyerCountry ?? "").trim() || undefined,
    date: parseAeDate(raw.evalDate),
  };
}

/** Plockar ut recensionerna ur ett svar och kastar det som inte får publiceras. */
export function mapAeResponse(body: unknown): { reviews: AERReview[]; totalNum: number; hasNext: boolean } {
  const data = (body as { data?: Record<string, unknown> })?.data;
  if (!data || typeof data !== "object") return { reviews: [], totalNum: 0, hasNext: false };
  const list = Array.isArray(data.evaViewList) ? (data.evaViewList as AeRawReview[]) : [];
  const totalNum = typeof data.totalNum === "number" ? data.totalNum : 0;
  const currentPage = typeof data.currentPage === "number" ? data.currentPage : 1;
  const totalPage = typeof data.totalPage === "number" ? data.totalPage : 1;
  const reviews: AERReview[] = [];
  for (const raw of list) {
    const mapped = mapAeReview(raw);
    if (mapped) reviews.push(mapped);
  }
  return { reviews, totalNum, hasNext: currentPage < totalPage };
}

export function aeReviewUrl(productId: string, page: number): string {
  const q = new URLSearchParams({
    productId,
    page: String(page),
    pageSize: String(AE_REVIEW_PAGE_SIZE),
    filter: "all",
    lang: "en_US",
    country: "SE",
  });
  return `${AE_FEEDBACK_ENDPOINT}?${q.toString()}`;
}

export interface AeReviewFetchOptions {
  /** Antal sidor (à 20). Default 2 — filtret behåller ändå bara topp 15. */
  pages?: number;
  /** Injicerbar fetch för tester. */
  fetchImpl?: typeof fetch;
  /** Paus mellan anrop (rate-limit). Default 400 ms. */
  delayMs?: number;
  /** Antal omförsök vid 503/429. Default 3. */
  retries?: number;
  /** Injicerbar sleep för tester. */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Hämtar recensioner för EN AliExpress-produkt.
 *
 * Kastar aldrig — nätfel och strypning rapporteras via `throttled` och tom
 * lista, så en backfill över hundratals produkter inte faller på en enda
 * produkt. Skillnaden mellan "strypt" och "inga recensioner" är viktig: den
 * första ska försökas igen, den andra inte.
 */
export async function fetchAeReviews(
  productId: string,
  opts: AeReviewFetchOptions = {},
): Promise<AeReviewFetchResult> {
  const pages = Math.max(1, opts.pages ?? AE_REVIEW_DEFAULT_PAGES);
  const doFetch = opts.fetchImpl ?? fetch;
  const delayMs = opts.delayMs ?? 400;
  const retries = opts.retries ?? 3;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  const out: AERReview[] = [];
  const seenIds = new Set<string>();
  let totalNum = 0;
  let throttled = false;
  let requests = 0;

  for (let page = 1; page <= pages; page++) {
    if (page > 1 && delayMs > 0) await sleep(delayMs);

    let body: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        requests++;
        const res = await doFetch(aeReviewUrl(productId, page), {
          headers: { "User-Agent": UA, Referer: "https://www.aliexpress.com/", Accept: "application/json" },
          signal: AbortSignal.timeout(25000),
        });
        if (res.ok) {
          body = await res.json();
          break;
        }
        // 503/429 = strypning, inte tomt resultat. Backa av och försök igen.
        if (res.status === 503 || res.status === 429) {
          if (attempt === retries) throttled = true;
          else await sleep(1500 * 2 ** attempt);
          continue;
        }
        break; // 4xx/5xx i övrigt: produkten går inte att hämta, gå vidare.
      } catch {
        if (attempt === retries) throttled = true;
        else await sleep(1000 * 2 ** attempt);
      }
    }
    if (!body) break;

    const { reviews, totalNum: t, hasNext } = mapAeResponse(body);
    if (t > totalNum) totalNum = t;
    for (const r of reviews) {
      const key = r.reviewIdAE ?? r.text.slice(0, 80);
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      out.push(r);
    }
    if (!hasNext) break;
  }

  return { reviews: out, totalNum, throttled, requests };
}
