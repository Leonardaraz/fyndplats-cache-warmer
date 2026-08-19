import { describe, expect, it } from "vitest";
import {
  dedupKey,
  deriveInitials,
  ensureReviewId,
  filterAndRankReviews,
  importReviewsForProduct,
  isSpam,
  scoreReview,
  type AERReview,
} from "./review-import";
import type { StoredReview } from "../store/reviews";

const NOW = new Date("2026-06-02T00:00:00Z");

function review(o: Partial<AERReview>): AERReview {
  return {
    reviewIdAE: o.reviewIdAE ?? Math.random().toString(36).slice(2),
    rating: o.rating ?? 5,
    text: o.text ?? "Helt fantastisk produkt som höll vad den lovade och mer därtill.",
    hasImage: o.hasImage,
    imageUrl: o.imageUrl,
    customerName: o.customerName,
    customerCountry: o.customerCountry,
    date: o.date,
    language: o.language,
  };
}

describe("isSpam", () => {
  it("flaggar upprepningsspam (good good very nice nice)", () => {
    expect(isSpam("good good good good very nice nice nice good good nice")).toBe(true);
  });
  it("godkänner riktig text med tillräcklig variation", () => {
    expect(isSpam("Mycket bra kvalitet och snabb leverans, rekommenderas varmt till alla.")).toBe(false);
  });
  it("flaggar text med för få ord", () => {
    expect(isSpam("bra grej")).toBe(true);
  });
});

describe("filterAndRankReviews", () => {
  it("filtrerar bort < 3 stjärnor", () => {
    const out = filterAndRankReviews(
      [review({ rating: 2, reviewIdAE: "a" }), review({ rating: 5, reviewIdAE: "b" })],
      NOW,
    );
    expect(out.map((r) => r.reviewIdAE)).toEqual(["b"]);
  });

  it("filtrerar bort för korta och för långa texter", () => {
    const short = review({ reviewIdAE: "s", text: "kort" });
    const long = review({ reviewIdAE: "l", text: "x".repeat(400) });
    const ok = review({ reviewIdAE: "o", text: "En helt utmärkt produkt med fin passform och bra material." });
    const out = filterAndRankReviews([short, long, ok], NOW);
    expect(out.map((r) => r.reviewIdAE)).toEqual(["o"]);
  });

  it("deduplicerar identisk text (skiftläge/skiljetecken ignoreras)", () => {
    const a = review({ reviewIdAE: "a", text: "Superbra kvalitet, snabb leverans och fint emballage!" });
    const b = review({ reviewIdAE: "b", text: "superbra kvalitet snabb leverans och fint emballage" });
    const out = filterAndRankReviews([a, b], NOW);
    expect(out).toHaveLength(1);
  });

  it("rankar foto > senaste > EU > längd, deterministiskt", () => {
    const photo = review({ reviewIdAE: "photo", hasImage: true, customerCountry: "CN", text: "Bilden visar exakt hur fin produkten är i verkligheten, mycket nöjd." });
    const recent = review({ reviewIdAE: "recent", date: "2026-05-20T00:00:00Z", customerCountry: "CN", text: "Kom snabbt och fungerar precis som den ska, kan varmt rekommendera." });
    const eu = review({ reviewIdAE: "eu", customerCountry: "DE", text: "Levererades inom EU och kvaliteten kändes gedigen hela vägen igenom." });
    const out = filterAndRankReviews([eu, recent, photo], NOW);
    expect(out[0].reviewIdAE).toBe("photo");
    expect(out.map((r) => r.reviewIdAE)).toEqual(["photo", "recent", "eu"]);
  });

  it("kapar till max (default 15)", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      review({ reviewIdAE: `r${i}`, text: `Riktigt bra produkt nummer ${i} med fin kvalitet och snabb frakt.` }),
    );
    expect(filterAndRankReviews(many, NOW)).toHaveLength(15);
    expect(filterAndRankReviews(many, NOW, { max: 10 })).toHaveLength(10);
  });
});

describe("scoreReview", () => {
  it("ger foto högst enskild vikt", () => {
    expect(scoreReview(review({ hasImage: true }), NOW)).toBeGreaterThan(
      scoreReview(review({ hasImage: false, customerCountry: "DE" }), NOW),
    );
  });
});

describe("deriveInitials", () => {
  it("flera namn-tokens → första + sista initial", () => {
    expect(deriveInitials("Maria Karlsson", "x")).toBe("M.K.");
    expect(deriveInitials("anna k", "x")).toBe("A.K.");
  });
  it("maskerat AE-namn (M***a) → första + sista bokstaven", () => {
    expect(deriveInitials("M***a", "x")).toBe("M.A.");
  });
  it("en bokstav (u****6543) → bokstav + deterministisk andra", () => {
    const out = deriveInitials("u****6543", "rev1");
    expect(out).toMatch(/^U\.[A-Z]\.$/);
    expect(deriveInitials("u****6543", "rev1")).toBe(out); // deterministiskt
  });
  it("inget namn → två deterministiska bokstäver ur reviewIdAE", () => {
    const out = deriveInitials(undefined, "rev-abc");
    expect(out).toMatch(/^[A-Z]\.[A-Z]\.$/);
    expect(deriveInitials("", "rev-abc")).toBe(out);
    // Olika reviewIdAE → (oftast) olika initialer, men ALLTID stabilt per id.
    expect(deriveInitials(undefined, "rev-abc")).toBe(out);
  });
  it("visar aldrig hela namnet eller siffror", () => {
    expect(deriveInitials("Maria Karlsson", "x")).not.toContain("aria");
    expect(deriveInitials("u****6543", "x")).not.toMatch(/\d/);
  });
});

describe("ensureReviewId", () => {
  it("behåller befintligt id", () => {
    expect(ensureReviewId(review({ reviewIdAE: "abc" }))).toBe("abc");
  });
  it("härleder stabilt id ur texten när det saknas", () => {
    const r = review({ reviewIdAE: "", text: "Samma text ger samma id varje gång helt deterministiskt." });
    expect(ensureReviewId(r)).toBe(ensureReviewId({ ...r }));
    expect(ensureReviewId(r)).toMatch(/^gen-/);
  });
});

// --- Orchestrering (fakeade beroenden) -------------------------------------


class FakeReviewStore {
  saved: StoredReview[] = [];
  existing = new Set<string>();
  async exists(productId: string, reviewIdAE: string): Promise<boolean> {
    return this.existing.has(`${productId}__${reviewIdAE}`);
  }
  async upsert(r: StoredReview): Promise<void> {
    this.saved.push(r);
  }
}

describe("importReviewsForProduct", () => {
  it("sparar som pending med kalltexten, satter initialer och anonymiserar", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct(
      "prod1",
      [
        review({ reviewIdAE: "a", text: "Excellent product, fast shipping and great quality overall here.", customerName: "Maria Karlsson", customerCountry: "DE" }),
        review({ reviewIdAE: "b", text: "Very happy with this purchase, works perfectly and looks premium too." }),
      ],
      { now: NOW, reviewStore: store as never },
    );
    expect(res.imported).toBe(2);
    // KALLTEXTEN sparas som svensk text tills nagon skrivit om den i
    // /admin/reviews. DeepL togs bort 2026-08-19 — allt poleras i chatten.
    expect(store.saved[0].textSwedish).toBe(store.saved[0].textOriginal);
    // Visningsnamn = initialer; landet/namnet LAGRAS men visas aldrig.
    expect(store.saved[0].initials).toBe("M.K.");
    expect(store.saved[0].customerNameRaw).toBe("Maria Karlsson");
    expect(store.saved[0].customerCountry).toBe("DE");
    // ALLTID pending: en ooversatt recension far aldrig na produktsidan.
    expect(store.saved[0].status).toBe("pending");
    expect(store.saved[1].status).toBe("pending");
    expect(store.saved[1].initials).toMatch(/^[A-Z]\.[A-Z]\.$/);
  });

  it("hoppar över redan importerade recensioner (dedup mot store)", async () => {
    const store = new FakeReviewStore();
    store.existing.add("prod1__a");
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Bra produkt med fin kvalitet och snabb leverans verkligen toppen." })],
      { now: NOW, reviewStore: store as never },
    );
    expect(res.imported).toBe(0);
    expect(res.skippedExisting).toBe(1);
  });

  it("returnerar tomt utan recensioner som passerar filtret", async () => {
    const res = await importReviewsForProduct("prod1", [review({ rating: 1 })], {
      now: NOW,
      reviewStore: new FakeReviewStore() as never,
    });
    expect(res.imported).toBe(0);
    expect(res.reviews).toHaveLength(0);
  });
});

describe("dedupKey", () => {
  it("normaliserar skiljetecken och whitespace", () => {
    expect(dedupKey("  Hej,   Världen!! ")).toBe("hej världen");
  });
});

// Torktumlaren 2026-08-18: en rysk recension skriven utan blanksteg efter punkt
// klistrades ihop av dedupKey ("отлично.быстрая" → ett ord) och föll på
// isSpam:s fyra-ords-krav. Att skriva tätt efter punkt är inte spam.
describe("dedupKey och isSpam vid text utan blanksteg efter punkt", () => {
  it("skiljetecken separerar ord i stället för att klistra ihop dem", () => {
    expect(dedupKey("Bra produkt.Snabb leverans")).toBe("bra produkt snabb leverans");
  });

  it("en vettig recension utan blanksteg efter punkt klassas inte som spam", () => {
    expect(isSpam("отлично.быстрая доставка.работает.спасибо продавцу.рекомендую")).toBe(false);
    expect(isSpam("Bra kvalitet.Snabb frakt.Fungerar precis som beskrivet")).toBe(false);
  });

  it("riktig upprepningsspam fastnar fortfarande", () => {
    expect(isSpam("bra bra bra bra bra bra")).toBe(true);
    expect(isSpam("nice")).toBe(true);
  });
});
