// Recensions-import: filtrerar/rankar råa AliExpress-recensioner, översätter de
// bästa till svenska via DeepL (GRATIS — ingen Anthropic-användning) och sparar
// dem i Wix Data-kollektionen FyndplatsImportedReviews.
//
// Designmål: håll DeepL Free-budgeten (500 000 tecken/månad). Vi tar bara topp
// 10–15 recensioner per produkt och budgetbevakar månadssumman före varje anrop
// (lib/translate/usage.ts). Når vi taket faller vi tillbaka på originaltexten
// (importen fortsätter) istället för att spränga quotan.
//
// All filtrering/rankning är rena, testbara funktioner. Själva I/O:t (DeepL +
// Wix) injiceras som beroenden så orchestreringen kan enhetstestas utan nätverk.

import { countChars, translateBatch } from "../translate/deepl";
import {
  getTranslationUsageStore,
  monthKey,
  monthlyBudget,
  type TranslationUsageStore,
} from "../translate/usage";
import { getReviewStore, type ReviewStore, type StoredReview } from "../store/reviews";
import { isEuCountry as isEuWarehouseCode } from "../aliexpress/eu-countries";

/** Rå recension som skrapan (extension/content.js) eller AE-API:t levererar. */
export interface AERReview {
  /** Unik AliExpress-review-id för dedup. Saknas → härleds ur text-hash. */
  reviewIdAE?: string;
  rating: number;
  text: string;
  /** Detekterat källspråk om känt (t.ex. "en", "zh") — påverkar inte flödet. */
  language?: string;
  hasImage?: boolean;
  imageUrl?: string;
  /** ISO-2-kod eller landnamn (engelska) — anonymiseras till svenskt namn. */
  customerCountry?: string;
  /** ISO-datum om känt. */
  date?: string;
}

export const REVIEW_FILTER = {
  minRating: 3,
  minLength: 50,
  maxLength: 300,
  /** Topp-N efter rankning (spec: 10–15). */
  maxReviews: 15,
};

// --- Pure filtering & ranking ---------------------------------------------

/** Normaliserad nyckel för dedup: gemener, kollapsad whitespace, ingen punkt. */
export function dedupKey(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Spam-/lågkvalitetsmönster: text som domineras av upprepade ord ("good good
 * very nice nice") eller består av ett enda upprepat ord. Korta generiska fraser
 * fångas redan av längdfiltret (>=50 tecken).
 */
export function isSpam(text: string): boolean {
  const words = dedupKey(text).split(" ").filter(Boolean);
  if (words.length < 4) return true;
  const unique = new Set(words);
  // Färre än hälften unika ord = upprepningsspam.
  if (unique.size / words.length < 0.5) return true;
  return false;
}

function isEuCountry(country?: string): boolean {
  if (!country) return false;
  return isEuWarehouseCode(country.trim());
}

function withinDays(dateIso: string | undefined, now: Date, days: number): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  if (Number.isNaN(t)) return false;
  const diffDays = (now.getTime() - t) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Rankningspoäng (högre = bättre). Vikter enligt spec:
 *   1. senaste 30 dagar (relevans)  +2
 *   2. med foto (trovärdigare)      +3
 *   3. från Europa (närmare mål)    +1
 *   4. längre text (mer substans)   +0..2 (längd/150, capad)
 */
export function scoreReview(r: AERReview, now: Date): number {
  let score = 0;
  if (r.hasImage) score += 3;
  if (withinDays(r.date, now, 30)) score += 2;
  if (isEuCountry(r.customerCountry)) score += 1;
  score += Math.min((r.text?.length ?? 0) / 150, 2);
  return score;
}

/**
 * Filtrerar bort recensioner under 3 stjärnor, för korta/långa, spam och
 * dubbletter; rankar resten och returnerar topp-N. Deterministisk (tiebreak på
 * datum desc, sedan reviewIdAE) så samma input alltid ger samma urval.
 */
export function filterAndRankReviews(
  reviews: AERReview[],
  now: Date,
  opts: { max?: number } = {},
): AERReview[] {
  const max = opts.max ?? REVIEW_FILTER.maxReviews;
  const seen = new Set<string>();
  const kept: AERReview[] = [];
  for (const r of reviews) {
    if (!r || typeof r.text !== "string") continue;
    const text = r.text.trim();
    if (r.rating < REVIEW_FILTER.minRating) continue;
    if (text.length < REVIEW_FILTER.minLength || text.length > REVIEW_FILTER.maxLength) continue;
    if (isSpam(text)) continue;
    const key = dedupKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push({ ...r, text });
  }
  kept.sort((a, b) => {
    const sb = scoreReview(b, now);
    const sa = scoreReview(a, now);
    if (sb !== sa) return sb - sa;
    const db = Date.parse(b.date ?? "") || 0;
    const da = Date.parse(a.date ?? "") || 0;
    if (db !== da) return db - da;
    return (a.reviewIdAE ?? "").localeCompare(b.reviewIdAE ?? "");
  });
  return kept.slice(0, max);
}

// --- Anonymisering ---------------------------------------------------------

/**
 * ISO-2/landnamn → svenskt landnamn. AE-recensioner ger ofta landkoder (DE, FR)
 * eller engelska namn. Okänt land → tom sträng (caller faller tillbaka på "Verifierad kund").
 */
const COUNTRY_SV: Record<string, string> = {
  SE: "Sverige", NO: "Norge", DK: "Danmark", FI: "Finland",
  DE: "Tyskland", FR: "Frankrike", ES: "Spanien", IT: "Italien",
  NL: "Nederländerna", BE: "Belgien", PL: "Polen", CZ: "Tjeckien",
  GB: "Storbritannien", UK: "Storbritannien", IE: "Irland", PT: "Portugal",
  AT: "Österrike", CH: "Schweiz", US: "USA", CA: "Kanada", AU: "Australien",
  GREECE: "Grekland", GR: "Grekland",
  GERMANY: "Tyskland", FRANCE: "Frankrike", SPAIN: "Spanien", ITALY: "Italien",
  POLAND: "Polen", NETHERLANDS: "Nederländerna", SWEDEN: "Sverige",
  PORTUGAL: "Portugal", BELGIUM: "Belgien", AUSTRIA: "Österrike",
};

export function swedishCountry(country?: string): string {
  if (!country) return "";
  const key = country.trim().toUpperCase();
  return COUNTRY_SV[key] ?? "";
}

/**
 * Anonymiserar kunden. AE-namn ("u****6543") får ALDRIG visas — vi visar
 * "Verifierad kund" eller "Verifierad kund från {land}". Etiskt val (se spec):
 * vi hittar INTE på svenska namn, vi markerar bara att det är en verifierad köpare.
 */
export function anonymizeCustomer(country?: string): string {
  const sv = swedishCountry(country);
  return sv ? `Verifierad kund från ${sv}` : "Verifierad kund";
}

/** Stabil reviewIdAE när skrapan inte gav någon (hash av normaliserad text). */
export function ensureReviewId(r: AERReview): string {
  if (r.reviewIdAE && r.reviewIdAE.trim()) return r.reviewIdAE.trim();
  const key = dedupKey(r.text);
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return `gen-${(h >>> 0).toString(36)}`;
}

// --- Orchestrering (translate + persist) -----------------------------------

export interface ReviewImportDeps {
  translate?: (texts: string[]) => Promise<string[]>;
  usageStore?: TranslationUsageStore;
  reviewStore?: ReviewStore;
  now?: Date;
  budgetChars?: number;
}

export interface ReviewImportResult {
  /** Antal recensioner som faktiskt sparades (efter dedup mot befintliga). */
  imported: number;
  /** Antal som hoppades över för att de redan fanns. */
  skippedExisting: number;
  /** DeepL-tecken som spenderades denna körning (0 om budget slut/fallback). */
  charsUsed: number;
  /** True om budgeten var slut → originaltext användes istället för svensk. */
  budgetExceeded: boolean;
  reviews: StoredReview[];
}

/**
 * Hela recensions-importen för EN produkt:
 *   filtrera/ranka → budgetkolla → DeepL-översätt → anonymisera → spara (dedup).
 *
 * Best-effort: alla fel (DeepL, Wix) ska fångas av callern; importen av själva
 * produkten får aldrig falla på recensioner. Budgetöverskridande → vi importerar
 * ändå med originaltexten som svensk text och loggar en varning.
 */
export async function importReviewsForProduct(
  productId: string,
  rawReviews: AERReview[],
  deps: ReviewImportDeps = {},
): Promise<ReviewImportResult> {
  const now = deps.now ?? new Date();
  const usageStore = deps.usageStore ?? getTranslationUsageStore();
  const reviewStore = deps.reviewStore ?? getReviewStore();
  const translate = deps.translate ?? ((texts: string[]) => translateBatch(texts));
  const budget = deps.budgetChars ?? monthlyBudget();

  const ranked = filterAndRankReviews(rawReviews ?? [], now);
  if (ranked.length === 0) {
    return { imported: 0, skippedExisting: 0, charsUsed: 0, budgetExceeded: false, reviews: [] };
  }

  const texts = ranked.map((r) => r.text);
  const needChars = countChars(texts);

  // Budgetkoll: använd inte DeepL om månadssumman + detta skulle överskrida taket.
  const month = monthKey(now);
  let usage = 0;
  try {
    usage = await usageStore.getMonthlyUsage(month);
  } catch (err) {
    console.warn("[review-import] kunde inte läsa DeepL-användning, antar 0:", err instanceof Error ? err.message : err);
  }
  const budgetExceeded = usage + needChars > budget;

  let swedish: string[];
  let charsUsed = 0;
  if (budgetExceeded) {
    console.warn(
      `[review-import] DeepL-budget skulle överskridas (${usage}+${needChars} > ${budget}). ` +
        `Importerar ${ranked.length} recensioner OTRANSLATERADE (originaltext).`,
    );
    swedish = texts;
  } else {
    try {
      swedish = await translate(texts);
      charsUsed = needChars;
      try {
        await usageStore.addUsage(month, needChars);
      } catch (err) {
        console.warn("[review-import] kunde inte spara DeepL-användning:", err instanceof Error ? err.message : err);
      }
    } catch (err) {
      console.warn(
        "[review-import] DeepL-översättning misslyckades, faller tillbaka på originaltext:",
        err instanceof Error ? err.message : err,
      );
      swedish = texts;
    }
  }

  const importedAt = now.toISOString();
  let imported = 0;
  let skippedExisting = 0;
  const reviews: StoredReview[] = [];
  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const reviewIdAE = ensureReviewId(r);
    try {
      if (await reviewStore.exists(productId, reviewIdAE)) {
        skippedExisting++;
        continue;
      }
    } catch (err) {
      console.warn("[review-import] exists-koll misslyckades, fortsätter:", err instanceof Error ? err.message : err);
    }
    const stored: StoredReview = {
      productId,
      reviewIdAE,
      rating: Math.max(1, Math.min(5, Math.round(r.rating))),
      textOriginal: r.text,
      textSwedish: swedish[i] ?? r.text,
      customerName: anonymizeCustomer(r.customerCountry),
      customerCountry: r.customerCountry,
      date: r.date,
      hasImage: Boolean(r.hasImage),
      imageUrl: r.imageUrl,
      hidden: false,
      importedAt,
    };
    try {
      await reviewStore.upsert(stored);
      imported++;
      reviews.push(stored);
    } catch (err) {
      console.warn("[review-import] kunde inte spara recension:", err instanceof Error ? err.message : err);
    }
  }

  return { imported, skippedExisting, charsUsed, budgetExceeded, reviews };
}
