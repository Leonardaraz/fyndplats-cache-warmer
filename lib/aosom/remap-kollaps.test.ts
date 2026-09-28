import { describe, it, expect } from "vitest";
import {
  arKollapsad,
  kollapsaMappning,
  kollapsaWix,
  planeraKollaps,
} from "./remap-kollaps";
import type { ProductMappingRecord } from "../store";
import type { WixAnrop } from "../polish/skrivplan";

type Obj = Record<string, unknown>;

function variant(id: string, val: Record<string, string>, pris = "799"): Obj {
  return {
    id,
    visible: true,
    sku: `FP-tak-${id}`,
    price: { actualPrice: { amount: pris } },
    choices: Object.entries(val).map(([optionName, choiceName]) => ({
      optionChoiceNames: { optionName, choiceName, renderType: "TEXT_CHOICES" },
    })),
    physicalProperties: {},
    inventoryStatus: { inStock: true },
  };
}

/** Reservtaket fc5e7fde i liten skala: tre färger, en bild kopplad per färg. */
function taket(over: Obj = {}): Obj {
  return {
    id: "tak",
    revision: "14",
    visible: true,
    options: [
      {
        id: "opt-farg",
        name: "Färg",
        choicesSettings: {
          choices: [
            { choiceId: "c1", name: "Orange", linkedMedia: [{ id: "bild-orange" }] },
            { choiceId: "c2", name: "Ljusgrå", linkedMedia: [{ id: "bild-gra" }] },
            { choiceId: "c3", name: "Grön", linkedMedia: [{ id: "bild-gron" }] },
          ],
        },
      },
    ],
    variantsInfo: {
      variants: [
        variant("v-orange", { Färg: "Orange" }),
        variant("v-gra", { Färg: "Ljusgrå" }),
        variant("v-gron", { Färg: "Grön" }),
      ],
    },
    ...over,
  };
}

function mappning(): ProductMappingRecord {
  const v = (id: string, farg: string, gross: number) => ({
    supplierVariantId: `ae-${id}`,
    sku: `FP-tak-${id}`,
    wixVariantId: id,
    choices: { Färg: farg },
    costUsd: 40,
    landedCostSek: 420,
    grossSek: gross,
  });
  return {
    supplierProductId: "1005001234567890",
    wixProductId: "tak",
    draftStatus: "published",
    variants: [v("v-orange", "Orange", 799), v("v-gra", "Ljusgrå", 799), v("v-gron", "Grön", 799)],
  } as ProductMappingRecord;
}

/**
 * En Wix som håller EN produkt i minnet. En PATCH utan `visible` gör
 * produkten synlig, som skarpa V3 gör (varianter.md, "Kollapsen flippar
 * `visible` till `true`").
 */
function falskWix(start: Obj, opts: { ignoreraPatch?: boolean } = {}) {
  let produkt = structuredClone(start);
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "GET") return { product: structuredClone(produkt) };
    if (metod === "PATCH" && !opts.ignoreraPatch) {
      const p = (kropp as { product: Obj }).product;
      produkt = {
        ...produkt,
        options: p.options,
        variantsInfo: p.variantsInfo,
        visible: "visible" in p ? p.visible : true,
        revision: String(Number(produkt.revision) + 1),
      };
    }
    return {};
  };
  return { wix, anrop, nu: () => produkt };
}

const ingenPaus = async () => {};

describe("planeraKollaps", () => {
  it("listar de borttagna varianterna och den behållna, med namn och id", () => {
    const p = planeraKollaps({ produkt: taket(), mappning: mappning(), behallVariant: "v-gron", oppnaOrdrar: 0 });
    expect(p.hinder).toEqual([]);
    expect(p.behallVal).toEqual(["Grön"]);
    expect(p.borttagna).toEqual([
      { wixVariantId: "v-orange", val: ["Orange"] },
      { wixVariantId: "v-gra", val: ["Ljusgrå"] },
    ]);
    expect(p.mappningsvarianterBort).toBe(2);
    expect(p.wixKlar).toBe(false);
  });

  it("räknar bilderna som var kopplade till ett borttaget val, inte den behållnas", () => {
    const p = planeraKollaps({ produkt: taket(), mappning: mappning(), behallVariant: "v-gron", oppnaOrdrar: 0 });
    expect(p.bilderMedBorttagnaVal.sort()).toEqual(["bild-gra", "bild-orange"]);
  });

  it("☠️ ett val den behållna varianten också bär räknas inte som borttaget", () => {
    // Färg × Storlek: den borttagna varianten delar färgen med den behållna.
    // Grön-bilden visar det som finns kvar.
    const produkt = taket({
      options: [
        {
          name: "Färg",
          choicesSettings: { choices: [{ name: "Grön", linkedMedia: [{ id: "bild-gron" }] }] },
        },
        {
          name: "Storlek",
          choicesSettings: {
            choices: [
              { name: "300", linkedMedia: [] },
              { name: "200", linkedMedia: [{ id: "bild-200" }] },
            ],
          },
        },
      ],
      variantsInfo: {
        variants: [
          variant("v-300", { Färg: "Grön", Storlek: "300" }),
          variant("v-200", { Färg: "Grön", Storlek: "200" }),
        ],
      },
    });
    const p = planeraKollaps({ produkt, mappning: null, behallVariant: "v-300", oppnaOrdrar: 0 });
    expect(p.bilderMedBorttagnaVal).toEqual(["bild-200"]);
    expect(p.borttagna).toEqual([{ wixVariantId: "v-200", val: ["Grön", "200"] }]);
  });

  it("☠️ vägrar när sidan har obehandlade ordrar — de hade beställts i fel färg", () => {
    const p = planeraKollaps({ produkt: taket(), mappning: mappning(), behallVariant: "v-gron", oppnaOrdrar: 1 });
    expect(p.hinder).toContain("oppna_ordrar");
  });

  it("vägrar ett variant-id som inte finns i Wix", () => {
    const p = planeraKollaps({ produkt: taket(), mappning: mappning(), behallVariant: "v-lila", oppnaOrdrar: 0 });
    expect(p.hinder).toContain("varianten_saknas_i_wix");
  });

  it("vägrar när produkten inte gick att läsa", () => {
    const p = planeraKollaps({ produkt: null, mappning: mappning(), behallVariant: "v-gron", oppnaOrdrar: 0 });
    expect(p.hinder).toContain("produkten_saknas");
  });

  it("ser en omkörning: Wix redan kollapsad till varianten", () => {
    const klar = taket({ options: [], variantsInfo: { variants: [{ ...variant("v-gron", {}), choices: [] }] } });
    expect(arKollapsad(klar, "v-gron")).toBe(true);
    const p = planeraKollaps({ produkt: klar, mappning: mappning(), behallVariant: "v-gron", oppnaOrdrar: 0 });
    expect(p.hinder).toEqual([]);
    expect(p.wixKlar).toBe(true);
    expect(p.borttagna).toEqual([]);
    // Mappningen är inte klar förrän den också har en variant.
    expect(p.mappningsvarianterBort).toBe(2);
  });
});

describe("kollapsaMappning", () => {
  it("behåller bara varianten med det Wix-variant-id:t, utan val", () => {
    const m = kollapsaMappning(mappning(), "v-gron");
    expect(m.variants).toHaveLength(1);
    expect(m.variants[0].wixVariantId).toBe("v-gron");
    expect(m.variants[0].sku).toBe("FP-tak-v-gron");
    expect(m.variants[0].choices).toEqual({});
    expect(m.draftStatus).toBe("published");
  });

  it("☠️ gissar aldrig: ett id som inte finns kastar", () => {
    expect(() => kollapsaMappning(mappning(), "v-lila")).toThrow();
  });
});

describe("kollapsaWix", () => {
  it("skickar den behållna varianten ur GET:en med samma id och utan val", async () => {
    const f = falskWix(taket());
    const ut = await kollapsaWix(f.wix, "tak", "v-gron", { vanta: ingenPaus, kostnadSek: 519.2 });
    expect(ut.ok).toBe(true);

    const patch = f.anrop.filter((a) => a.metod === "PATCH");
    expect(patch).toHaveLength(1);
    const kropp = patch[0].kropp as { product: Obj; fieldMask: { paths: string[] } };
    expect(kropp.product.options).toEqual([]);
    const varianter = (kropp.product.variantsInfo as { variants: Obj[] }).variants;
    expect(varianter).toHaveLength(1);
    expect(varianter[0].id).toBe("v-gron");
    expect(varianter[0].choices).toEqual([]);
    expect(varianter[0].sku).toBe("FP-tak-v-gron");
    expect(varianter[0].price).toEqual({ actualPrice: { amount: "799" } });
    // Fält Wix skickade och som vi inte rör följer med oförändrade.
    expect(varianter[0].inventoryStatus).toEqual({ inStock: true });
    expect(varianter[0].revenueDetails).toEqual({ cost: { amount: "519.20" } });
    expect(kropp.product.revision).toBe("14");
    expect(kropp.fieldMask.paths).toEqual(expect.arrayContaining(["options", "variantsInfo", "visible"]));

    const efter = f.nu();
    expect(arKollapsad(efter, "v-gron")).toBe(true);
  });

  it("☠️ skickar tillbaka `visible` oförändrad — ett utkast förblir ett utkast", async () => {
    const f = falskWix(taket({ visible: false }));
    const ut = await kollapsaWix(f.wix, "tak", "v-gron", { vanta: ingenPaus });
    expect(ut.ok).toBe(true);
    expect(f.nu().visible).toBe(false);
    const kropp = f.anrop.find((a) => a.metod === "PATCH")!.kropp as { product: Obj };
    expect(kropp.product.visible).toBe(false);
  });

  it("☠️ ett svar utan fel är inget kvitto: en PATCH som inte tog ger ok: false", async () => {
    const f = falskWix(taket(), { ignoreraPatch: true });
    let pauser = 0;
    const ut = await kollapsaWix(f.wix, "tak", "v-gron", {
      vanta: async () => { pauser++; },
      forsok: 3,
    });
    expect(ut.ok).toBe(false);
    expect(ut.skal).toContain("valen finns kvar");
    expect(ut.skal).toContain("produkten har 3 varianter, inte en");
    expect(pauser).toBe(2);
  });

  it("väntar ut en läsning som släpar", async () => {
    const f = falskWix(taket());
    // Första läsningen (före PATCH) är färsk. Nästa visar produkten som den
    // var före skrivningen, som skarpa V3 ibland gör, och den tredje är rätt.
    const orig = f.wix;
    let lasningar = 0;
    const wix: WixAnrop = async (metod, sokvag, kropp) => {
      if (metod === "GET") {
        lasningar++;
        if (lasningar === 2) return { product: taket() };
      }
      return orig(metod, sokvag, kropp);
    };
    const ut = await kollapsaWix(wix, "tak", "v-gron", { vanta: ingenPaus });
    expect(ut.ok).toBe(true);
    expect(lasningar).toBe(3);
  });

  it("gör ingenting när Wix redan är kollapsad (omkörning)", async () => {
    const klar = taket({ options: [], variantsInfo: { variants: [{ ...variant("v-gron", {}), choices: [] }] } });
    const f = falskWix(klar);
    const ut = await kollapsaWix(f.wix, "tak", "v-gron", { vanta: ingenPaus });
    expect(ut).toEqual({ ok: true, skal: [], steg: ["wix redan kollapsad"] });
    expect(f.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });

  it("skriver ingenting när varianten saknas i Wix", async () => {
    const f = falskWix(taket());
    const ut = await kollapsaWix(f.wix, "tak", "v-lila", { vanta: ingenPaus });
    expect(ut.ok).toBe(false);
    expect(f.anrop.some((a) => a.metod === "PATCH")).toBe(false);
  });
});
