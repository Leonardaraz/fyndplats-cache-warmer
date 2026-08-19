// lib/reviews/backfill.ts
//
// Kör recensions-import över BEFINTLIGA produkter — de som importerades innan
// recensionshämtningen fanns, eller via bulk-vägen som aldrig rörde recensioner.
//
// All I/O injiceras så budgetbeslutet går att testa utan nät. Det är hela
// poängen med modulen: den svåra delen är inte att hämta, utan att veta när man
// ska SLUTA.
//
// DeepL-matematiken (mätt på 20 produkter 2026-08-16, efter det riktiga
// filtret): ~1 025 tecken per produkt vid tak 15, ~518 vid tak 5. Hela
// katalogen (876 mappningar) skulle alltså kosta ~898k respektive ~453k tecken
// mot en Free-kvot på 500 000/månad. Backfillen måste därför kunna stanna mitt
// i och fortsätta nästa körning.
//
// Viktigt om felläget: review-importen faller vid budgetslut tillbaka på
// ORIGINALTEXTEN, dvs. engelska recensioner på en svensk sida. För en backfill
// är det fel utfall — bättre att stanna och ta resten senare. Därför kollar vi
// budgeten FÖRE varje produkt i stället för att låta importens skyddsnät lösa ut.

import { filterAndRankReviews, type AERReview } from "../import/review-import";

export interface ReviewBackfillCandidate {
  wixProductId: string;
  supplierProductId: string;
  title?: string;
}

export interface ReviewBackfillImportResult {
  imported: number;
  skippedExisting: number;
  charsUsed: number;
  budgetExceeded: boolean;
  /** Översättningen fallerade → originaltexten sparades (engelsk text). */
  translationFailed?: boolean;
}

export interface ReviewBackfillDeps {
  listCandidates: () => Promise<ReviewBackfillCandidate[]>;
  /** Antal redan lagrade recensioner för produkten (0 = orörd). */
  countExisting: (wixProductId: string) => Promise<number>;
  fetchReviews: (supplierProductId: string) => Promise<{ reviews: AERReview[]; throttled: boolean }>;
  importReviews: (wixProductId: string, reviews: AERReview[]) => Promise<ReviewBackfillImportResult>;
  /** Tecken kvar av månadens DeepL-budget. */
  budgetRemaining: () => Promise<number>;
  /**
   * Stämplar produkten som genomsökt. Anropas ENBART i skarpt läge och ENBART
   * när AE faktiskt svarade — en strypt hämtning får inte se ut som ett svar,
   * då skulle produkten hoppas över i en månad på grund av rate-limiting.
   * Utan stämpeln hämtar en schemalagd körning om samma recensionslösa
   * produkter för alltid.
   */
  markChecked?: (wixProductId: string, atIso: string) => Promise<void>;
  /**
   * Kontrollerar att översättningen fungerar INNAN något publiceras.
   *
   * Utan den här grinden är felläget tyst och stort: review-importen faller vid
   * översättningsfel tillbaka på originaltexten, så en saknad eller spärrad
   * DeepL-nyckel skulle publicera engelska recensioner på hundratals svenska
   * produktsidor, en körning i taget, utan att något ser trasigt ut.
   */
  translationHealthy?: () => Promise<{ ok: boolean; reason?: string }>;
  now?: () => Date;
}

export interface ReviewBackfillOptions {
  /** Max antal produkter denna körning (håller anropet inom maxDuration). */
  limit?: number;
  /** Max recensioner per produkt. Lägre tak = fler produkter per månadsbudget. */
  maxPerProduct?: number;
  /** true = hämta och räkna, skriv INGET. Default true — publicering ska väljas. */
  dryRun?: boolean;
  /** Sluta när mindre än så här många tecken återstår av budgeten. */
  minBudgetChars?: number;
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
  /** DeepL-tecken dessa recensioner kostar. */
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
  charsSpent: number;
  charsEstimated: number;
  throttled: number;
  errors: number;
  /** Varför körningen slutade. */
  stoppedBy: "klar" | "gräns" | "budget" | "översättning" | "tid";
  /** Satt när körningen stoppades av översättningsgrinden. */
  blockedReason?: string;
  budgetRemainingAtEnd: number;
  products: ReviewBackfillProductResult[];
}

export const DEFAULT_BACKFILL_LIMIT = 25;
export const DEFAULT_MAX_PER_PRODUCT = 8;
/** Under detta stannar vi hellre än att publicera engelsk text. */
export const DEFAULT_MIN_BUDGET_CHARS = 2_000;

export async function runReviewBackfill(
  deps: ReviewBackfillDeps,
  opts: ReviewBackfillOptions = {},
): Promise<ReviewBackfillSummary> {
  const limit = Math.max(1, opts.limit ?? DEFAULT_BACKFILL_LIMIT);
  const maxPerProduct = Math.max(1, opts.maxPerProduct ?? DEFAULT_MAX_PER_PRODUCT);
  const dryRun = opts.dryRun !== false;
  const minBudget = opts.minBudgetChars ?? DEFAULT_MIN_BUDGET_CHARS;
  const now = deps.now ?? (() => new Date());

  const products: ReviewBackfillProductResult[] = [];
  let considered = 0;
  let withReviews = 0;
  let reviewsImported = 0;
  let reviewsEligible = 0;
  let charsSpent = 0;
  let charsEstimated = 0;
  let throttled = 0;
  let errors = 0;
  let stoppedBy: ReviewBackfillSummary["stoppedBy"] = "klar";
  let blockedReason: string | undefined;

  // Översättningsgrinden FÖRE allt annat i skarpt läge: hellre en körning som
  // inte gör någonting än hundratals sidor med engelsk text.
  if (!dryRun && deps.translationHealthy) {
    const health = await deps.translationHealthy();
    if (!health.ok) {
      return {
        dryRun, considered: 0, withReviews: 0, reviewsImported: 0, reviewsEligible: 0,
        charsSpent: 0, charsEstimated: 0, throttled: 0, errors: 0,
        stoppedBy: "översättning",
        blockedReason: health.reason ?? "översättningen svarar inte",
        budgetRemainingAtEnd: await deps.budgetRemaining().catch(() => 0),
        products: [],
      };
    }
  }

  const startedAt = (deps.now?.() ?? new Date()).getTime();
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_REVIEW_TIME_BUDGET_MS;
  let remaining = await deps.budgetRemaining();
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
    // Budgetgrinden gäller bara riktiga körningar — en torrkörning ska kunna
    // mäta hela katalogen även när månadens budget är slut.
    if (!dryRun && remaining < minBudget) {
      stoppedBy = "budget";
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
    charsEstimated += chars;

    if (dryRun) {
      products.push({ ...c, fetched: fetched.length, eligible: eligible.length, chars, imported: 0, skippedExisting: 0, status: "dry-run" });
      continue;
    }

    // Räcker inte budgeten för just den här produkten hoppar vi över DEN och
    // stannar — resten tas nästa månad/körning.
    if (chars > remaining) {
      stoppedBy = "budget";
      break;
    }

    try {
      const res = await deps.importReviews(c.wixProductId, eligible);
      reviewsImported += res.imported;
      charsSpent += res.charsUsed;
      remaining -= res.charsUsed;
      products.push({
        ...c,
        fetched: fetched.length,
        eligible: eligible.length,
        chars,
        imported: res.imported,
        skippedExisting: res.skippedExisting,
        status: "imported",
        note: res.translationFailed
          ? "översättningen fallerade — texten sparades oöversatt"
          : res.budgetExceeded
            ? "DeepL-budget slut — texten sparades oöversatt"
            : undefined,
      });
      // Andra försvarslinjen: nyckeln kan sluta fungera MITT i en körning.
      if (res.translationFailed) {
        stoppedBy = "översättning";
        blockedReason = "DeepL slutade svara mitt i körningen";
        break;
      }
      if (res.budgetExceeded) {
        stoppedBy = "budget";
        break;
      }
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
    charsSpent,
    charsEstimated,
    throttled,
    errors,
    stoppedBy,
    blockedReason,
    budgetRemainingAtEnd: remaining,
    products,
  };
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
