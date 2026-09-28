import { describe, it, expect } from "vitest";
import { runImageRestore, type ImageRestoreDeps } from "./image-restore";
import type { StoredReview } from "../store/reviews";
import type { AERReview } from "../import/review-import";

const W = (n: string) => `https://static.wixstatic.com/media/b379ce_${n}~mv2.jpg`;
const AE = (n: string) => `https://ae-pic-a1.aliexpress-media.com/kf/${n}.jpg`;

function rad(p: Partial<StoredReview> & { productId: string; reviewIdAE: string }): StoredReview {
  return {
    rating: 5,
    textOriginal: "x",
    textSwedish: "x",
    initials: "A.B.",
    hasImage: true,
    status: "approved",
    ...p,
  };
}

function deps(over: Partial<ImageRestoreDeps> & { rader: StoredReview[]; ae?: Record<string, AERReview[]>; doda?: string[] }) {
  const skrivna: StoredReview[] = [];
  const importer: Array<[string, string]> = [];
  const hamtningar: string[] = [];
  const d: ImageRestoreDeps = {
    listAll: async () => over.rader,
    aeProductId: async (pid) => (over.ae && pid in over.ae ? `ae-${pid}` : null),
    fetchReviews: async (id) => {
      hamtningar.push(id);
      return { reviews: over.ae?.[id.slice(3)] ?? [], throttled: false };
    },
    isDead: async (u) => (over.doda ?? []).includes(u),
    importImage: async (u, namn) => {
      importer.push([u, namn]);
      return W(`ny-${u.split("/").pop()!.replace(".jpg", "")}`);
    },
    upsert: async (r) => { skrivna.push(r); },
    ...over,
  };
  return { d, skrivna, importer, hamtningar };
}

const OPTS = { dryRun: false, limit: 100, timeBudgetMs: 60_000 };

describe("runImageRestore", () => {
  it("återställer en död bild från AE, parad på recensions-id, med husets filnamn", async () => {
    const { d, skrivna, importer } = deps({
      rader: [rad({ productId: "p1", reviewIdAE: "111", imageUrl: W("a"), imageUrls: [W("a"), W("b")] })],
      doda: [W("a"), W("b")],
      ae: { p1: [{ reviewIdAE: "111", rating: 5, text: "t", imageUrl: AE("x"), imageUrls: [AE("x"), AE("y")] }] },
    });
    const s = await runImageRestore(d, OPTS);
    expect(s).toMatchObject({ raderMedDoda: 1, hittadeHosAE: 1, aterstallda: 1, bilderAterstallda: 2, nasta: null, stoppadAv: "klar" });
    expect(importer.map(([, n]) => n)).toEqual(["kundbild-111.jpg", "kundbild-111-2.jpg"]);
    expect(skrivna[0]).toMatchObject({ reviewIdAE: "111", hasImage: true, imageUrl: W("ny-x"), imageUrls: [W("ny-x"), W("ny-y")] });
  });

  it("rör inte rader vars bilder lever, och hämtar då inget från AE", async () => {
    const { d, skrivna, hamtningar } = deps({
      rader: [rad({ productId: "p1", reviewIdAE: "111", imageUrl: W("a") })],
      doda: [],
      ae: { p1: [] },
    });
    const s = await runImageRestore(d, OPTS);
    expect(s.produkterMedDoda).toBe(0);
    expect(hamtningar).toEqual([]);
    expect(skrivna).toEqual([]);
  });

  it("torrkörning räknar men importerar och skriver inget", async () => {
    const { d, skrivna, importer } = deps({
      rader: [rad({ productId: "p1", reviewIdAE: "111", imageUrl: W("a") })],
      doda: [W("a")],
      ae: { p1: [{ reviewIdAE: "111", rating: 5, text: "t", imageUrl: AE("x") }] },
    });
    const s = await runImageRestore(d, { ...OPTS, dryRun: true });
    expect(s.hittadeHosAE).toBe(1);
    expect(importer).toEqual([]);
    expect(skrivna).toEqual([]);
  });

  it("hoppar över Aosom, kundens egna och opublicerade rader", async () => {
    const { d, hamtningar } = deps({
      rader: [
        rad({ productId: "p1", reviewIdAE: "a", source: "aosom", imageUrl: W("a") }),
        rad({ productId: "p2", reviewIdAE: "b", source: "customer", imageUrl: W("b") }),
        rad({ productId: "p3", reviewIdAE: "c", status: "pending", imageUrl: W("c") }),
      ],
      doda: [W("a"), W("b"), W("c")],
      ae: { p1: [], p2: [], p3: [] },
    });
    const s = await runImageRestore(d, OPTS);
    expect(s.produkterTotalt).toBe(0);
    expect(hamtningar).toEqual([]);
  });

  it("skriver bara hemflyttade adresser; misslyckas alla importer skrivs raden inte", async () => {
    const { d, skrivna } = deps({
      rader: [rad({ productId: "p1", reviewIdAE: "111", imageUrl: W("a") })],
      doda: [W("a")],
      ae: { p1: [{ reviewIdAE: "111", rating: 5, text: "t", imageUrl: AE("x") }] },
      importImage: async () => null,
    });
    const s = await runImageRestore(d, OPTS);
    expect(s.importfel).toBe(1);
    expect(s.aterstallda).toBe(0);
    expect(skrivna).toEqual([]);
  });

  it("räknar rader som AE inte längre har, och produkter utan AE-mappning", async () => {
    const { d, skrivna } = deps({
      rader: [
        rad({ productId: "p1", reviewIdAE: "111", imageUrl: W("a") }),
        rad({ productId: "p2", reviewIdAE: "222", imageUrl: W("b") }),
      ],
      doda: [W("a"), W("b")],
      ae: { p1: [{ reviewIdAE: "999", rating: 5, text: "t", imageUrl: AE("x") }] },
    });
    const s = await runImageRestore(d, OPTS);
    expect(s).toMatchObject({ saknasHosAE: 1, utanAEMappning: 1, aterstallda: 0 });
    expect(skrivna).toEqual([]);
  });

  it("stannar vid limit och fortsätter efter `nasta`", async () => {
    const rader = ["p1", "p2", "p3"].map((p) => rad({ productId: p, reviewIdAE: p, imageUrl: W(p) }));
    const ae = Object.fromEntries(rader.map((r) => [r.productId, [{ reviewIdAE: r.reviewIdAE, rating: 5, text: "t", imageUrl: AE(r.productId) }]]));
    const doda = rader.map((r) => r.imageUrl!);
    const a = deps({ rader, ae, doda });
    const s1 = await runImageRestore(a.d, { ...OPTS, limit: 2 });
    expect(s1).toMatchObject({ stoppadAv: "limit", nasta: "p2", aterstallda: 2 });
    const b = deps({ rader, ae, doda });
    const s2 = await runImageRestore(b.d, { ...OPTS, limit: 2, after: s1.nasta! });
    expect(s2).toMatchObject({ stoppadAv: "klar", nasta: null, aterstallda: 1 });
    expect(b.skrivna.map((r) => r.productId)).toEqual(["p3"]);
  });

  it("strypt hämtning räknas och skriver inget", async () => {
    const { d, skrivna } = deps({
      rader: [rad({ productId: "p1", reviewIdAE: "111", imageUrl: W("a") })],
      doda: [W("a")],
      ae: { p1: [] },
      fetchReviews: async () => ({ reviews: [], throttled: true }),
    });
    const s = await runImageRestore(d, OPTS);
    expect(s.strypta).toBe(1);
    expect(skrivna).toEqual([]);
  });
});
