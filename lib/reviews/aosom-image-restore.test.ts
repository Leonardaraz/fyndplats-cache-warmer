import { describe, expect, it, vi } from "vitest";
import type { StoredReview } from "../store/reviews";
import {
  restoreReviewImages,
  tolkaMål,
  type RestoreDeps,
  type RestoreTarget,
} from "./aosom-image-restore";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const DÖD = "https://static.wixstatic.com/media/b379ce_dod~mv2.jpg";
const LEVANDE = "https://static.wixstatic.com/media/b379ce_lever~mv2.jpg";
const KÄLLA = "https://img.aosomcdn.com/100/a.jpg";
const KÄLLA2 = "https://img.aosomcdn.com/100/b.jpg";

function rad(over: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: P1,
    reviewIdAE: "gen-abc",
    rating: 5,
    textOriginal: "Sehr gut",
    textSwedish: "Mycket bra",
    initials: "A.B.",
    hasImage: true,
    imageUrl: DÖD,
    imageUrls: [DÖD],
    status: "approved",
    source: "aosom",
    ...over,
  };
}

function deps(rader: StoredReview[], over: Partial<RestoreDeps> = {}) {
  const skrivna: StoredReview[] = [];
  const d: RestoreDeps = {
    listByProduct: vi.fn(async (pid: string) => rader.filter((r) => r.productId === pid)),
    upsert: vi.fn(async (r: StoredReview) => { skrivna.push(r); }),
    lever: vi.fn(async (u: string) => (u === DÖD ? false : u === LEVANDE ? true : null)),
    importeraOchBekrafta: vi.fn(async (_k: string, namn: string) =>
      `https://static.wixstatic.com/media/b379ce_ny-${namn}`),
    now: () => 0,
    ...over,
  };
  return { d, skrivna };
}

const skarpt = { dryRun: false, fromIndex: 0, limit: 100, budgetMs: 1e9 };
const mål: RestoreTarget[] = [{ productId: P1, reviewIdAE: "gen-abc", sourceImageUrls: [KÄLLA] }];

describe("tolkaMål", () => {
  it("släpper bara igenom källfoton på Aosoms CDN", () => {
    const ut = tolkaMål([
      {
        productId: P1,
        reviewIdAE: "gen-1",
        sourceImageUrls: [KÄLLA, "https://evil.example/x.jpg", "http://img.aosomcdn.com/y.jpg", "https://ae01.alicdn.com/kf/z.jpg"],
      },
    ]);
    expect(ut).toEqual([{ productId: P1, reviewIdAE: "gen-1", sourceImageUrls: [KÄLLA] }]);
  });

  it("kastar rader utan källfoton, med felaktiga id och dubbletter", () => {
    const ut = tolkaMål([
      { productId: P1, reviewIdAE: "gen-1", sourceImageUrls: [KÄLLA] },
      { productId: P1, reviewIdAE: "gen-1", sourceImageUrls: [KÄLLA2] },
      { productId: P1, reviewIdAE: "8001" },
      { productId: "inte-ett-id", reviewIdAE: "gen-2", sourceImageUrls: [KÄLLA] },
      { productId: P2, reviewIdAE: "", sourceImageUrls: [KÄLLA] },
    ]);
    expect(ut.map((m) => m.reviewIdAE)).toEqual(["gen-1"]);
  });

  it("tar högst tre unika källfoton", () => {
    const ut = tolkaMål([{
      productId: P1,
      reviewIdAE: "gen-1",
      sourceImageUrls: [KÄLLA, KÄLLA, ...[1, 2, 3].map((n) => `https://img.aosomcdn.com/100/${n}.jpg`)],
    }]);
    expect(ut[0].sourceImageUrls).toEqual([KÄLLA, "https://img.aosomcdn.com/100/1.jpg", "https://img.aosomcdn.com/100/2.jpg"]);
  });
});

describe("restoreReviewImages", () => {
  it("torrt: räknar men importerar och skriver ingenting", async () => {
    const { d, skrivna } = deps([rad()]);
    const s = await restoreReviewImages(mål, d, { ...skarpt, dryRun: true });
    expect(s.kanAterstallas).toBe(1);
    expect(s.fotonAttHamta).toBe(1);
    expect(d.importeraOchBekrafta).not.toHaveBeenCalled();
    expect(skrivna).toHaveLength(0);
  });

  it("skarpt: skriver de bekräftade adresserna och behåller resten av raden", async () => {
    const { d, skrivna } = deps([rad()]);
    const s = await restoreReviewImages(
      [{ ...mål[0], sourceImageUrls: [KÄLLA, KÄLLA2] }],
      d,
      skarpt,
    );
    expect(s.aterstallda).toBe(1);
    expect(s.fotonAterstallda).toBe(2);
    expect(skrivna).toHaveLength(1);
    expect(skrivna[0].imageUrls).toEqual([
      "https://static.wixstatic.com/media/b379ce_ny-kundbild-gen-abc.jpg",
      "https://static.wixstatic.com/media/b379ce_ny-kundbild-gen-abc-2.jpg",
    ]);
    expect(skrivna[0].imageUrl).toBe(skrivna[0].imageUrls![0]);
    expect(skrivna[0].hasImage).toBe(true);
    expect(skrivna[0].textSwedish).toBe("Mycket bra");
    expect(skrivna[0].status).toBe("approved");
    expect(skrivna[0].source).toBe("aosom");
  });

  it("skriver med de foton som blev klara när ett av dem misslyckas", async () => {
    const { d, skrivna } = deps([rad()], {
      importeraOchBekrafta: vi.fn(async (k: string, namn: string) =>
        k === KÄLLA2 ? null : `https://static.wixstatic.com/media/b379ce_ny-${namn}`),
    });
    const s = await restoreReviewImages([{ ...mål[0], sourceImageUrls: [KÄLLA, KÄLLA2] }], d, skarpt);
    expect(s.aterstallda).toBe(1);
    expect(s.fotoMissar).toBe(1);
    expect(skrivna[0].imageUrls).toHaveLength(1);
  });

  it("skriver INTE när inget foto blev klart hos Wix", async () => {
    const { d, skrivna } = deps([rad()], { importeraOchBekrafta: vi.fn(async () => null) });
    const s = await restoreReviewImages(mål, d, skarpt);
    expect(s.misslyckade).toBe(1);
    expect(s.fotoMissar).toBe(1);
    expect(skrivna).toHaveLength(0);
  });

  it("rör inte en rad som har något fungerande foto", async () => {
    const { d, skrivna } = deps([rad({ imageUrls: [DÖD, LEVANDE] })]);
    const s = await restoreReviewImages(mål, d, skarpt);
    expect(s.redanOk).toBe(1);
    expect(skrivna).toHaveLength(0);
  });

  it("rör inte en rad när det inte gick att avgöra om fotot lever", async () => {
    const { d, skrivna } = deps([
      rad({ imageUrl: "https://static.wixstatic.com/media/b379ce_oklar~mv2.jpg", imageUrls: undefined }),
    ]);
    const s = await restoreReviewImages(mål, d, skarpt);
    expect(s.okandStatus).toBe(1);
    expect(skrivna).toHaveLength(0);
  });

  it("hoppar över rader som inte är synliga eller inte finns", async () => {
    const { d } = deps([rad({ status: "pending" })]);
    const s = await restoreReviewImages(
      [...mål, { productId: P1, reviewIdAE: "saknas", sourceImageUrls: [KÄLLA] }],
      d,
      skarpt,
    );
    expect(s.inteSynlig).toBe(1);
    expect(s.saknarRad).toBe(1);
  });

  it("läser varje produkt en gång", async () => {
    const { d } = deps([rad(), rad({ reviewIdAE: "gen-def" })]);
    await restoreReviewImages(
      [mål[0], { productId: P1, reviewIdAE: "gen-def", sourceImageUrls: [KÄLLA2] }],
      d,
      { ...skarpt, dryRun: true },
    );
    expect(d.listByProduct).toHaveBeenCalledTimes(1);
  });

  it("stannar vid tidsbudgeten och säger var nästa varv ska börja", async () => {
    let t = 0;
    const { d } = deps([rad(), rad({ reviewIdAE: "gen-def" })], { now: () => (t += 1000) });
    const s = await restoreReviewImages(
      [mål[0], { productId: P1, reviewIdAE: "gen-def", sourceImageUrls: [KÄLLA] }],
      d,
      { ...skarpt, budgetMs: 1500 },
    );
    expect(s.behandlade).toBe(1);
    expect(s.kvarFran).toBe(1);
  });

  it("kvarFran är null när nyttolasten är slut", async () => {
    const { d } = deps([rad()]);
    const s = await restoreReviewImages(mål, d, skarpt);
    expect(s.kvarFran).toBeNull();
  });
});
