import { describe, expect, it } from "vitest";
import {
  anonymizeCustomer,
  dedupKey,
  ensureReviewId,
  filterAndRankReviews,
  importReviewsForProduct,
  isSpam,
  scoreReview,
  swedishCountry,
  type AERReview,
} from "./review-import";
import type { StoredReview } from "../store/reviews";
import type { TranslationUsageStore } from "../translate/usage";

const NOW = new Date("2026-06-02T00:00:00Z");

function review(o: Partial<AERReview>): AERReview {
  return {
    reviewIdAE: o.reviewIdAE ?? Math.random().toString(36).slice(2),
    rating: o.rating ?? 5,
    text: o.text ?? "Helt fantastisk produkt som höll vad den lovade och mer därtill.",
    hasImage: o.hasImage,
    imageUrl: o.imageUrl,
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

describe("anonymisering", () => {
  it("mappar landkod till svenskt namn", () => {
    expect(swedishCountry("DE")).toBe("Tyskland");
    expect(swedishCountry("Germany")).toBe("Tyskland");
    expect(swedishCountry("XX")).toBe("");
  });
  it("anonymiserar med eller utan land", () => {
    expect(anonymizeCustomer("FR")).toBe("Verifierad kund från Frankrike");
    expect(anonymizeCustomer(undefined)).toBe("Verifierad kund");
    expect(anonymizeCustomer("XX")).toBe("Verifierad kund");
  });
  it("avslöjar aldrig ett AE-användarnamn", () => {
    expect(anonymizeCustomer("u****6543")).toBe("Verifierad kund");
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

class FakeUsage implements TranslationUsageStore {
  constructor(public chars = 0) {}
  async getMonthlyUsage(): Promise<number> {
    return this.chars;
  }
  async addUsage(_month: string, c: number): Promise<void> {
    this.chars += c;
  }
}

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
  it("översätter via DeepL, anonymiserar och sparar; bokför teckenanvändning", async () => {
    const usage = new FakeUsage(0);
    const store = new FakeReviewStore();
    const calls: string[][] = [];
    const res = await importReviewsForProduct(
      "prod1",
      [
        review({ reviewIdAE: "a", text: "Excellent product, fast shipping and great quality overall here." , customerCountry: "DE" }),
        review({ reviewIdAE: "b", text: "Very happy with this purchase, works perfectly and looks premium too." }),
      ],
      {
        now: NOW,
        usageStore: usage,
        reviewStore: store as never,
        translate: async (texts) => {
          calls.push(texts);
          return texts.map((t) => `[SV] ${t}`);
        },
      },
    );
    expect(res.imported).toBe(2);
    expect(res.charsUsed).toBeGreaterThan(0);
    expect(usage.chars).toBe(res.charsUsed);
    expect(store.saved[0].textSwedish.startsWith("[SV]")).toBe(true);
    expect(store.saved[0].customerName).toBe("Verifierad kund från Tyskland");
    expect(calls).toHaveLength(1); // en batch
  });

  it("hoppar över redan importerade recensioner (dedup mot store)", async () => {
    const store = new FakeReviewStore();
    store.existing.add("prod1__a");
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Bra produkt med fin kvalitet och snabb leverans verkligen toppen." })],
      { now: NOW, usageStore: new FakeUsage(), reviewStore: store as never, translate: async (t) => t },
    );
    expect(res.imported).toBe(0);
    expect(res.skippedExisting).toBe(1);
  });

  it("faller tillbaka på originaltext utan att kalla DeepL när budgeten är slut", async () => {
    const store = new FakeReviewStore();
    let translateCalled = false;
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Riktigt bra köp som överträffade mina förväntningar helt klart." })],
      {
        now: NOW,
        budgetChars: 10,
        usageStore: new FakeUsage(9),
        reviewStore: store as never,
        translate: async (t) => {
          translateCalled = true;
          return t;
        },
      },
    );
    expect(res.budgetExceeded).toBe(true);
    expect(translateCalled).toBe(false);
    expect(res.charsUsed).toBe(0);
    expect(store.saved[0].textSwedish).toBe(store.saved[0].textOriginal);
  });

  it("importerar ändå med originaltext om DeepL kastar", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Snabb leverans och produkten matchar beskrivningen perfekt, mycket nöjd." })],
      {
        now: NOW,
        usageStore: new FakeUsage(),
        reviewStore: store as never,
        translate: async () => {
          throw new Error("DeepL nere");
        },
      },
    );
    expect(res.imported).toBe(1);
    expect(store.saved[0].textSwedish).toBe(store.saved[0].textOriginal);
  });

  it("returnerar tomt utan recensioner som passerar filtret", async () => {
    const res = await importReviewsForProduct("prod1", [review({ rating: 1 })], {
      now: NOW,
      usageStore: new FakeUsage(),
      reviewStore: new FakeReviewStore() as never,
      translate: async (t) => t,
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
