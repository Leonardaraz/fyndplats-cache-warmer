import { describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "../store";
import { BOT_BLOCKED } from "./reviews";
import { runAosomReviewImport, type AosomReviewDeps } from "./review-run";

function mapping(sku: string, extra: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: `wix-${sku}`,
    supplierProductId: sku,
    supplier: "aosom",
    sourceUrl: `https://www.aosom.de/item/x~${sku}.html`,
    ...extra,
  } as ProductMappingRecord;
}

function deps(over: Partial<AosomReviewDeps> = {}): AosomReviewDeps & {
  sparade: ProductMappingRecord[];
  importerade: { productId: string; antal: number }[];
} {
  const sparade: ProductMappingRecord[] = [];
  const importerade: { productId: string; antal: number }[] = [];
  return {
    sparade,
    importerade,
    listMappings: async () => [mapping("A-1"), mapping("A-2"), mapping("A-3")],
    saveMapping: async (m) => { sparade.push(m); },
    fetchReviews: async () => ({ rating: 4.8, reviewCount: 88, reviews: [
      { rating: 5, text: "Sehr gutes Produkt, hält was es verspricht und war schnell aufgebaut.", language: "de" },
    ] }),
    importReviews: async (productId, reviews) => {
      importerade.push({ productId, antal: reviews.length });
      return { imported: reviews.length, skippedExisting: 0, reviews: [], bildmissar: 0 };
    },
    sleep: async () => {},
    now: () => Date.parse("2026-09-01T00:00:00Z"),
    ...over,
  };
}

describe("runAosomReviewImport", () => {
  it("torrkörning är default och skriver ingenting", async () => {
    const d = deps();
    const s = await runAosomReviewImport({}, d);
    expect(s.dryRun).toBe(true);
    expect(d.sparade).toHaveLength(0);
    expect(d.importerade).toHaveLength(0);
    expect(s.attempted).toBe(3);
  });

  it("sparar aggregatet RÅTT på mappningen, inte snittet av texterna", async () => {
    const d = deps({
      // fem femstjärniga texter, men Aosom säger själv 4,8 av 88
      fetchReviews: async () => ({
        rating: 4.8,
        reviewCount: 88,
        reviews: Array.from({ length: 5 }, (_, i) => ({
          rating: 5,
          text: `Wirklich sehr zufrieden mit diesem Produkt, Nummer ${i} und gut verarbeitet.`,
          language: "de",
        })),
      }),
    });
    await runAosomReviewImport({ dryRun: false }, d);
    expect(d.sparade[0].aosomRating).toBe(4.8);
    expect(d.sparade[0].aosomReviewCount).toBe(88);
  });

  it("stämplar reviewsCheckedAt även när produkten saknar recensioner", async () => {
    const d = deps({ fetchReviews: async () => ({ reviews: [] }) });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.withRating).toBe(0);
    expect(s.withText).toBe(0);
    expect(d.sparade).toHaveLength(3);
    expect(d.sparade[0].reviewsCheckedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("☠️ stämplar ALDRIG vid fel — en strypt hämtning får inte gömmas i en månad", async () => {
    const d = deps({ fetchReviews: async () => ({ reviews: [], error: "HTTP 429" }) });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.failed).toBe(3);
    expect(d.sparade).toHaveLength(0);
    expect(s.errors[0]).toEqual({ sku: "A-1", error: "HTTP 429" });
  });

  it("hoppar över produkter som kollats inom omkontrollfönstret", async () => {
    const d = deps({
      listMappings: async () => [
        mapping("A-1", { reviewsCheckedAt: "2026-08-30T00:00:00Z" }), // 2 dygn sedan
        mapping("A-2", { reviewsCheckedAt: "2026-01-01T00:00:00Z" }), // gammal
        mapping("A-3"),
      ],
    });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.alreadyChecked).toBe(1);
    expect(s.attempted).toBe(2);
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["A-2", "A-3"]);
  });

  it("ignoreCheckedAt kollar om allt", async () => {
    const d = deps({
      listMappings: async () => [mapping("A-1", { reviewsCheckedAt: "2026-08-30T00:00:00Z" })],
    });
    const s = await runAosomReviewImport({ dryRun: false, ignoreCheckedAt: true }, d);
    expect(s.alreadyChecked).toBe(0);
    expect(s.attempted).toBe(1);
  });

  it("limit stannar körningen och lämnar en markör att fortsätta på", async () => {
    const d = deps();
    const s = await runAosomReviewImport({ dryRun: false, limit: 2 }, d);
    expect(s.attempted).toBe(2);
    expect(s.stoppedBy).toBe("limit");
    expect(s.cursor).toBe("A-2");
    expect(s.remaining).toBe(1);
  });

  it("markören fortsätter EFTER den angivna produkten", async () => {
    const d = deps();
    const s = await runAosomReviewImport({ dryRun: false, after: "A-2" }, d);
    expect(s.attempted).toBe(1);
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["A-3"]);
    expect(s.cursor).toBeNull();
  });

  it("tidsbudgeten stannar körningen", async () => {
    let t = 0;
    const d = deps({ now: () => (t += 100_000) });
    const s = await runAosomReviewImport({ dryRun: false, timeBudgetMs: 150_000 }, d);
    expect(s.stoppedBy).toBe("tidsbudget");
    expect(s.attempted).toBeLessThan(3);
  });

  it("rör bara Aosom-rader med källadress", async () => {
    const d = deps({
      listMappings: async () => [
        mapping("A-1"),
        { ...mapping("A-2"), supplier: "aliexpress" } as ProductMappingRecord,
        { ...mapping("A-3"), sourceUrl: undefined } as ProductMappingRecord,
      ],
    });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.candidates).toBe(1);
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["A-1"]);
  });

  it("räknar texter husets filter sållade bort", async () => {
    const d = deps({
      fetchReviews: async () => ({ rating: 5, reviewCount: 4, reviews: [
        { rating: 5, text: "Toller Stuhl!", language: "de" },
        { rating: 5, text: "Sehr bequem und gut verarbeitet, würde ich wieder kaufen.", language: "de" },
      ] }),
      // husets 50-teckengolv släpper bara igenom den andra
      importReviews: async () => ({ imported: 1, skippedExisting: 0, reviews: [], bildmissar: 0 }),
    });
    const s = await runAosomReviewImport({ dryRun: false, limit: 1 }, d);
    expect(s.imported).toBe(1);
    expect(s.filteredOut).toBe(1);
  });

  it("onlySkus kör bara de utpekade", async () => {
    const d = deps();
    const s = await runAosomReviewImport({ dryRun: false, onlySkus: ["A-2"] }, d);
    expect(s.candidates).toBe(1);
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["A-2"]);
  });

  it("skickar recensionerna till rätt Wix-produkt", async () => {
    const d = deps();
    await runAosomReviewImport({ dryRun: false, limit: 1 }, d);
    expect(d.importerade[0]).toEqual({ productId: "wix-A-1", antal: 1 });
  });

  it("pausar mellan sidhämtningar", async () => {
    const sleep = vi.fn(async () => {});
    const d = deps({ sleep });
    await runAosomReviewImport({ dryRun: false, delayMs: 1200 }, d);
    expect(sleep).toHaveBeenCalledWith(1200);
  });

  it("☠️ stannar när Akamai spärrar — spärren gäller klienten, inte varan", async () => {
    const d = deps({
      listMappings: async () => Array.from({ length: 20 }, (_, i) => mapping(`A-${String(i).padStart(2, "0")}`)),
      fetchReviews: async () => ({ reviews: [], error: BOT_BLOCKED }),
    });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.stoppedBy).toBe("blockerad");
    expect(s.blocked).toBe(3);
    // Räknas som spärr, inte som fel — "40 fel" ser ut som otur, "40
    // blockerade" säger sanningen.
    expect(s.failed).toBe(0);
    expect(d.sparade).toHaveLength(0);
    expect(s.errors).toHaveLength(3);
    expect(s.errors[0].error).toBe(BOT_BLOCKED);
  });

  it("en ensam spärr mitt i avbryter inte körningen", async () => {
    let n = 0;
    const d = deps({
      fetchReviews: async () => {
        n++;
        if (n === 2) return { reviews: [], error: BOT_BLOCKED };
        return { rating: 4.5, reviewCount: 9, reviews: [] };
      },
    });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.blocked).toBe(1);
    expect(s.stoppedBy).toBe("klart");
    expect(s.attempted).toBe(3);
    expect(d.sparade).toHaveLength(2);
  });

  it("vanliga fel räknas separat från spärren", async () => {
    const d = deps({ fetchReviews: async () => ({ reviews: [], error: "HTTP 500" }) });
    const s = await runAosomReviewImport({ dryRun: false }, d);
    expect(s.failed).toBe(3);
    expect(s.blocked).toBe(0);
    expect(s.stoppedBy).toBe("klart");
  });
});
