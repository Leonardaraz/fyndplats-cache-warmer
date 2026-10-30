import { describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { StoredReview } from "@/lib/store/reviews";
import { reviewImages } from "@/lib/reviews/images";
import { fotonPerText, korRecensionsfoton, vevorKundbild, type RecensionsfotoDeps } from "./recensionsfoton";
import type { Avlasning } from "./lager";
import { testAvlasning } from "./testsida";

// Påhittade artikelnummer, id och adresser.
const sku = (n: number) => `TESTSKURF${String(n).padStart(6, "0")}`;
const FOTO = (n: number) => `https://adsimg-custom.vevorstatic.com/upload/vevor/review/20261001/testfoto${n}.jpeg?format=webp`;
const TEXT = "Stabil och lätt att montera,\nhjulen rullar fint.";

function rad(over: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "wix-1",
    reviewIdAE: "rid-1",
    rating: 5,
    textOriginal: "Stabil och lätt att montera, hjulen rullar fint.",
    textSwedish: "Stabil och lätt att montera, hjulen rullar fint.",
    initials: "T.P.",
    status: "pending",
    source: "vevor",
    ...over,
  } as StoredReview;
}

const mappning = (n: number[]): ProductMappingRecord =>
  ({ supplier: "vevor", wixProductId: "wix-1", variants: n.map((k) => ({ supplierVariantId: sku(k) })) }) as unknown as ProductMappingRecord;

function fejk(opts: { rader?: StoredReview[]; avlasningar?: Avlasning[]; laddaUpp?: RecensionsfotoDeps["laddaUpp"] } = {}) {
  const sparade: StoredReview[] = [];
  const avl =
    opts.avlasningar ??
    [testAvlasning({ sku: sku(1), recensioner: [{ betyg: 5, text: TEXT, datum: null, namn: null, bilder: [FOTO(1), FOTO(2)] }] })];
  const deps: RecensionsfotoDeps = {
    mappningar: async () => [mappning([1])],
    avlasningar: async (skus) => new Map(avl.filter((a) => skus.includes(a.sku)).map((a) => [a.sku, a])),
    recensioner: async () => opts.rader ?? [rad()],
    spara: async (r) => {
      sparade.push(r);
    },
    laddaUpp: opts.laddaUpp ?? (async (_k, namn) => `https://static.wixstatic.com/media/${namn}.jpg`),
  };
  return { deps, sparade };
}

describe("korRecensionsfoton", () => {
  it("torrt: räknar raderna som får foton och skriver ingenting", async () => {
    const f = fejk();
    const s = await korRecensionsfoton(f.deps, { dryRun: true, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ produkter: 1, medFoton: 1, attRatta: 1, fotonAttHamta: 2, rattade: 0, kvarFran: null, idn: ["wix-1"] });
    expect(f.sparade).toEqual([]);
  });

  it("skarpt: raden får fotona i Wix, och resten av raden är orörd", async () => {
    const f = fejk();
    const s = await korRecensionsfoton(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ rattade: 1, fotonUppladdade: 2, fotoMissar: 0 });
    expect(f.sparade).toHaveLength(1);
    const ny = f.sparade[0];
    expect(reviewImages(ny)).toEqual([
      "https://static.wixstatic.com/media/rid-1.jpg",
      "https://static.wixstatic.com/media/rid-1-2.jpg",
    ]);
    expect({ ...ny, imageUrl: undefined, imageUrls: undefined, hasImage: undefined }).toMatchObject({
      status: "pending",
      textSwedish: rad().textSwedish,
      reviewIdAE: "rid-1",
    });
  });

  it("☠️ en rad som redan har foton rörs inte, och en körning till skriver ingenting", async () => {
    const f = fejk({ rader: [rad({ imageUrl: "https://static.wixstatic.com/media/x.jpg", imageUrls: ["https://static.wixstatic.com/media/x.jpg"], hasImage: true })] });
    const s = await korRecensionsfoton(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ redanMedFoton: 1, attRatta: 0, rattade: 0 });
    expect(f.sparade).toEqual([]);
  });

  it("☠️ ett foto som inte kom upp: raden skrivs bara med de som kom, och ingen kom = ingen skrivning", async () => {
    const halv = fejk({ laddaUpp: async (k, n) => (k === FOTO(1) ? `https://static.wixstatic.com/media/${n}.jpg` : undefined) });
    const s1 = await korRecensionsfoton(halv.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s1).toMatchObject({ rattade: 1, fotonUppladdade: 1, fotoMissar: 1 });
    expect(reviewImages(halv.sparade[0])).toHaveLength(1);

    const ingen = fejk({ laddaUpp: async () => undefined });
    const s2 = await korRecensionsfoton(ingen.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s2).toMatchObject({ rattade: 0, fotoMissar: 2 });
    expect(ingen.sparade).toEqual([]);
  });

  it("en recension med foton utan rad räknas, och en annan rad får inga foton", async () => {
    const f = fejk({ rader: [rad({ textOriginal: "En helt annan recension." })] });
    const s = await korRecensionsfoton(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ utanRad: 1, attRatta: 0, rattade: 0 });
    expect(f.sparade).toEqual([]);
  });

  it("☠️ svaret bär inga adresser och ingen recensionstext", async () => {
    const f = fejk();
    const s = await korRecensionsfoton(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    const text = JSON.stringify(s);
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toContain("montera");
    expect(text).not.toContain(sku(1));
  });

  it("stannar på tidsbudgeten och säger var nästa körning börjar", async () => {
    const f = fejk();
    f.deps.mappningar = async () => [mappning([1]), mappning([1])];
    let t = 0;
    f.deps.klocka = () => (t += 100);
    const s = await korRecensionsfoton(f.deps, { dryRun: true, fran: 0, budgetMs: 150 });
    expect(s.granskade).toBe(1);
    expect(s.kvarFran).toBe(1);
  });
});

describe("fotonPerText", () => {
  it("nyckeln struntar i radbrytningar och versaler, och tar högst tre foton", () => {
    const a = testAvlasning({ recensioner: [{ betyg: 5, text: "Bra\nVARA", datum: null, namn: null, bilder: [FOTO(1), FOTO(2), FOTO(3), FOTO(4)] }] });
    expect(fotonPerText([a]).get("bra vara")).toEqual([FOTO(1), FOTO(2), FOTO(3)]);
  });
});

describe("vevorKundbild", () => {
  it("☠️ hämtar bara från VEVOR:s fotoserver", async () => {
    const f = vi.fn();
    expect(await vevorKundbild("https://example.test/foto.jpg", "x", { fetch: f as unknown as typeof fetch })).toBeUndefined();
    expect(await vevorKundbild(undefined, "x", { fetch: f as unknown as typeof fetch })).toBeUndefined();
    expect(f).not.toHaveBeenCalled();
  });
});
