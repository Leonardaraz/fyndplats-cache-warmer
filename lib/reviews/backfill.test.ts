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
    }),
    now: () => new Date("2026-08-16T12:00:00Z"),
    ...over,
  };
}

describe("runReviewBackfill — torrkörning", () => {
  it("skriver ingenting men räknar vad som skulle sparas", async () => {
    const importReviews = vi.fn();
    const s = await runReviewBackfill(deps({ importReviews }));
    expect(importReviews).not.toHaveBeenCalled();
    expect(s.dryRun).toBe(true);
    expect(s.withReviews).toBe(3);
    expect(s.reviewsEligible).toBe(15);
    expect(s.reviewsImported).toBe(0);
    expect(s.products.every((p) => p.status === "dry-run")).toBe(true);
  });

  // `chars` är det enda måttet som är kvar sedan DeepL-budgeten togs bort, och
  // det betyder numera "så här mycket text väntar på att skrivas om i chatten".
  // Torrkörningen finns just för att svara på den frågan innan man sparar.
  it("räknar tecknen som väntar på översättning", async () => {
    const s = await runReviewBackfill(deps());
    expect(s.considered).toBe(3);
    expect(s.stoppedBy).toBe("klar");
    const summa = s.products.reduce((n, p) => n + p.chars, 0);
    expect(summa).toBeGreaterThan(0);
    // 15 recensioner à 120 tecken (review() kapar till len).
    expect(summa).toBe(15 * 120);
  });
});

describe("runReviewBackfill — skarp körning", () => {
  it("importerar och summerar", async () => {
    const s = await runReviewBackfill(deps(), { dryRun: false });
    expect(s.reviewsImported).toBe(15);
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

  // Tidsbudgeten är sedan DeepL-budgeten försvann det ENDA som hindrar en lång
  // körning från att dödas av Vercels maxDuration mitt i en produktskrivning.
  // Klockan drivs av deps.now, så testet behöver ingen riktig väntan.
  it("tidsbudgeten stoppar körningen mellan två produkter", async () => {
    let tick = 0;
    // Första avläsningen är starttiden; sedan +100 s per varv → tredje
    // produkten hinner aldrig påbörjas med en budget på 150 s.
    const now = () => new Date(Date.UTC(2026, 7, 19, 12, 0, 0) + tick++ * 100_000);
    const importReviews = vi.fn(async (_id: string, revs: AERReview[]) => ({
      imported: revs.length,
      skippedExisting: 0,
    }));
    const s = await runReviewBackfill(
      deps({ listCandidates: async () => candidates(10), now, importReviews }),
      { dryRun: false, timeBudgetMs: 150_000 },
    );
    expect(s.stoppedBy).toBe("tid");
    // Den produkt som pågick blev klar — vi avbryter MELLAN produkter, aldrig
    // mitt i en skrivning.
    expect(s.considered).toBeGreaterThan(0);
    expect(s.considered).toBeLessThan(10);
    expect(importReviews).toHaveBeenCalledTimes(s.considered);
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
