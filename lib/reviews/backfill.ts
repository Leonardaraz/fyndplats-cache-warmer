// lib/reviews/backfill.ts
//
// Kör recensions-import över BEFINTLIGA produkter — de som importerades innan
// recensionshämtningen fanns, eller via bulk-vägen som aldrig rörde recensioner.
//
// All I/O injiceras så stoppbesluten går att testa utan nät. Det är hela
// poängen med modulen: den svåra delen är inte att hämta, utan att veta när man
// ska SLUTA.
//
// Två tak styr en körning, båda för att lambdan inte ska dödas mitt i en
// produkt: `limit` (antal produkter) och `timeBudgetMs` (vägg-klocka). Ett
// tredje tak fanns fram till 2026-08-19 — DeepL:s teckenbudget — och togs bort
// med DeepL. Kvar av det är fältet `chars` per produkt, som numera betyder
// något helt annat: hur mycket text som väntar på att skrivas om i chatten.
//
// Kandidatlistan är stabil och varje färdig produkt stämplas med
// reviewsCheckedAt, så en avbruten körning kostar bara den produkt som pågick —
// nästa körning tar vid där den slutade.

import { filterAndRankReviews, type AERReview } from "../import/review-import";

export interface ReviewBackfillCandidate {
  wixProductId: string;
  supplierProductId: string;
  title?: string;
}

export interface ReviewBackfillImportResult {
  imported: number;
  skippedExisting: number;
}

export interface ReviewBackfillDeps {
  listCandidates: () => Promise<ReviewBackfillCandidate[]>;
  /** Antal redan lagrade recensioner för produkten (0 = orörd). */
  countExisting: (wixProductId: string) => Promise<number>;
  fetchReviews: (supplierProductId: string) => Promise<{ reviews: AERReview[]; throttled: boolean }>;
  importReviews: (wixProductId: string, reviews: AERReview[]) => Promise<ReviewBackfillImportResult>;
  /**
   * Stämplar produkten som genomsökt. Anropas ENBART i skarpt läge och ENBART
   * när AE faktiskt svarade — en strypt hämtning får inte se ut som ett svar,
   * då skulle produkten hoppas över i en månad på grund av rate-limiting.
   * Utan stämpeln hämtar en schemalagd körning om samma recensionslösa
   * produkter för alltid.
   */
  markChecked?: (wixProductId: string, atIso: string) => Promise<void>;
  now?: () => Date;
}

export interface ReviewBackfillOptions {
  /** Max antal produkter denna körning (håller anropet inom maxDuration). */
  limit?: number;
  /** Max recensioner per produkt. Lägre tak = fler produkter per månadsbudget. */
  maxPerProduct?: number;
  /** true = hämta och räkna, skriv INGET. Default true — publicering ska väljas. */
  dryRun?: boolean;
  /** Ta även produkter som redan har recensioner (t.ex. för att fylla på). */
  includeExisting?: boolean;
  /**
   * Vägg-klocka-budget (ms). Loopen stannar innan Vercels maxDuration nås, så
   * lambdan inte dödas mitt i en produkt-skrivning. Default
   * DEFAULT_REVIEW_TIME_BUDGET_MS.
   */
  timeBudgetMs?: number;
}

/**
 * Default-tidsbudget: rutten har maxDuration 300 s, och vi vill stanna med god
 * marginal så den sista produkten hinner skrivas klart.
 */
export const DEFAULT_REVIEW_TIME_BUDGET_MS = 240_000;

export interface ReviewBackfillProductResult {
  wixProductId: string;
  supplierProductId: string;
  title?: string;
  /** Råa recensioner AE gav oss. */
  fetched: number;
  /** Kvar efter filter/rankning — det som skulle sparas. */
  eligible: number;
  /** Antal tecken i recensionerna — mått på hur mycket som ska skrivas om. */
  chars: number;
  imported: number;
  skippedExisting: number;
  status: "imported" | "dry-run" | "inga-recensioner" | "har-redan" | "strypt" | "fel";
  note?: string;
}

export interface ReviewBackfillSummary {
  dryRun: boolean;
  /** Produkter vi tittade på. */
  considered: number;
  /** Produkter som fick (eller skulle få) minst en recension. */
  withReviews: number;
  reviewsImported: number;
  reviewsEligible: number;
  throttled: number;
  errors: number;
  /** Varför körningen slutade. */
  stoppedBy: "klar" | "gräns" | "tid";
  products: ReviewBackfillProductResult[];
}

export const DEFAULT_BACKFILL_LIMIT = 25;
export const DEFAULT_MAX_PER_PRODUCT = 8;


export async function runReviewBackfill(
  deps: ReviewBackfillDeps,
  opts: ReviewBackfillOptions = {},
): Promise<ReviewBackfillSummary> {
  const limit = Math.max(1, opts.limit ?? DEFAULT_BACKFILL_LIMIT);
  const maxPerProduct = Math.max(1, opts.maxPerProduct ?? DEFAULT_MAX_PER_PRODUCT);
  const dryRun = opts.dryRun !== false;
  const now = deps.now ?? (() => new Date());

  const products: ReviewBackfillProductResult[] = [];
  let considered = 0;
  let withReviews = 0;
  let reviewsImported = 0;
  let reviewsEligible = 0;
  let throttled = 0;
  let errors = 0;
  let stoppedBy: ReviewBackfillSummary["stoppedBy"] = "klar";

  // Ingen översättningsgrind längre. Den fanns för att en trasig DeepL-nyckel
  // annars publicerade engelska recensioner på hundratals svenska sidor — men
  // sedan DeepL togs bort (2026-08-19) sparas ALLA importerade recensioner som
  // `pending`, så ingenting kan nå produktsidan utan att en människa skrivit om
  // texten i /admin/reviews. Grinden är därför inte längre nödvändig; den
  // ersätts av att status aldrig är "approved".

  const startedAt = (deps.now?.() ?? new Date()).getTime();
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_REVIEW_TIME_BUDGET_MS;
  const candidates = await deps.listCandidates();

  for (const c of candidates) {
    if (considered >= limit) {
      stoppedBy = "gräns";
      break;
    }
    // TIDSBUDGET. Rutten har maxDuration 300 s, och sedan flerbildsstödet gör
    // varje recension upp till tre mediaimporter — var och en med retry och
    // 3-sekunderssömn vid 429. En körning kan därmed passera taket och dödas
    // MITT I en produkt (granskning 2026-08-19). Vi stannar hellre själva och
    // låter nästa körning ta vid: kandidatlistan är stabil och stämpeln
    // reviewsCheckedAt gör att inget görs om i onödan.
    if ((deps.now?.() ?? new Date()).getTime() - startedAt > timeBudgetMs) {
      stoppedBy = "tid";
      break;
    }
    considered++;

    if (!opts.includeExisting) {
      let existing = 0;
      try {
        existing = await deps.countExisting(c.wixProductId);
      } catch (err) {
        // Ett trasigt uppslag får inte se ut som "orörd" och ge dubbletter.
        errors++;
        products.push({ ...c, fetched: 0, eligible: 0, chars: 0, imported: 0, skippedExisting: 0, status: "fel", note: msg(err) });
        continue;
      }
      if (existing > 0) {
        products.push({ ...c, fetched: 0, eligible: 0, chars: 0, imported: 0, skippedExisting: existing, status: "har-redan" });
        continue;
      }
    }

    let fetched: AERReview[] = [];
    let wasThrottled = false;
    try {
      const r = await deps.fetchReviews(c.supplierProductId);
      fetched = r.reviews;
      wasThrottled = r.throttled;
    } catch (err) {
      errors++;
      products.push({ ...c, fetched: 0, eligible: 0, chars: 0, imported: 0, skippedExisting: 0, status: "fel", note: msg(err) });
      continue;
    }

    // Strypt ≠ tomt. En strypt produkt ska tas om nästa körning, inte skrivas
    // av som recensionslös.
    if (wasThrottled && fetched.length === 0) {
      throttled++;
      products.push({ ...c, fetched: 0, eligible: 0, chars: 0, imported: 0, skippedExisting: 0, status: "strypt" });
      continue;
    }
    if (wasThrottled) throttled++;

    // AE svarade → stämpla, oavsett om det fanns något. Det är just
    // "svarade men hade inget" som annars hämtas om i all evighet.
    if (!dryRun && deps.markChecked) {
      try {
        await deps.markChecked(c.wixProductId, now().toISOString());
      } catch {
        // Stämpeln är en optimering, inte en förutsättning — ett fel här får
        // inte hindra att recensionerna sparas.
      }
    }

    const eligible = filterAndRankReviews(fetched, now(), { max: maxPerProduct });
    const chars = eligible.reduce((s, r) => s + r.text.length, 0);
    if (eligible.length === 0) {
      products.push({ ...c, fetched: fetched.length, eligible: 0, chars: 0, imported: 0, skippedExisting: 0, status: "inga-recensioner" });
      continue;
    }

    withReviews++;
    reviewsEligible += eligible.length;

    if (dryRun) {
      products.push({ ...c, fetched: fetched.length, eligible: eligible.length, chars, imported: 0, skippedExisting: 0, status: "dry-run" });
      continue;
    }

    try {
      const res = await deps.importReviews(c.wixProductId, eligible);
      reviewsImported += res.imported;
      products.push({
        ...c,
        fetched: fetched.length,
        eligible: eligible.length,
        chars,
        imported: res.imported,
        skippedExisting: res.skippedExisting,
        status: "imported",
        note: "sparade som pending — översätts i chatten",
      });
    } catch (err) {
      errors++;
      products.push({ ...c, fetched: fetched.length, eligible: eligible.length, chars, imported: 0, skippedExisting: 0, status: "fel", note: msg(err) });
    }
  }

  return {
    dryRun,
    considered,
    withReviews,
    reviewsImported,
    reviewsEligible,
    throttled,
    errors,
    stoppedBy,
    products,
  };
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
