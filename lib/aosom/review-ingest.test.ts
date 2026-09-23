import { describe, it, expect } from "vitest";
import { MAX_RADER_PER_ANROP, lasInRecensioner, tolkaInlasning, type InlasDeps } from "./review-ingest";
import { ensureReviewId } from "../import/review-import";
import type { ProductMappingRecord } from "../store";
import type { StoredReview } from "../store/reviews";

const WIX = "wix-1";
const TEXT_DE =
  "Das Sofa ist bequem und lässt sich leicht in ein Bett umbauen. Der Aufbau hat etwa eine Stunde gedauert.";
const TEXT_SV =
  "Soffan är bekväm och är lätt att fälla ut till en säng. Monteringen tog ungefär en timme.";

function mappning(wix = WIX, supplier = "aosom"): ProductMappingRecord {
  return { supplierProductId: `${supplier}:1`, supplier, wixProductId: wix, variants: [] } as ProductMappingRecord;
}

function lagrad(text: string, status: StoredReview["status"] = "pending"): StoredReview {
  return {
    productId: WIX,
    reviewIdAE: ensureReviewId({ rating: 5, text }),
    rating: 5,
    textOriginal: text,
    textSwedish: text,
    initials: "A.B.",
    hasImage: false,
    status,
    source: "aosom",
  };
}

function fakeDeps(over: Partial<InlasDeps> = {}) {
  const sparade: ProductMappingRecord[] = [];
  const redigerade: Array<{ id: string; sv: string }> = [];
  const deps: InlasDeps = {
    hittaMappning: (id) => (id === WIX ? mappning() : undefined),
    importReviews: async (_p, reviews) => ({
      imported: reviews.length,
      skippedExisting: 0,
      reviews: [],
      bildmissar: 0,
    }),
    listByProduct: async () => [lagrad(TEXT_DE)],
    editText: async (_p, id, sv) => {
      redigerade.push({ id, sv });
    },
    saveMapping: async (m) => {
      sparade.push(m);
    },
    now: () => 1_000,
    dryRun: false,
    ...over,
  };
  return { deps, sparade, redigerade };
}

describe("tolkaInlasning", () => {
  it("normaliserar rader, klipper betyg och slänger tomma texter", () => {
    const t = tolkaInlasning({
      rader: [
        { wixProductId: " wix-1 ", rating: "4,6", reviewCount: 14.0, reviews: [{ rating: 9, text: " hej " }, { rating: 3, text: "" }, null] },
      ],
    });
    expect(t.fel).toEqual([]);
    expect(t.rader).toEqual([
      { wixProductId: "wix-1", rating: 4.6, reviewCount: 14, reviews: [{ rating: 5, text: "hej", sv: undefined, date: undefined, imageUrls: undefined }] },
    ]);
  });

  it("tar med datum och foton — men bara foton på deras bild-CDN", () => {
    const t = tolkaInlasning({
      rader: [
        {
          wixProductId: "wix-1",
          reviews: [
            {
              rating: 5,
              text: "hej",
              date: "2026-07-11",
              imageUrls: ["https://img.aosomcdn.com/680/210_comment/2026/08/12/a.jpeg", "https://evil.example/x.jpg", 7],
            },
            { rating: 4, text: "hopp", date: "11 juli" },
          ],
        },
      ],
    });
    expect(t.rader[0].reviews[0]).toMatchObject({ date: "2026-07-11", imageUrls: ["https://img.aosomcdn.com/680/210_comment/2026/08/12/a.jpeg"] });
    expect(t.rader[0].reviews[1].date).toBeUndefined();
    expect(t.rader[0].reviews[1].imageUrls).toBeUndefined();
  });

  it("vägrar fel form: saknad lista, saknat wix-id, för många rader", () => {
    expect(tolkaInlasning({}).fel).toHaveLength(1);
    expect(tolkaInlasning({ rader: [{ reviews: [] }] }).fel).toEqual(["rad 0: wixProductId saknas"]);
    const många = { rader: Array.from({ length: MAX_RADER_PER_ANROP + 1 }, () => ({ wixProductId: "x", reviews: [] })) };
    expect(tolkaInlasning(många).fel[0]).toMatch(/för många rader/);
  });
});

describe("lasInRecensioner", () => {
  it("importerar texterna med tyska som källspråk, datum och foton, och stämplar mappningen med Aosoms aggregat", async () => {
    let skickade: unknown = null;
    const { deps, sparade } = fakeDeps({
      importReviews: async (_p, reviews) => {
        skickade = reviews;
        return { imported: reviews.length, skippedExisting: 0, reviews: [], bildmissar: 0 };
      },
    });
    const foto = "https://img.aosomcdn.com/680/210_comment/2026/08/12/a.jpeg";
    const s = await lasInRecensioner(
      [{ wixProductId: WIX, rating: 4.6, reviewCount: 14, reviews: [{ rating: 5, text: TEXT_DE, date: "2026-07-11", imageUrls: [foto] }] }],
      deps,
    );
    expect(s.importerade).toBe(1);
    expect(s.stamplade).toBe(1);
    expect(skickade).toEqual([{ rating: 5, text: TEXT_DE, language: "de", hasImage: true, imageUrl: foto, imageUrls: [foto], date: "2026-07-11" }]);
    expect(sparade[0]).toMatchObject({ aosomRating: 4.6, aosomReviewCount: 14, reviewsCheckedAt: new Date(1_000).toISOString() });
  });

  it("☠️ aggregatet räknas aldrig ur texterna — saknas det lämnas fälten orörda", async () => {
    const { deps, sparade } = fakeDeps();
    await lasInRecensioner([{ wixProductId: WIX, reviews: [{ rating: 5, text: TEXT_DE }] }], deps);
    expect(sparade[0]).not.toHaveProperty("aosomRating");
    expect(sparade[0]).not.toHaveProperty("aosomReviewCount");
  });

  it("skriver en godkänd översättning på en pending-rad och räknar den", async () => {
    const { deps, redigerade } = fakeDeps();
    const s = await lasInRecensioner(
      [{ wixProductId: WIX, reviews: [{ rating: 5, text: TEXT_DE, sv: TEXT_SV }] }],
      deps,
    );
    expect(s.oversatta).toBe(1);
    expect(redigerade).toEqual([{ id: ensureReviewId({ rating: 5, text: TEXT_DE }), sv: TEXT_SV }]);
  });

  it("☠️ rör aldrig en rad som inte är pending — en redigerad rad är en människas", async () => {
    const { deps, redigerade } = fakeDeps({ listByProduct: async () => [lagrad(TEXT_DE, "edited")] });
    const s = await lasInRecensioner(
      [{ wixProductId: WIX, reviews: [{ rating: 5, text: TEXT_DE, sv: TEXT_SV }] }],
      deps,
    );
    expect(redigerade).toHaveLength(0);
    expect(s.oversattningUtanRad).toBe(1);
  });

  it("☠️ en underkänd översättning skrivs inte — oöversatt text stannar i kön", async () => {
    const { deps, redigerade } = fakeDeps();
    const s = await lasInRecensioner(
      [{ wixProductId: WIX, reviews: [{ rating: 5, text: TEXT_DE, sv: TEXT_DE }] }],
      deps,
    );
    expect(redigerade).toHaveLength(0);
    expect(s.underkanda).toBe(1);
    expect(s.underkandaSkal).toEqual({ oöversatt: 1 });
  });

  it("räknar bortfiltrerade ur importens svar och okända produkter för sig", async () => {
    const { deps } = fakeDeps({
      importReviews: async () => ({ imported: 1, skippedExisting: 1, reviews: [], bildmissar: 0 }),
    });
    const s = await lasInRecensioner(
      [
        { wixProductId: WIX, reviews: [{ rating: 5, text: "a" }, { rating: 5, text: "b" }, { rating: 5, text: "c" }] },
        { wixProductId: "finns-inte", reviews: [{ rating: 5, text: "x" }] },
      ],
      deps,
    );
    expect(s.importerade).toBe(1);
    expect(s.redanFanns).toBe(1);
    expect(s.bortfiltrerade).toBe(1);
    expect(s.okandProdukt).toBe(1);
    expect(s.behandlade).toBe(1);
  });

  it("torrt skriver ingenting", async () => {
    const { deps, sparade, redigerade } = fakeDeps({ dryRun: true });
    const s = await lasInRecensioner(
      [{ wixProductId: WIX, rating: 4, reviewCount: 3, reviews: [{ rating: 5, text: TEXT_DE, sv: TEXT_SV }] }],
      deps,
    );
    expect(sparade).toHaveLength(0);
    expect(redigerade).toHaveLength(0);
    expect(s.importerade).toBe(1);
    expect(s.oversattningarInkomna).toBe(1);
  });

  it("tidsbudgeten stoppar och pekar på första obehandlade raden", async () => {
    let t = 0;
    const { deps } = fakeDeps({ now: () => (t += 100), tidsbudgetMs: 150, startMs: 0 });
    const s = await lasInRecensioner(
      [
        { wixProductId: WIX, reviews: [] },
        { wixProductId: WIX, reviews: [] },
        { wixProductId: WIX, reviews: [] },
      ],
      deps,
    );
    expect(s.stoppadAv).toBe("tidsbudget");
    expect(s.kvarFran).toBe(1);
    expect(s.behandlade).toBe(1);
  });
});
