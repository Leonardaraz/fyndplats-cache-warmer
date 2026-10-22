// Danskt sortiment och pris. Alla artikelnummer, belopp och kurser här är
// påhittade.

import { describe, expect, it } from "vitest";
import { computePriceWithRules } from "../import/pricing";
import type { PricingRules } from "../import/types";
import type { ProductMappingRecord } from "../store";
import { MIN_WIX_PRODUKTER, type V3ProduktInfo } from "../wix/v3-products";
import type { AosomRow } from "./feed";
import { UnderlagetOfullstandigt } from "./frakt-per-land";
import {
  arSaljland,
  matLandsortiment,
  regelprisILand,
  regelprisSverige,
  type LandsortimentDeps,
} from "./landsortiment";
import { MIN_FEED_RADER } from "./sync";

const REGLER: PricingRules = {
  usdToSek: 10.5,
  vatRatePercent: 25,
  defaultMultiplier: 1.2,
  fixedSurchargeSek: 0,
  categoryMultipliers: {},
  tiersEnabled: false,
  tiers: [],
  rounding: "charm99",
};
const KURSER = { eurToSek: 11, eurToLokal: 7.5 };

function rad(
  sku: string,
  inkop: number | null,
  frakt: Record<string, number | null>,
  over: Partial<AosomRow> = {},
): AosomRow {
  return {
    sku,
    name: "Gartenbank aus Holz",
    url: "",
    imageUrls: [],
    category: "Garten > Gartenmöbel",
    color: "",
    material: "",
    size: "",
    packageSize: "",
    weightKg: null,
    descriptionHtml: "<p>Stabile Bank aus Holz.</p>",
    bulletsHtml: "",
    qty: 5,
    normalPriceEur: null,
    wholesaleEur: inkop,
    seFreightEur: frakt.SE ?? null,
    rowIndex: 1,
    fraktPerLand: frakt,
    ...over,
  };
}

describe("regelprisSverige", () => {
  it("är synkens regelpris: landad kostnad inklusive moms genom computePriceWithRules", () => {
    const r = rad("TEST-0001", 100, { SE: 20, DK: 10 });
    // 120 € × 11 × 1,25 = 1 650 kr. × 1,2 = 1 980, charm99 → 1 999.
    expect(regelprisSverige(r, REGLER, 11)).toBe(1999);
    expect(regelprisSverige(r, REGLER, 11)).toBe(computePriceWithRules(1650 / 10.5, REGLER, null).grossSek);
  });

  it("null utan inköpspris eller utan verklig frakt hit", () => {
    expect(regelprisSverige(rad("TEST-0001", null, { SE: 20 }), REGLER, 11)).toBeNull();
    expect(regelprisSverige(rad("TEST-0001", 100, { SE: 999.9 }), REGLER, 11)).toBeNull();
  });
});

describe("regelprisILand", () => {
  it("räknar inköp plus frakten dit, landets moms, multiplikatorn och samma avrundning", () => {
    // 110 € × 7,5 × 1,25 = 1 031,25 kr. × 1,2 = 1 237,50, charm99 → 1 239.
    expect(regelprisILand(rad("TEST-0001", 100, { SE: 20, DK: 10 }), "DK", REGLER, KURSER)).toBe(1239);
  });

  it("samma frakt och samma kurs ger exakt det svenska regelpriset", () => {
    const r = rad("TEST-0001", 87.5, { SE: 31.2, DK: 31.2 });
    expect(regelprisILand(r, "DK", REGLER, { eurToSek: 11, eurToLokal: 11 })).toBe(regelprisSverige(r, REGLER, 11));
  });

  it("det fasta påslaget räknas om till landets valuta", () => {
    const medPaslag = { ...REGLER, fixedSurchargeSek: 110 };
    // 1 031,25 × 1,2 + 110 × 7,5 / 11 = 1 312,50, charm99 → 1 319.
    expect(regelprisILand(rad("TEST-0001", 100, { SE: 20, DK: 10 }), "DK", medPaslag, KURSER)).toBe(1319);
  });

  it("null utan inköpspris eller utan verklig frakt dit", () => {
    expect(regelprisILand(rad("TEST-0001", 0, { SE: 20, DK: 10 }), "DK", REGLER, KURSER)).toBeNull();
    expect(regelprisILand(rad("TEST-0001", 100, { SE: 20, DK: 999.9 }), "DK", REGLER, KURSER)).toBeNull();
    expect(regelprisILand(rad("TEST-0001", 100, { SE: 20, DK: null }), "DK", REGLER, KURSER)).toBeNull();
  });
});

describe("arSaljland", () => {
  it("bara Danmark tills ett land i euro har en egen avrundning", () => {
    expect(arSaljland("DK")).toBe(true);
    expect(arSaljland("FI")).toBe(false);
    expect(arSaljland(undefined)).toBe(false);
  });
});

function mappning(over: Partial<ProductMappingRecord>): ProductMappingRecord {
  return {
    wixProductId: "wix-1",
    supplierProductId: "aosom:TEST-0001",
    variants: [],
    ...over,
  } as ProductMappingRecord;
}

/** Feeden: de namngivna raderna först, sedan utfyllnad till spärrens gräns. */
function flode(...rader: AosomRow[]): AosomRow[] {
  const ut = [...rader];
  for (let i = 0; ut.length < MIN_FEED_RADER; i++) {
    ut.push(rad(`FYLL-${String(i).padStart(4, "0")}`, 50, { SE: 10, DK: 8 }));
  }
  return ut;
}

/** Katalogen: de namngivna produkterna, sedan synlig utfyllnad. */
function katalog(produkter: Record<string, Partial<V3ProduktInfo>>): Map<string, V3ProduktInfo> {
  const ut = new Map<string, V3ProduktInfo>();
  for (const [id, p] of Object.entries(produkter)) {
    ut.set(id, { namn: "Trädgårdsbänk", slug: id, visible: true, ...p });
  }
  for (let i = 0; [...ut.values()].filter((p) => p.visible).length < MIN_WIX_PRODUKTER; i++) {
    ut.set(`fyll-${i}`, { namn: "Annan", slug: `fyll-${i}`, visible: true });
  }
  return ut;
}

function deps(over: Partial<LandsortimentDeps> = {}): LandsortimentDeps {
  return {
    hamtaFlodet: async () => flode(rad("TEST-0001", 100, { SE: 20, DK: 10 })),
    listaMappningar: async () => [mappning({ wixProductId: "wix-1", supplierProductId: "aosom:TEST-0001" })],
    listaProdukter: async () => katalog({ "wix-1": {} }),
    regler: async () => REGLER,
    kurser: KURSER,
    ...over,
  };
}

describe("matLandsortiment", () => {
  it("en vanlig sida utan el som går att skicka dit kan säljas, med pris i kronor och kvot mot Sverige", async () => {
    const { sammanfattning: s, lista } = await matLandsortiment("DK", deps());
    expect(s).toMatchObject({ land: "DK", landnamn: "Danmark", valuta: "DKK", kurser: KURSER });
    expect(s.regel).toEqual({ multiplikator: 1.2, avrundning: "charm99" });
    expect(s.sidor).toMatchObject({ publicerade: 1, aosom: 1, ok: 1, utesluten: 0 });
    expect(s.artiklar).toEqual({ ok: 1, slutHosAosom: 0 });
    // 1 239 DKK × 11 / 7,5 = 1 817,20 kr mot 1 999 → 0,909.
    expect(lista).toEqual([
      {
        wixProductId: "wix-1",
        namn: "Trädgårdsbänk",
        slug: "wix-1",
        ok: true,
        skal: [],
        signaler: [],
        artiklar: [{ variant: null, iLager: true, prisLokal: 1239, regelprisSek: 1999, kvot: 0.909 }],
      },
    ]);
    expect(s.priser).toEqual({ jamforda: 1, kvotMedian: 0.91, kvotP25: 0.91, kvotP75: 0.91, lagreAnSverigePct: 100 });
  });

  it("varje skäl utesluter sidan och räknas för sig", async () => {
    const svar = await matLandsortiment(
      "DK",
      deps({
        hamtaFlodet: async () =>
          flode(
            rad("TEST-0002", 100, { SE: 20, DK: 999.9 }),
            rad("TEST-0003", 10, { SE: 20, DK: 15 }),
            rad("TEST-0004", null, { SE: 20, DK: 10 }),
            rad("TEST-0005", 100, { SE: 20, DK: 10 }, { name: "TV-Schrank mit LED-Beleuchtung" }),
          ),
        listaMappningar: async () => [
          mappning({ wixProductId: "ej-skeppbar", supplierProductId: "aosom:TEST-0002" }),
          mappning({ wixProductId: "frakttung", supplierProductId: "aosom:TEST-0003" }),
          mappning({ wixProductId: "utan-inkop", supplierProductId: "aosom:TEST-0004" }),
          mappning({ wixProductId: "led", supplierProductId: "aosom:TEST-0005" }),
          mappning({ wixProductId: "saknas", supplierProductId: "aosom:TEST-9999" }),
        ],
        listaProdukter: async () =>
          katalog({ "ej-skeppbar": {}, frakttung: {}, "utan-inkop": {}, led: {}, saknas: {} }),
      }),
    );
    const skal = Object.fromEntries(svar.lista.map((r) => [r.wixProductId, r.skal]));
    expect(skal).toEqual({
      "ej-skeppbar": ["ej_skeppbar"],
      frakttung: ["frakttung"],
      "utan-inkop": ["utan_inkopspris"],
      led: ["el_eller_batteri"],
      saknas: ["saknas_i_flodet"],
    });
    expect(svar.sammanfattning.sidor).toMatchObject({ aosom: 5, ok: 0, utesluten: 5 });
    expect(svar.sammanfattning.sidor.perSkal).toMatchObject({
      ej_skeppbar: 1,
      frakttung: 1,
      utan_inkopspris: 1,
      el_eller_batteri: 1,
      saknas_i_flodet: 1,
      tvetydig: 0,
    });
    expect(svar.lista.find((r) => r.wixProductId === "led")?.signaler).toEqual(["LED", "Belysning"]);
    expect(svar.sammanfattning.signaler.perOrd).toMatchObject({ LED: 1, Belysning: 1, Akku: 0 });
    expect(svar.sammanfattning.signaler.perGrupp).toMatchObject({ ljus: 1, batteri: 0 });
    // Uteslutna sidor räknas inte in i priserna.
    expect(svar.sammanfattning.priser.jamforda).toBe(0);
    expect(svar.sammanfattning.priser.kvotMedian).toBeNull();
  });

  it("vårt svenska namn räcker för att stoppa en sida, även när Aosoms text är tom på el", async () => {
    const { lista } = await matLandsortiment(
      "DK",
      deps({ listaProdukter: async () => katalog({ "wix-1": { namn: "Barnbil med batteri och fjärrkontroll" } }) }),
    );
    expect(lista[0]).toMatchObject({ ok: false, skal: ["el_eller_batteri"], signaler: ["Batteri", "Fjärrkontroll"] });
  });

  it("en sammanslagen sida stoppas helt av en färg med el, och listan bär Wix-varianterna", async () => {
    const sammanslagen = mappning({
      wixProductId: "wix-1",
      supplierProductId: "aosom:TEST-0001",
      variants: [
        { wixVariantId: "v1", supplierVariantId: "TEST-0001" },
        { wixVariantId: "v2", supplierVariantId: "TEST-0006" },
      ] as ProductMappingRecord["variants"],
    });
    const { lista, sammanfattning } = await matLandsortiment(
      "DK",
      deps({
        hamtaFlodet: async () =>
          flode(
            rad("TEST-0001", 100, { SE: 20, DK: 10 }),
            rad("TEST-0006", 100, { SE: 20, DK: 10 }, { bulletsHtml: "<li>Mit Akku</li>", qty: 0 }),
          ),
        listaMappningar: async () => [sammanslagen],
      }),
    );
    expect(lista[0].ok).toBe(false);
    expect(lista[0].signaler).toEqual(["Akku"]);
    expect(lista[0].artiklar.map((a) => [a.variant, a.iLager])).toEqual([["v1", true], ["v2", false]]);
    expect(sammanfattning.artiklar).toEqual({ ok: 0, slutHosAosom: 0 });
  });

  it("en sammanslagen sida utan el kan säljas, med ett pris per färg", async () => {
    const sammanslagen = mappning({
      wixProductId: "wix-1",
      supplierProductId: "aosom:TEST-0001",
      variants: [
        { wixVariantId: "v1", supplierVariantId: "TEST-0001" },
        { wixVariantId: "v2", supplierVariantId: "TEST-0007" },
      ] as ProductMappingRecord["variants"],
    });
    const { lista, sammanfattning } = await matLandsortiment(
      "DK",
      deps({
        hamtaFlodet: async () =>
          flode(rad("TEST-0001", 100, { SE: 20, DK: 10 }), rad("TEST-0007", 200, { SE: 30, DK: 20 }, { qty: 0 })),
        listaMappningar: async () => [sammanslagen],
      }),
    );
    expect(lista[0].ok).toBe(true);
    expect(lista[0].artiklar.map((a) => a.prisLokal)).toEqual([1239, regelprisILand(rad("X", 200, { DK: 20 }), "DK", REGLER, KURSER)]);
    expect(sammanfattning.artiklar).toEqual({ ok: 2, slutHosAosom: 1 });
    expect(sammanfattning.priser.jamforda).toBe(2);
  });

  it("en tvetydig sida stoppas utan att någon artikel gissas", async () => {
    const tvetydig = mappning({
      wixProductId: "wix-1",
      supplierProductId: "aosom:TEST-0001",
      variants: [
        { wixVariantId: "v1", supplierVariantId: "TEST-0001" },
        { wixVariantId: "", supplierVariantId: "TEST-0008" },
      ] as ProductMappingRecord["variants"],
    });
    const { lista } = await matLandsortiment("DK", deps({ listaMappningar: async () => [tvetydig] }));
    expect(lista[0]).toMatchObject({ ok: false, skal: ["tvetydig"], artiklar: [] });
  });

  it("bara Aosom går vidare: AliExpress och VEVOR räknas per leverantör men står inte i listan", async () => {
    const { sammanfattning, lista } = await matLandsortiment(
      "DK",
      deps({
        listaMappningar: async () => [
          mappning({ wixProductId: "wix-1", supplierProductId: "aosom:TEST-0001" }),
          mappning({ wixProductId: "ae", supplierProductId: "1005000000000001" }),
          mappning({ wixProductId: "vevor", supplierProductId: "vevor:TEST-VEVOR", supplier: "vevor" }),
        ],
        listaProdukter: async () => katalog({ "wix-1": {}, ae: {}, vevor: {} }),
      }),
    );
    expect(sammanfattning.sidor.perLeverantor).toEqual({ aliexpress: 1, aosom: 1, vevor: 1, okand: 0 });
    expect(sammanfattning.sidor).toMatchObject({ publicerade: 3, aosom: 1 });
    expect(lista.map((r) => r.wixProductId)).toEqual(["wix-1"]);
  });

  it("dolda sidor räknas inte, och en sida med två mappningsrader räknas en gång", async () => {
    const { sammanfattning, lista } = await matLandsortiment(
      "DK",
      deps({
        listaMappningar: async () => [
          mappning({ wixProductId: "wix-1", supplierProductId: "aosom:TEST-0001" }),
          mappning({ wixProductId: "wix-1", supplierProductId: "aosom:TEST-0001" }),
          mappning({ wixProductId: "dold", supplierProductId: "aosom:TEST-0001" }),
        ],
        listaProdukter: async () => katalog({ "wix-1": {}, dold: { visible: false } }),
      }),
    );
    expect(sammanfattning.sidor.publicerade).toBe(1);
    expect(sammanfattning.underlag.dubbelmappade).toBe(1);
    expect(lista).toHaveLength(1);
  });

  it("☠️ svaret bär varken artikelnummer, inköpspris eller frakt", async () => {
    const svar = await matLandsortiment(
      "DK",
      deps({
        hamtaFlodet: async () => flode(rad("TEST-0001", 123.45, { SE: 21.37, DK: 17.89 })),
      }),
    );
    const text = JSON.stringify(svar);
    expect(text).not.toMatch(/TEST-0001|aosom:/);
    expect(text).not.toMatch(/123\.45|21\.37|17\.89/);
  });

  it("☠️ en halvläst feed eller butik är inget sortiment", async () => {
    await expect(matLandsortiment("DK", deps({ hamtaFlodet: async () => [rad("TEST-0001", 100, { SE: 20, DK: 10 })] })))
      .rejects.toBeInstanceOf(UnderlagetOfullstandigt);
    await expect(
      matLandsortiment("DK", deps({ listaProdukter: async () => new Map([["wix-1", { namn: "", slug: "", visible: true }]]) })),
    ).rejects.toBeInstanceOf(UnderlagetOfullstandigt);
  });

  it("☠️ en feed utan landets fraktkolumn är inget sortiment", async () => {
    const utanDk = flode().map((r) => ({ ...r, fraktPerLand: { SE: 10 } }));
    await expect(matLandsortiment("DK", deps({ hamtaFlodet: async () => utanDk })))
      .rejects.toBeInstanceOf(UnderlagetOfullstandigt);
  });

  it("sidorna som kan säljas kommer först, båda delarna i namnordning", async () => {
    const { lista } = await matLandsortiment(
      "DK",
      deps({
        hamtaFlodet: async () =>
          flode(rad("TEST-0001", 100, { SE: 20, DK: 10 }), rad("TEST-0002", 100, { SE: 20, DK: 999.9 })),
        listaMappningar: async () => [
          mappning({ wixProductId: "b", supplierProductId: "aosom:TEST-0001" }),
          mappning({ wixProductId: "a", supplierProductId: "aosom:TEST-0002" }),
          mappning({ wixProductId: "c", supplierProductId: "aosom:TEST-0001" }),
        ],
        listaProdukter: async () => katalog({ a: { namn: "Äppelkorg" }, b: { namn: "Örngott" }, c: { namn: "Bänk" } }),
      }),
    );
    expect(lista.map((r) => r.namn)).toEqual(["Bänk", "Örngott", "Äppelkorg"]);
  });
});
