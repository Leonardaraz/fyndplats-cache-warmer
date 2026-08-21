// DS-räddningen i extension/background.js — utlösaren OCH själva bytet.
//
// Bakgrund (Leonards rapport 2026-08-20): agent- och bulk-importer gav alla
// varianter samma inköpspris. Räddningen fanns, men var gatad på
// `!product.extractionOk` — och extractionOk är `titel && bilder && pris`.
// En DOM-fallback med titel, bild och ETT pris räknades som "bra data".
//
// Testet läser den RIKTIGA källkoden och KÖR funktionerna (background.js är en
// service worker utan exporter, så den kan inte importeras — den plockas ut med
// regex och körs med new Function). Grep-assertions ensamma räcker inte: de
// gröna genom vilken omskrivning som helst som råkar behålla ordvalen.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const KÄLLA = readFileSync(join(process.cwd(), "extension/background.js"), "utf8");

/** Plockar ut harDomVarianter ur källan och kör den på riktigt. */
function harDomVarianter(product: unknown): boolean {
  const m = KÄLLA.match(/function harDomVarianter\(product\) \{[\s\S]*?\n\}/);
  if (!m) throw new Error("harDomVarianter hittades inte i background.js");
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${m[0]}; return harDomVarianter;`)() as (p: unknown) => boolean;
  return fn(product);
}

interface DsSvar {
  ok: boolean;
  data?: Record<string, unknown>;
}
type Produkt = Record<string, unknown>;

/**
 * Plockar ut dsRescueVariants och kör den mot ett stubbat apiCall.
 * Returnerar även vilka URL:er stubben fick, så id-grinden går att observera.
 */
async function körRäddning(
  product: Produkt,
  svar: DsSvar | Error,
): Promise<{ product: Produkt; bytt: boolean; anrop: string[] }> {
  const m = KÄLLA.match(/async function dsRescueVariants\(product\) \{[\s\S]*?\n\}/);
  if (!m) throw new Error("dsRescueVariants hittades inte i background.js");
  const anrop: string[] = [];
  const apiCall = async (url: string) => {
    anrop.push(url);
    if (svar instanceof Error) throw svar;
    return svar;
  };
  // eslint-disable-next-line no-new-func
  const fn = new Function("apiCall", `${m[0]}; return dsRescueVariants;`)(apiCall) as (
    p: Produkt,
  ) => Promise<{ product: Produkt; bytt: boolean }>;
  const r = await fn(product);
  return { ...r, anrop };
}

const v = (id: string) => ({ supplierVariantId: id, costUsd: 22.9, included: true });

/** Skrapans produkt: DOM-varianter, allihop med sidans baspris. */
const skrapad = (extra: Produkt = {}): Produkt => ({
  supplierProductId: "1005007857803500",
  rawTitle: "Väggmonterad garderob",
  imageUrls: ["https://x/a.jpg"],
  variants: [v("dom-0"), v("dom-1")],
  swatchImages: { Färg: { Rosa: "https://x/gammal.jpg" } },
  optionColorCodes: { Rosa: "#f0f" },
  _warnings: ["Alla varianter fick baspriset från sidan."],
  extractionOk: true,
  ...extra,
});

/** DS-facit: SAMMA vara, men riktiga per-SKU-priser. */
const dsData = (extra: Record<string, unknown> = {}) => ({
  ok: true,
  data: {
    variants: [
      { supplierVariantId: "12000041", costUsd: 22.9, stock: 0, options: { Antal: "4-pack" } },
      { supplierVariantId: "12000042", costUsd: 31.5, stock: 7, options: { Antal: "6-pack" } },
    ],
    ...extra,
  },
});

describe("harDomVarianter", () => {
  it("flaggar DOM-byggda varianter", () => {
    expect(harDomVarianter({ variants: [v("dom-0"), v("dom-1")] })).toBe(true);
  });

  // AVGÖRANDE SKILLNAD: idx- kommer från den INBÄDDADE SKU-vägen, där varje
  // variant har sitt eget pris — bara id:t saknades. Byter vi ut den listan
  // mot DS kastar vi korrekt data.
  it("flaggar INTE idx- — de har korrekta per-variant-priser", () => {
    expect(harDomVarianter({ variants: [v("idx-0"), v("idx-1")] })).toBe(false);
  });

  it("flaggar INTE riktiga SKU-id", () => {
    expect(harDomVarianter({ variants: [v("12000041"), v("12000042")] })).toBe(false);
  });

  it("en enda dom- bland riktiga räcker", () => {
    expect(harDomVarianter({ variants: [v("12000041"), v("dom-3")] })).toBe(true);
  });

  it("tål produkt utan varianter", () => {
    expect(harDomVarianter({})).toBe(false);
    expect(harDomVarianter({ variants: [] })).toBe(false);
    expect(harDomVarianter(null)).toBe(false);
  });

  it("'default' är inte dom- (enkel produkt utan varianter)", () => {
    expect(harDomVarianter({ variants: [v("default")] })).toBe(false);
  });
});

describe("dsRescueVariants", () => {
  it("byter skrapans variantlista mot DS:s per-SKU-priser", async () => {
    const r = await körRäddning(skrapad(), dsData());
    expect(r.bytt).toBe(true);
    expect(r.product.variants).toHaveLength(2);
    expect((r.product.variants as { costUsd: number }[]).map((x) => x.costUsd)).toEqual([
      22.9, 31.5,
    ]);
    expect(r.anrop[0]).toContain("1005007857803500");
  });

  // KÄRNAN I F1-fixen (audit 2026-08-20). Kartan är nycklad på SKRAPANS värden
  // och matchar ingenting när varianterna bytts. Kvarlämnad är den värre än
  // tom: serverns backfill kräver en HELT tom karta för att kicka in
  // (needsSwatchBackfill), så en stale karta ger noll kopplade variantbilder.
  //
  // Och den får inte byggas om HÄR heller: DS:s imageUrl är per SKU, inte per
  // värde — en Color × Size-produkt skulle få varje storlek kopplad till ett
  // godtyckligt färgfoto. buildSwatchImagesFromDs på servern har fyra grindar
  // som saknas i tillägget.
  it("TÖMMER variantbildkartan så serverns backfill tar över", async () => {
    const r = await körRäddning(
      skrapad(),
      dsData({
        variants: [
          {
            supplierVariantId: "12000041",
            costUsd: 22.9,
            options: { Färg: "Röd", Storlek: "S" },
            swatchImageUrl: "https://x/rod.jpg",
          },
          {
            supplierVariantId: "12000042",
            costUsd: 31.5,
            options: { Färg: "Röd", Storlek: "M" },
            swatchImageUrl: "https://x/rod.jpg",
          },
        ],
      }),
    );
    expect(r.product.swatchImages).toEqual({});
    expect(r.product.optionColorCodes).toEqual({});
  });

  it("rensar DOM-varningen om baspriset — den är åtgärdad", async () => {
    const r = await körRäddning(skrapad(), dsData());
    expect(r.product._warnings).toEqual([]);
  });

  it("behåller varningar som INTE handlar om baspriset", async () => {
    const r = await körRäddning(
      skrapad({ _warnings: ["Säljaren har låg score.", "Alla fick baspriset."] }),
      dsData(),
    );
    expect(r.product._warnings).toEqual(["Säljaren har låg score."]);
  });

  it("kastar DS-varianter utan pris", async () => {
    const r = await körRäddning(
      skrapad(),
      dsData({
        variants: [
          { supplierVariantId: "12000041", costUsd: 31.5 },
          { supplierVariantId: "12000042", costUsd: 0 },
        ],
      }),
    );
    expect(r.product.variants).toHaveLength(1);
  });

  // FAIL-OPEN, hela vägen. Skrapans data är sämre än DS:s, men bättre än inget
  // — och serverns prisspärr (lib/import/price-trust.ts) hindrar ändå att en
  // obekräftad produkt publiceras.
  it("behåller skrapans data när DS inte svarar", async () => {
    const r = await körRäddning(skrapad(), new Error("nätverk"));
    expect(r.bytt).toBe(false);
    expect((r.product.variants as { supplierVariantId: string }[])[0].supplierVariantId).toBe(
      "dom-0",
    );
    expect(r.product.swatchImages).toEqual({ Färg: { Rosa: "https://x/gammal.jpg" } });
  });

  it("behåller skrapans data när DS svarar utan varianter", async () => {
    const r = await körRäddning(skrapad(), dsData({ variants: [] }));
    expect(r.bytt).toBe(false);
    expect(r.product.variants).toHaveLength(2);
  });

  it("behåller skrapans data när DS svarar ok:false", async () => {
    const r = await körRäddning(skrapad(), { ok: false });
    expect(r.bytt).toBe(false);
  });

  // Utan sifferkontrollen skulle ett skräp-id slå ett DS-anrop per import.
  it("slår aldrig upp ett id som inte är ett AE-produkt-id", async () => {
    const r = await körRäddning(skrapad({ supplierProductId: "abc" }), dsData());
    expect(r.bytt).toBe(false);
    expect(r.anrop).toEqual([]);
  });

  it("lagerstatus kommer från DS-saldona", async () => {
    const slut = await körRäddning(
      skrapad(),
      dsData({
        variants: [
          { supplierVariantId: "12000041", costUsd: 22.9, stock: 0 },
          { supplierVariantId: "12000042", costUsd: 31.5, stock: 0 },
        ],
      }),
    );
    expect(slut.product.inStock).toBe(false);
    const finns = await körRäddning(skrapad({ inStock: false }), dsData());
    expect(finns.product.inStock).toBe(true);
  });

  it("slår ihop lagerländerna utan dubbletter", async () => {
    const r = await körRäddning(skrapad({ shipsFrom: ["ES"] }), dsData({ shipsFrom: ["DE", "ES"] }));
    expect(r.product.shipsFrom).toEqual(["DE", "ES"]);
  });

  it("fyller bara i titel/bilder som saknas — skrapans egna vinner", async () => {
    const r = await körRäddning(
      skrapad(),
      dsData({ rawTitle: "DS-titel", imageUrls: ["https://x/ds.jpg"] }),
    );
    expect(r.product.rawTitle).toBe("Väggmonterad garderob");
    expect(r.product.imageUrls).toEqual(["https://x/a.jpg"]);

    const tom = await körRäddning(
      skrapad({ rawTitle: "", imageUrls: [] }),
      dsData({ rawTitle: "DS-titel", imageUrls: ["https://x/ds.jpg"] }),
    );
    expect(tom.product.rawTitle).toBe("DS-titel");
    expect(tom.product.imageUrls).toEqual(["https://x/ds.jpg"]);
  });
});

// Samma bugg fanns på TRE ställen (audit 2026-08-20 + sveptet efteråt):
// background.js dsRescueVariants, popup.js refreshVariantPricesViaDsApi och
// popup.js rescueViaDsApi. Ett test per ställe hade missat det tredje — det
// här hittar dem själv och kräver tömningen av alla.
describe("varje DS-byte tömmer variantbildkartan", () => {
  const POPUP = readFileSync(join(process.cwd(), "extension/popup.js"), "utf8");

  /** Radnummer där variantlistan byts mot DS:s. */
  function bytesplatser(src: string): number[] {
    const rader = src.split("\n");
    const träffar: number[] = [];
    rader.forEach((rad, i) => {
      if (/\bvariants\s*[:=]\s*dsVariants\b/.test(rad)) träffar.push(i);
    });
    return träffar;
  }

  for (const [namn, src] of [
    ["background.js", KÄLLA],
    ["popup.js", POPUP],
  ] as const) {
    it(`${namn}: alla byten följs av swatchImages = {}`, () => {
      const platser = bytesplatser(src);
      expect(platser.length).toBeGreaterThan(0);
      const rader = src.split("\n");
      for (const rad of platser) {
        // Tömningen ska ligga NÄRA bytet, i samma andetag. Fönstret är tilltaget
        // så det rymmer kommentaren som förklarar varför tömning — och inte
        // ombyggnad — är rätt; den är längre än koden.
        const fönster = rader.slice(rad, rad + 40).join("\n");
        expect(fönster, `${namn}:${rad + 1}`).toMatch(/swatchImages = \{\}/);
        expect(fönster, `${namn}:${rad + 1}`).toMatch(/optionColorCodes = \{\}/);
      }
    });
  }

  // Ombyggnaden hör hemma på servern (buildSwatchImagesFromDs har fyra grindar
  // som tillägget saknar, och DS:s imageUrl är per SKU — inte per värde).
  it("ingen av dem bygger om kartan på egen hand", () => {
    for (const src of [KÄLLA, POPUP]) {
      expect(src).not.toMatch(/swatchImages\[[^\]]+\]\s*=/);
    }
  });
});

describe("inkopplingen i background.js", () => {
  // Det var precis den här gaten som var buggen. Skrivs den om till att bara
  // titta på extractionOk igen är felet tillbaka.
  it("agent-vägen triggar på BÅDE misslyckad extraktion och dom-varianter", () => {
    expect(KÄLLA).toMatch(/if \(!product\.extractionOk \|\| harDomVarianter\(product\)\)/);
  });

  it("bulk-vägen har också räddningen", () => {
    const bulk = KÄLLA.slice(KÄLLA.indexOf("async function scrapeAndImport"));
    expect(bulk.slice(0, bulk.indexOf('case "IMPORT_PRODUCT"'))).toMatch(
      /harDomVarianter\(product\)[\s\S]{0,200}dsRescueVariants\(product\)/,
    );
  });
});
