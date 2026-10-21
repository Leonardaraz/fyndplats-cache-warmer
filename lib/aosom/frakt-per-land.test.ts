// Frakten per land: tolkningen av feedens landskolumner, måtten per land och
// urvalen. Alla artikelnummer och belopp här är påhittade.

import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "../store";
import { MIN_WIX_PRODUKTER } from "../wix/v3-products";
import { fraktkolumner, parseAosomFeed, type AosomRow } from "./feed";
import {
  felSvar,
  loggtext,
  matFrakt,
  matFraktPerLand,
  UnderlagetOfullstandigt,
  type FraktPerLandDeps,
} from "./frakt-per-land";
import { MIN_FEED_RADER } from "./sync";

const RUBRIK = '"SKU","Name","Qty","Wholesale Price","Shipping Cost","Shipping Cost Germany","SE Ship Fee","DK Ship Fee","FI Ship Fee"';

describe("fraktkolumner", () => {
  it("hittar varje <land> Ship Fee och Tysklands egen kolumn, men inte Shipping Cost utan land", () => {
    const header = ["sku", "shipping cost", "shipping cost germany", "se ship fee", "dk ship fee", "price"];
    expect(fraktkolumner(header)).toEqual([
      { land: "DE", index: 2 },
      { land: "SE", index: 3 },
      { land: "DK", index: 4 },
    ]);
  });

  it("ett land två gånger: den första kolumnen gäller", () => {
    expect(fraktkolumner(["de ship fee", "shipping cost germany"])).toEqual([{ land: "DE", index: 0 }]);
  });
});

describe("parseAosomFeed med fraktPerLand", () => {
  const csv = `${RUBRIK}\nTEST-0001,"Tisch",5,63.89 EUR,11.11,17.39,29.13,23.71,""`;

  it("läser avgiften per land, och en tom cell blir null", () => {
    const [r] = parseAosomFeed(csv, { fraktPerLand: true });
    expect(r.fraktPerLand).toEqual({ DE: 17.39, SE: 29.13, DK: 23.71, FI: null });
    expect(r.seFreightEur).toBe(29.13);
  });

  it("utan flaggan är raden som förut, utan fältet", () => {
    const [r] = parseAosomFeed(csv);
    expect("fraktPerLand" in r).toBe(false);
  });
});

function rad(sku: string, inkop: number | null, frakt: Record<string, number | null>): AosomRow {
  return {
    sku,
    name: "",
    url: "",
    imageUrls: [],
    category: "",
    color: "",
    material: "",
    size: "",
    packageSize: "",
    weightKg: null,
    descriptionHtml: "",
    bulletsHtml: "",
    qty: 1,
    normalPriceEur: null,
    wholesaleEur: inkop,
    seFreightEur: frakt.SE ?? null,
    rowIndex: 1,
    fraktPerLand: frakt,
  };
}

describe("matFrakt", () => {
  const rader = [
    rad("TEST-0001", 100, { SE: 20, DK: 10, FI: 30 }),
    rad("TEST-0002", 50, { SE: 40, DK: 20, FI: 999.9 }),
    rad("TEST-0003", 10, { SE: 999.9, DK: 15, FI: 60 }),
    rad("TEST-0004", null, { SE: 20, DK: 10, FI: 30 }),
  ];
  const m = matFrakt(rader);
  const land = (kod: string) => m.lander.find((l) => l.land === kod)!;

  it("räknar bara rader med inköpspris", () => {
    expect(m.rader).toBe(3);
    expect(m.lander.map((l) => l.land)).toEqual(["DK", "FI", "SE"]);
  });

  it("skeppbara räknar bort Aosoms 999,90 och tomma celler", () => {
    expect(land("DK").skeppbara).toBe(3);
    expect(land("FI").skeppbara).toBe(2);
    expect(land("SE").skeppbara).toBe(2);
    expect(land("FI").andelPct).toBe(66.7);
  });

  it("kvoterna räknas bara på rader som går att skicka både dit och till Sverige", () => {
    // DK: 10/20 och 20/40 → frakt 0,5. Landat: 110/120 och 70/90.
    expect(land("DK").jamforda).toBe(2);
    expect(land("DK").fraktKvot).toBe(0.5);
    expect(land("DK").landadKvot).toBe(Math.round(((110 / 120 + 70 / 90) / 2) * 100) / 100);
    expect(land("DK").billigareFraktPct).toBe(100);
    // FI: bara TEST-0001 går till båda.
    expect(land("FI").jamforda).toBe(1);
    expect(land("FI").fraktKvot).toBe(1.5);
    expect(land("FI").landadKvot).toBe(Math.round((130 / 120) * 100) / 100);
    expect(land("FI").billigareFraktPct).toBe(0);
  });

  it("Sverige är referensen: kvot 1", () => {
    expect(land("SE").fraktKvot).toBe(1);
    expect(land("SE").landadKvot).toBe(1);
  });

  it("frakttunga: frakten kostar mer än varan, bland de skeppbara", () => {
    // FI: TEST-0003 har 60 i frakt mot 10 i inköp.
    expect(land("FI").frakttungaPct).toBe(50);
    expect(land("DK").frakttungaPct).toBe(Math.round((1 / 3) * 1000) / 10);
  });

  it("frakttunga gäller först när frakten är STÖRRE än varan, inte lika stor", () => {
    const dk = matFrakt([
      rad("TEST-0007", 100, { SE: 60, DK: 60 }),
      rad("TEST-0008", 100, { SE: 100, DK: 100 }),
      rad("TEST-0009", 100, { SE: 101, DK: 101 }),
    ]).lander.find((l) => l.land === "DK")!;
    expect(dk.frakttungaPct).toBe(33.3);
  });

  it("tullunionen och svenska namn", () => {
    expect(land("DK")).toMatchObject({ namn: "Danmark", inomTullunionen: true });
    expect(matFrakt([rad("TEST-0005", 10, { SE: 5, TR: 9 })]).lander.find((l) => l.land === "TR"))
      .toMatchObject({ namn: "Turkiet", inomTullunionen: false });
  });

  it("ett land utan en enda skeppbar rad ger null i stället för en påhittad kvot", () => {
    const tom = matFrakt([rad("TEST-0006", 10, { SE: 5, XX: 999.9 })]).lander.find((l) => l.land === "XX")!;
    expect(tom).toMatchObject({ skeppbara: 0, andelPct: 0, fraktKvot: null, landadKvot: null, frakttungaPct: null });
    expect(tom.namn).toBe("XX");
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

/** En feed med n rader, alla med samma avgifter. */
function flode(n: number): AosomRow[] {
  return Array.from({ length: n }, (_, i) =>
    rad(`TEST-${String(i + 1).padStart(4, "0")}`, 63.89, { SE: 29.13, DK: 23.71, FI: 41.57 }));
}

function synliga(...extra: string[]): Set<string> {
  const s = new Set(extra);
  for (let i = 0; s.size < MIN_WIX_PRODUKTER; i++) s.add(`annan-${i}`);
  return s;
}

function deps(over: Partial<FraktPerLandDeps> = {}): FraktPerLandDeps {
  return {
    hamtaFlodet: async () => flode(MIN_FEED_RADER),
    listaMappningar: async () => [
      mappning({ wixProductId: "wix-1", supplierProductId: "aosom:TEST-0001" }),
      mappning({ wixProductId: "wix-2", supplierProductId: "aosom:TEST-0002" }),
      mappning({ wixProductId: "wix-3", supplierProductId: "aosom:TEST-0003", draftStatus: "rejected" }),
      mappning({ wixProductId: "wix-4", supplierProductId: "aosom:TEST-9999" }),
      mappning({ wixProductId: "wix-5", supplierProductId: "1005000000000001" }),
    ],
    listaSynliga: async () => synliga("wix-1", "wix-5"),
    ...over,
  };
}

describe("matFraktPerLand", () => {
  it("tre urval: hela feeden, våra mappade utom avvisade, och de publicerade", async () => {
    const s = await matFraktPerLand(deps());
    expect(s.flodetRader).toBe(MIN_FEED_RADER);
    expect(s.landskolumner).toBe(3);
    expect(s.urval.flodet.rader).toBe(MIN_FEED_RADER);
    // TEST-0001 och TEST-0002 (TEST-0003 är avvisad, TEST-9999 finns inte i feeden).
    expect(s.tackning.vara).toEqual({ mappade: 3, iFlodet: 2 });
    expect(s.urval.vara.rader).toBe(2);
    // Bara wix-1 är synlig av Aosom-sidorna. AliExpress-raden räknas inte.
    expect(s.tackning.publicerade).toEqual({ mappade: 1, iFlodet: 1 });
    expect(s.urval.publicerade.rader).toBe(1);
  });

  it("en synlig sida räknas även om raden är markerad avvisad", async () => {
    const s = await matFraktPerLand(deps({ listaSynliga: async () => synliga("wix-3") }));
    expect(s.tackning.publicerade).toEqual({ mappade: 1, iFlodet: 1 });
    // Och den hör till våra artiklar: TEST-0001, -0002, -0003 och -9999.
    expect(s.tackning.vara).toEqual({ mappade: 4, iFlodet: 3 });
  });

  it("en sammanslagen sida bidrar med varje färgs artikel", async () => {
    const sammanslagen = mappning({
      wixProductId: "wix-1",
      supplierProductId: "aosom:TEST-0001",
      variants: [
        { wixVariantId: "v1", supplierVariantId: "TEST-0001" },
        { wixVariantId: "v2", supplierVariantId: "TEST-0004" },
      ] as ProductMappingRecord["variants"],
    });
    const s = await matFraktPerLand(deps({ listaMappningar: async () => [sammanslagen] }));
    expect(s.tackning.publicerade).toEqual({ mappade: 2, iFlodet: 2 });
  });

  it("☠️ en halvläst feed är inget mått", async () => {
    await expect(matFraktPerLand(deps({ hamtaFlodet: async () => flode(MIN_FEED_RADER - 1) })))
      .rejects.toBeInstanceOf(UnderlagetOfullstandigt);
  });

  it("☠️ en halvläst butik är inget mått", async () => {
    await expect(matFraktPerLand(deps({ listaSynliga: async () => new Set(["wix-1"]) })))
      .rejects.toBeInstanceOf(UnderlagetOfullstandigt);
  });

  it("☠️ utan Sveriges kolumn går inget land att jämföra", async () => {
    const utanSe = flode(MIN_FEED_RADER).map((r) => ({ ...r, fraktPerLand: { DK: 23.71 } }));
    await expect(matFraktPerLand(deps({ hamtaFlodet: async () => utanSe })))
      .rejects.toBeInstanceOf(UnderlagetOfullstandigt);
  });

  it("☠️ svaret bär varken artikelnummer, avgifter eller inköpspriser", async () => {
    const text = JSON.stringify(await matFraktPerLand(deps()));
    expect(text).not.toContain("TEST-");
    for (const belopp of ["63.89", "29.13", "23.71", "41.57"]) expect(text).not.toContain(belopp);
    expect(text).not.toMatch(/wix-\d/);
  });
});

describe("felSvar", () => {
  it("våra egna spärrar svarar 503 med sin text", () => {
    expect(felSvar(new UnderlagetOfullstandigt("feeden gav 12 rader"))).toEqual({ status: 503, error: "feeden gav 12 rader" });
  });

  it("☠️ ett annat fel svarar utan sin text, som kan bära feedens adress", () => {
    const fel = new Error("connect failed https://feed.example.invalid/secret.csv?token=abc");
    const svar = felSvar(fel);
    expect(svar.status).toBe(502);
    expect(svar.error).not.toContain("example.invalid");
    expect(loggtext(fel)).toBe("connect failed ‹adress›");
  });
});
