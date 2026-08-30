// Svep som hämtar Aosoms produktrecensioner till katalogen.
//
// Samma form som resten av lib/aosom: torrkörning som default, deterministisk
// ordning, markör i svaret, väggklocksbudget under ruttens maxDuration.
//
// Vad som sparas VAR:
//   · texterna  → FyndplatsImportedReviews via importReviewsForProduct,
//                 `status: pending` och `source: "aosom"`. De blir svenska
//                 först när någon skriver om dem i /admin/reviews — exakt
//                 samma väg som AE-recensionerna sedan 2026-08-19.
//   · aggregatet → mappningen (`aosomRating`, `aosomReviewCount`). ☠️ Det får
//                 INTE räknas ur texterna: JSON-LD bär högst fem av ibland
//                 åttiotalet, och Aosoms urval lutar högt (uppmätt snitt 4,86).
//                 Sidan ska kunna säga "4,8 av 88", inte "5,0 av 5".
//
// Konvergens: varje produkt Aosom svarat på stämplas med `reviewsCheckedAt` —
// även när svaret var noll recensioner. Utan stämpeln hämtas de ~23 % som
// saknar betyg om vid varje körning i all evighet. Samma mekanik som
// review-backfill. Ett FEL stämplar aldrig (då hade en strypning dolt
// produkten i en månad).

import type { ProductMappingRecord } from "../store";
import { checkedRecently, REVIEW_RECHECK_DAYS } from "../reviews/backfill-deps";
import type { ReviewImportResult } from "../import/review-import";
import { BOT_BLOCKED, fetchAosomReviews, type AosomProductReviews } from "./reviews";

const DEFAULT_LIMIT = 40;
const DEFAULT_TIME_BUDGET_MS = 240_000;
/** Paus mellan sidhämtningar. Aosom är någon annans server. */
const DEFAULT_DELAY_MS = 1200;
/** Tre spärrade i rad räcker som bevis — spärren gäller klienten, inte varan. */
const BLOCKED_ABORT = 3;

export interface AosomReviewOptions {
  /** DEFAULT TRUE — en körning som skriver ska ha bett om det. */
  dryRun?: boolean;
  limit?: number;
  timeBudgetMs?: number;
  delayMs?: number;
  /** Fortsätt EFTER det här artikelnumret (markören ur föregående svar). */
  after?: string;
  /** Bara dessa artikelnummer. För enstaka omkörningar och rökprov. */
  onlySkus?: string[];
  /** Kolla om produkter som redan har `reviewsCheckedAt`. */
  ignoreCheckedAt?: boolean;
}

export interface AosomReviewSummary {
  dryRun: boolean;
  /** Aosom-mappningar med en källadress att hämta från. */
  candidates: number;
  /** Redan kontrollerade inom omkontrollfönstret. */
  alreadyChecked: number;
  attempted: number;
  /** Produkter där Aosom svarade med ett aggregerat betyg. */
  withRating: number;
  /** Produkter där minst en recensionstext fanns i JSON-LD. */
  withText: number;
  /** Recensionsrader som faktiskt skrevs (efter husets filter + dedup). */
  imported: number;
  /** Rader som redan fanns sedan tidigare körning. */
  skippedExisting: number;
  /**
   * Texter Aosom hade men som husets filter sållade bort — nästan alltid
   * 50-teckengolvet (REVIEW_FILTER.minLength). Tyska Aosom-recensioner är
   * ofta korta ("Toller Stuhl, immer wieder gerne!"), så siffran är värd att
   * följa: är den hög är det golvet som avgör skörden, inte Aosom.
   */
  filteredOut: number;
  failed: number;
  /**
   * Produkter där Akamai avvisade oss (403). ☠️ Egen räknare med flit: det är
   * inte ett fel bland andra utan en POLICYSPÄRR som gäller varenda produkt, och
   * en körning som rapporterar "40 fel" ser ut som otur medan "40 blockerade"
   * säger sanningen. Svepet stannar självt efter BLOCKED_ABORT i rad.
   */
  blocked: number;
  remaining: number;
  cursor: string | null;
  stoppedBy: "klart" | "limit" | "tidsbudget" | "blockerad";
  errors: { sku: string; error: string }[];
}

export interface AosomReviewDeps {
  listMappings: () => Promise<ProductMappingRecord[]>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  fetchReviews?: (sourceUrl: string) => Promise<AosomProductReviews & { error?: string }>;
  importReviews: (
    productId: string,
    reviews: Parameters<typeof import("../import/review-import").importReviewsForProduct>[1],
  ) => Promise<ReviewImportResult>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

// Omkontrollfönstret ÄR AE-kedjans, importerat och inte klonat: en tvilling här
// hade glidit isär från review-backfill vid första justeringen — samma lärdom
// som SHIP_AXIS_RE och EU_TULL_CODES. REVIEW_RECHECK_DAYS re-exporteras så
// rutten kan dokumentera vad som gäller utan att känna till AE-modulen.
export { REVIEW_RECHECK_DAYS };

/**
 * Kör en tugga av recensionshämtningen.
 *
 * Ordningen är artikelnummer stigande och ska stå still — det är det som gör
 * `after`-markören meningsfull mellan körningar.
 */
export async function runAosomReviewImport(
  opts: AosomReviewOptions,
  deps: AosomReviewDeps,
): Promise<AosomReviewSummary> {
  const dryRun = opts.dryRun !== false;
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const delayMs = opts.delayMs ?? DEFAULT_DELAY_MS;
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const hämta = deps.fetchReviews ?? ((u: string) => fetchAosomReviews(u));
  const startMs = now();

  const alla = await deps.listMappings();
  const kandidater = alla
    .filter((m) => m.supplier === "aosom" && Boolean(m.sourceUrl) && Boolean(m.wixProductId))
    .sort((a, b) => (a.supplierProductId ?? "").localeCompare(b.supplierProductId ?? ""));

  const valda = opts.onlySkus?.length
    ? kandidater.filter((m) => opts.onlySkus!.includes(m.supplierProductId ?? ""))
    : kandidater;

  const efterMarkör = opts.after
    ? valda.filter((m) => (m.supplierProductId ?? "") > opts.after!)
    : valda;

  const s: AosomReviewSummary = {
    dryRun,
    candidates: valda.length,
    alreadyChecked: 0,
    attempted: 0,
    withRating: 0,
    withText: 0,
    imported: 0,
    skippedExisting: 0,
    filteredOut: 0,
    failed: 0,
    blocked: 0,
    remaining: 0,
    cursor: null,
    stoppedBy: "klart",
    errors: [],
  };

  let blockeradeIRad = 0;
  let sistaSku: string | null = null;
  let index = 0;
  for (const m of efterMarkör) {
    index++;
    const sku = m.supplierProductId ?? "";

    if (!opts.ignoreCheckedAt && checkedRecently(m.reviewsCheckedAt, now())) {
      s.alreadyChecked++;
      sistaSku = sku;
      continue;
    }
    if (s.attempted >= limit) {
      s.stoppedBy = "limit";
      break;
    }
    if (now() - startMs >= timeBudgetMs) {
      s.stoppedBy = "tidsbudget";
      break;
    }

    s.attempted++;
    const res = await hämta(m.sourceUrl!);
    if (delayMs > 0 && index < efterMarkör.length) await sleep(delayMs);

    if (res.error) {
      // ☠️ Stämpla ALDRIG vid fel. En strypt hämtning som stämplas göms i en
      // månad — samma regel som review-backfill.
      if (res.error === BOT_BLOCKED) {
        s.blocked++;
        blockeradeIRad++;
        if (s.errors.length < 3) s.errors.push({ sku, error: res.error });
        // Spärren gäller klienten, inte produkten. Har den slagit till tre
        // gånger i rad kommer den slå till på alla 4 445 — att fortsätta är
        // bara att bränna tidsbudgeten på ett svar vi redan känner.
        if (blockeradeIRad >= BLOCKED_ABORT) {
          s.stoppedBy = "blockerad";
          break;
        }
        sistaSku = sku;
        continue;
      }
      blockeradeIRad = 0;
      s.failed++;
      s.errors.push({ sku, error: res.error });
      sistaSku = sku;
      continue;
    }
    blockeradeIRad = 0;

    if (typeof res.rating === "number") s.withRating++;
    if (res.reviews.length > 0) s.withText++;

    if (!dryRun) {
      try {
        if (res.reviews.length > 0) {
          const r = await deps.importReviews(m.wixProductId, res.reviews);
          s.imported += r.imported;
          s.skippedExisting += r.skippedExisting;
          s.filteredOut += Math.max(
            0,
            res.reviews.length - r.imported - r.skippedExisting,
          );
        }
        await deps.saveMapping({
          ...m,
          aosomRating: res.rating,
          aosomReviewCount: res.reviewCount,
          reviewsCheckedAt: new Date(now()).toISOString(),
        });
      } catch (err) {
        s.failed++;
        s.errors.push({ sku, error: err instanceof Error ? err.message : String(err) });
        sistaSku = sku;
        continue;
      }
    } else if (res.reviews.length > 0) {
      // I torrläge går ingenting genom husets filter, så `filteredOut` går inte
      // att veta. Räkna texterna som "skulle försökas" i stället för att låtsas.
      s.imported += res.reviews.length;
    }

    sistaSku = sku;
  }

  const behandlade = efterMarkör.filter((m) => (m.supplierProductId ?? "") <= (sistaSku ?? "")).length;
  s.remaining = Math.max(0, efterMarkör.length - behandlade);
  s.cursor = s.remaining > 0 ? sistaSku : null;
  return s;
}
