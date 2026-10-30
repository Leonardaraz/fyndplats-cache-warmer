import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { StoredReview } from "@/lib/store/reviews";
import {
  artikelPerText,
  beslutFor,
  koptPerArtikel,
  korRecensionsartikel,
  produktensArtiklar,
  type RecensionsartikelDeps,
} from "./recensionsartikel";
import type { Avlasning } from "./lager";
import { testAvlasning } from "./testsida";

// Påhittade artikelnummer, id och texter.
const sku = (n: number) => `TESTSKURA${String(n).padStart(6, "0")}`;
const EGEN = "Stabil och lätt att montera, hjulen rullar fint.";
const ANNAN = "Den större modellen räcker till hela trädgården.";
const OKAND = "Bra köp, men vet inte vilken storlek det var.";

function rad(text: string, over: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "wix-1",
    reviewIdAE: `rid-${text.length}`,
    rating: 5,
    textOriginal: text,
    textSwedish: text,
    initials: "T.P.",
    status: "pending",
    source: "vevor",
    ...over,
  } as StoredReview;
}

const mappning = (n: number[], over: Partial<ProductMappingRecord> = {}): ProductMappingRecord =>
  ({
    supplier: "vevor",
    wixProductId: "wix-1",
    variants: n.map((k) => ({ supplierVariantId: sku(k) })),
    ...over,
  }) as unknown as ProductMappingRecord;

const recension = (text: string, artikel?: string | null) => ({ betyg: 5, text, datum: null, namn: null, artikel });

function fejk(opts: { rader?: StoredReview[]; avlasningar?: Avlasning[]; mappningar?: ProductMappingRecord[] } = {}) {
  const sparade: StoredReview[] = [];
  const avl = opts.avlasningar ?? [
    testAvlasning({
      sku: sku(1),
      recensioner: [recension(EGEN, sku(1)), recension(ANNAN, sku(2)), recension(OKAND, null)],
    }),
  ];
  const deps: RecensionsartikelDeps = {
    mappningar: async () => opts.mappningar ?? [mappning([1])],
    avlasningar: async (skus) => new Map(avl.filter((a) => skus.includes(a.sku)).map((a) => [a.sku, a])),
    recensioner: async () => opts.rader ?? [rad(EGEN), rad(ANNAN), rad(OKAND)],
    spara: async (r) => {
      sparade.push(r);
    },
  };
  return { deps, sparade };
}

describe("produktensArtiklar och artikelPerText", () => {
  it("produktens artiklar är varianternas och vevorArtiklar utan prefix", () => {
    expect([...produktensArtiklar(mappning([1], { vevorArtiklar: [`vevor:${sku(1)}`, `vevor:${sku(3)}`] }))]).toEqual([sku(1), sku(3)]);
  });

  it("☠️ två avläsningar som säger olika artikel om samma text ger null", () => {
    const a = testAvlasning({ sku: sku(1), recensioner: [recension(EGEN, sku(1))] });
    const b = testAvlasning({ sku: sku(2), recensioner: [recension(` ${EGEN.toUpperCase()} `, sku(2))] });
    expect(artikelPerText([a, b]).get(EGEN.toLowerCase())).toBeNull();
    expect(artikelPerText([a, a]).get(EGEN.toLowerCase())).toBe(sku(1));
  });
});

describe("beslutFor", () => {
  const perText = new Map<string, string | null>([
    [EGEN.toLowerCase(), sku(1)],
    [ANNAN.toLowerCase(), sku(2)],
    [OKAND.toLowerCase(), null],
  ]);
  const egna = new Set([sku(1)]);

  it("egen, dölj, okänd", () => {
    expect(beslutFor(rad(EGEN), egna, perText)).toBe("egen");
    expect(beslutFor(rad(ANNAN), egna, perText)).toBe("dolj");
    expect(beslutFor(rad(OKAND), egna, perText)).toBe("okand");
    expect(beslutFor(rad("En text som inte finns i avläsningen."), egna, perText)).toBe("okand");
  });

  it("☠️ en godkänd eller redigerad rad om en annan artikel rörs inte", () => {
    expect(beslutFor(rad(ANNAN, { status: "approved" }), egna, perText)).toBe("synlig_annan");
    expect(beslutFor(rad(ANNAN, { status: "edited" }), egna, perText)).toBe("synlig_annan");
  });

  it("☠️ bara rader verktyget själv dolt visas igen; en människas avvisning rörs aldrig", () => {
    const dold = rad(ANNAN, { status: "rejected", doldAv: "annan_artikel" });
    expect(beslutFor(dold, egna, perText)).toBe("redan_dold");
    expect(beslutFor(dold, new Set([sku(1), sku(2)]), perText)).toBe("visa");
    expect(beslutFor(rad(ANNAN, { status: "rejected" }), new Set([sku(1), sku(2)]), perText)).toBe("manniska");
    expect(beslutFor(rad(EGEN, { status: "rejected" }), egna, perText)).toBe("manniska");
  });
});

describe("korRecensionsartikel", () => {
  it("torrt: räknar och skriver ingenting", async () => {
    const f = fejk();
    const s = await korRecensionsartikel(f.deps, { dryRun: true, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ produkter: 1, rader: 3, egna: 1, attDolja: 1, dolda: 0, okanda: 1, kvarFran: null, idn: ["wix-1"] });
    expect(f.sparade).toEqual([]);
  });

  it("skarpt: döljer bara raden om en annan artikel, med samma text och betyg", async () => {
    const f = fejk();
    const s = await korRecensionsartikel(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ dolda: 1, attDolja: 1 });
    expect(f.sparade).toEqual([{ ...rad(ANNAN), status: "rejected", doldAv: "annan_artikel" }]);
  });

  it("en rad som blivit produktens egen när familjen vuxit visas igen, utan markeringen", async () => {
    const f = fejk({
      mappningar: [mappning([1], { vevorArtiklar: [`vevor:${sku(1)}`, `vevor:${sku(2)}`] })],
      rader: [rad(ANNAN, { status: "rejected", doldAv: "annan_artikel" })],
    });
    const s = await korRecensionsartikel(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ attVisa: 1, visade: 1 });
    expect(f.sparade).toEqual([rad(ANNAN, { status: "pending" })]);
    expect(f.sparade[0]).not.toHaveProperty("doldAv");
  });

  it("☠️ på en familj märks raderna om egna artiklar med varianten kunden köpte", async () => {
    const familj = mappning([1, 2], {
      variants: [
        { supplierVariantId: sku(1), choices: { Färg: "Svart", Material: "Stål" } },
        { supplierVariantId: sku(2), choices: { Färg: "Vit", Material: "Stål" } },
      ],
    } as unknown as Partial<ProductMappingRecord>);
    expect([...koptPerArtikel(familj)]).toEqual([
      [sku(1), "Svart"],
      [sku(2), "Vit"],
    ]);
    const f = fejk({ mappningar: [familj], rader: [rad(EGEN), rad(ANNAN, { kopt: "Vit" }), rad(OKAND)] });
    const s = await korRecensionsartikel(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    // EGEN gäller artikel 1 (Svart), ANNAN artikel 2 som redan är märkt.
    expect(s).toMatchObject({ egna: 2, attMarka: 1, markta: 1, attDolja: 0 });
    expect(f.sparade).toEqual([{ ...rad(EGEN), kopt: "Svart" }]);
    // En produkt med en artikel märks inte.
    expect(koptPerArtikel(mappning([1])).size).toBe(0);
  });

  it("☠️ en produkt vars avläsning är från före 2026-10-30 hoppas över", async () => {
    const f = fejk({ avlasningar: [testAvlasning({ sku: sku(1), recensioner: [{ betyg: 5, text: ANNAN, datum: null, namn: null }] })] });
    const s = await korRecensionsartikel(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ vantar: 1, rader: 0 });
    expect(f.sparade).toEqual([]);
  });

  it("andra källors rader rörs inte", async () => {
    const f = fejk({ rader: [rad(ANNAN, { source: "customer" }), rad(ANNAN, { source: "aosom" })] });
    const s = await korRecensionsartikel(f.deps, { dryRun: false, fran: 0, budgetMs: 60_000 });
    expect(s).toMatchObject({ rader: 0, dolda: 0 });
    expect(f.sparade).toEqual([]);
  });

  it("stannar på tidsbudgeten och säger var nästa körning börjar", async () => {
    let t = 0;
    const f = fejk({ mappningar: [mappning([1]), { ...mappning([1]), wixProductId: "wix-2" } as ProductMappingRecord] });
    const s = await korRecensionsartikel(
      { ...f.deps, klocka: () => (t += 40_000) },
      { dryRun: true, fran: 0, budgetMs: 60_000 },
    );
    expect(s).toMatchObject({ granskade: 1, kvarFran: 1 });
  });

  it("☠️ svaret bär inga artikelnummer eller texter", async () => {
    const f = fejk();
    const s = await korRecensionsartikel(f.deps, { dryRun: true, fran: 0, budgetMs: 60_000 });
    const json = JSON.stringify(s);
    expect(json).not.toContain("TESTSKU");
    expect(json).not.toContain("trädgården");
  });
});
