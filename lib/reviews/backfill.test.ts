import { describe, expect, it, vi } from "vitest";
import { runReviewBackfill, type ReviewBackfillDeps } from "./backfill";
import type { AERReview } from "../import/review-import";

// Texten måste vara >= 50 tecken och ha nog med unika ord för att passera det
// riktiga filtret (REVIEW_FILTER + isSpam) — annars mäter testet ingenting.
// Det som skiljer recensionerna åt måste ligga FÖRST: filtret dedupar på text,
// och en gemensam inledning gjorde alla fem till samma recension.
function review(i: number, len = 120): AERReview {
  const text = (
    `Recension nummer ${i}: fungerar precis som beskrivet, snabb leverans och ` +
    "stabil kvalitet på materialet genom hela konstruktionen utan glapp någonstans."
  ).slice(0, len);
  return {
    reviewIdAE: `ae-${i}`,
    rating: 5,
    text,
    hasImage: i % 2 === 0,
    date: new Date(Date.UTC(2026, 6, 1 + (i % 20))).toISOString(),
  };
}

function candidates(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    wixProductId: `wix-${i}`,
    supplierProductId: `ae-${i}`,
    title: `Produkt ${i}`,
  }));
}

function deps(over: Partial<ReviewBackfillDeps> = {}, reviewsPerProduct = 5): ReviewBackfillDeps {
  return {
    listCandidates: async () => candidates(3),
    countExisting: async () => 0,
    fetchReviews: async () => ({
      reviews: Array.from({ length: reviewsPerProduct }, (_, i) => review(i)),
      throttled: false,
    }),
    importReviews: async (_id, revs) => ({
      imported: revs.length,
      skippedExisting: 0,
      charsUsed: revs.reduce((s, r) => s + r.text.length, 0),
      budgetExceeded: false,
    }),
    budgetRemaining: async () => 500_000,
    now: () => new Date("2026-08-16T12:00:00Z"),
    ...over,
  };
}

describe("runReviewBackfill — torrkörning", () => {
  it("skriver ingenting men räknar vad det skulle kosta", async () => {
    const importReviews = vi.fn();
    const s = await runReviewBackfill(deps({ importReviews }));
    expect(importReviews).not.toHaveBeenCalled();
    expect(s.dryRun).toBe(true);
    expect(s.withReviews).toBe(3);
    expect(s.reviewsEligible).toBe(15);
    expect(s.charsEstimated).toBeGreaterThan(0);
    expect(s.reviewsImported).toBe(0);
    expect(s.products.every((p) => p.status === "dry-run")).toBe(true);
  });

  // Torrkörningens jobb är att MÄTA — den ska svara även när budgeten är slut.
  it("mäter hela urvalet även med tom DeepL-budget", async () => {
    const s = await runReviewBackfill(deps({ budgetRemaining: async () => 0 }));
    expect(s.considered).toBe(3);
    expect(s.stoppedBy).toBe("klar");
  });
});

describe("runReviewBackfill — skarp körning", () => {
  it("importerar och summerar", async () => {
    const s = await runReviewBackfill(deps(), { dryRun: false });
    expect(s.reviewsImported).toBe(15);
    expect(s.charsSpent).toBeGreaterThan(0);
    expect(s.stoppedBy).toBe("klar");
  });

  it("taket per produkt begränsar hur många som sparas", async () => {
    const s = await runReviewBackfill(deps({}, 20), { dryRun: false, maxPerProduct: 3 });
    expect(s.reviewsImported).toBe(9); // 3 produkter × 3
  });

  it("produkter som redan har recensioner hoppas över utan nätanrop", async () => {
    const fetchReviews = vi.fn(async () => ({ reviews: [], throttled: false }));
    const s = await runReviewBackfill(deps({ countExisting: async () => 4, fetchReviews }), { dryRun: false });
    expect(fetchReviews).not.toHaveBeenCalled();
    expect(s.products.every((p) => p.status === "har-redan")).toBe(true);
    expect(s.withReviews).toBe(0);
  });

  it("includeExisting kör ändå", async () => {
    const s = await runReviewBackfill(deps({ countExisting: async () => 4 }), { dryRun: false, includeExisting: true });
    expect(s.reviewsImported).toBe(15);
  });

  it("limit stoppar körningen och rapporterar det", async () => {
    const s = await runReviewBackfill(deps({ listCandidates: async () => candidates(10) }), { dryRun: false, limit: 2 });
    expect(s.considered).toBe(2);
    expect(s.stoppedBy).toBe("gräns");
  });
});

describe("runReviewBackfill — budgetgrinden", () => {
  // Felläget vi bygger bort: review-importen faller tillbaka på ORIGINALTEXTEN
  // vid budgetslut, dvs. engelska recensioner på en svensk sida.
  it("stannar innan budgeten tar slut i stället för att publicera oöversatt", async () => {
    const importReviews = vi.fn(async (_id: string, revs: AERReview[]) => ({
      imported: revs.length,
      skippedExisting: 0,
      charsUsed: revs.reduce((s, r) => s + r.text.length, 0),
      budgetExceeded: false,
    }));
    const s = await runReviewBackfill(
      deps({ listCandidates: async () => candidates(10), importReviews, budgetRemaining: async () => 1_000 }),
      { dryRun: false, minBudgetChars: 2_000 },
    );
    expect(importReviews).not.toHaveBeenCalled();
    expect(s.stoppedBy).toBe("budget");
    expect(s.reviewsImported).toBe(0);
  });

  it("stannar när nästa produkt inte får plats i det som är kvar", async () => {
    // Budget räcker till första produkten men inte den andra.
    const perProduct = 5 * 120;
    const s = await runReviewBackfill(
      deps({ listCandidates: async () => candidates(5), budgetRemaining: async () => perProduct + 10 }),
      { dryRun: false, minBudgetChars: 0 },
    );
    expect(s.reviewsImported).toBe(5);
    expect(s.stoppedBy).toBe("budget");
  });

  it("budgetExceeded från importen avbryter resten av körningen", async () => {
    const s = await runReviewBackfill(
      deps({
        listCandidates: async () => candidates(5),
        importReviews: async (_id, revs) => ({
          imported: revs.length,
          skippedExisting: 0,
          charsUsed: 0,
          budgetExceeded: true,
        }),
      }),
      { dryRun: false, minBudgetChars: 0 },
    );
    expect(s.considered).toBe(1);
    expect(s.stoppedBy).toBe("budget");
    expect(s.products[0].note).toMatch(/oöversatt/);
  });
});

describe("runReviewBackfill — översättningsgrinden", () => {
  // Felläget vi bygger bort: review-importen faller vid översättningsfel
  // tillbaka på ORIGINALTEXTEN. En saknad DeepL-nyckel skulle alltså publicera
  // engelska recensioner på hundratals svenska produktsidor, tyst.
  it("vägrar starta skarpt när översättningen inte svarar", async () => {
    const importReviews = vi.fn();
    const fetchReviews = vi.fn();
    const s = await runReviewBackfill(
      deps({
        importReviews,
        fetchReviews,
        translationHealthy: async () => ({ ok: false, reason: "DEEPL_API_KEY saknas i miljön" }),
      }),
      { dryRun: false },
    );
    expect(fetchReviews).not.toHaveBeenCalled();
    expect(importReviews).not.toHaveBeenCalled();
    expect(s.stoppedBy).toBe("översättning");
    expect(s.blockedReason).toMatch(/DEEPL_API_KEY/);
    expect(s.considered).toBe(0);
  });

  it("torrkörning bryr sig inte om grinden — den publicerar ingenting", async () => {
    const s = await runReviewBackfill(
      deps({ translationHealthy: async () => ({ ok: false, reason: "nyckel saknas" }) }),
      { dryRun: true },
    );
    expect(s.stoppedBy).toBe("klar");
    expect(s.considered).toBe(3);
  });

  it("frisk översättning släpper igenom körningen", async () => {
    const s = await runReviewBackfill(
      deps({ translationHealthy: async () => ({ ok: true }) }),
      { dryRun: false },
    );
    expect(s.reviewsImported).toBe(15);
  });

  // Nyckeln kan sluta fungera MITT i en körning — andra försvarslinjen.
  it("stannar direkt om översättningen fallerar under körningen", async () => {
    const s = await runReviewBackfill(
      deps({
        listCandidates: async () => candidates(5),
        importReviews: async (_id, revs) => ({
          imported: revs.length,
          skippedExisting: 0,
          charsUsed: 0,
          budgetExceeded: false,
          translationFailed: true,
        }),
      }),
      { dryRun: false },
    );
    expect(s.considered).toBe(1);
    expect(s.stoppedBy).toBe("översättning");
    expect(s.products[0].note).toMatch(/oöversatt/);
  });
});

describe("runReviewBackfill — genomsökt-stämpeln", () => {
  // Utan stämpeln hämtar en schemalagd körning om de ~40 % recensionslösa
  // produkterna vid varje körning, för alltid.
  it("stämplar även produkter där AE inte hade några recensioner", async () => {
    const markChecked = vi.fn(async () => {});
    await runReviewBackfill(
      deps({ markChecked, fetchReviews: async () => ({ reviews: [], throttled: false }) }),
      { dryRun: false },
    );
    expect(markChecked).toHaveBeenCalledTimes(3);
  });

  // Strypt är inte ett svar. Stämplas den skulle rate-limiting dölja produkten
  // i en månad.
  it("stämplar INTE en strypt produkt", async () => {
    const markChecked = vi.fn(async () => {});
    await runReviewBackfill(
      deps({ markChecked, fetchReviews: async () => ({ reviews: [], throttled: true }) }),
      { dryRun: false },
    );
    expect(markChecked).not.toHaveBeenCalled();
  });

  it("torrkörning stämplar ingenting", async () => {
    const markChecked = vi.fn(async () => {});
    await runReviewBackfill(deps({ markChecked }), { dryRun: true });
    expect(markChecked).not.toHaveBeenCalled();
  });

  it("ett fel på stämpeln hindrar inte importen", async () => {
    const s = await runReviewBackfill(
      deps({ markChecked: async () => { throw new Error("Wix 500"); } }),
      { dryRun: false },
    );
    expect(s.reviewsImported).toBe(15);
    expect(s.errors).toBe(0);
  });
});

describe("runReviewBackfill — motståndskraft", () => {
  // Strypt är inte samma sak som recensionslös: den ena ska tas om, den andra inte.
  it("strypt produkt får egen status och skrivs inte av som tom", async () => {
    const s = await runReviewBackfill(
      deps({ fetchReviews: async () => ({ reviews: [], throttled: true }) }),
      { dryRun: false },
    );
    expect(s.throttled).toBe(3);
    expect(s.products.every((p) => p.status === "strypt")).toBe(true);
  });

  it("produkt utan recensioner markeras som just det", async () => {
    const s = await runReviewBackfill(deps({ fetchReviews: async () => ({ reviews: [], throttled: false }) }), { dryRun: false });
    expect(s.products.every((p) => p.status === "inga-recensioner")).toBe(true);
    expect(s.throttled).toBe(0);
  });

  it("ett fel på en produkt fäller inte körningen", async () => {
    let n = 0;
    const s = await runReviewBackfill(
      deps({
        listCandidates: async () => candidates(3),
        fetchReviews: async () => {
          n++;
          if (n === 2) throw new Error("ECONNRESET");
          return { reviews: [review(1)], throttled: false };
        },
      }),
      { dryRun: false },
    );
    expect(s.errors).toBe(1);
    expect(s.considered).toBe(3);
    expect(s.reviewsImported).toBe(2);
  });

  // Ett trasigt uppslag får inte se ut som "orörd produkt" och ge dubbletter.
  it("fel i dubblettkollen importerar INTE på måfå", async () => {
    const importReviews = vi.fn();
    const s = await runReviewBackfill(
      deps({ countExisting: async () => { throw new Error("Wix 500"); }, importReviews }),
      { dryRun: false },
    );
    expect(importReviews).not.toHaveBeenCalled();
    expect(s.errors).toBe(3);
  });
});
