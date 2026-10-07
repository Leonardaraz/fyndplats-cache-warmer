import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "../store";
import {
  behoverFlodet,
  byggLeverantorslankar,
  tolkaProduktlista,
} from "./leverantorslankar";

// Påhittade artikelnummer, med flit utan Aosoms form.
const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const ID_C = "33333333-3333-4333-8333-333333333333";

function rad(over: Partial<ProductMappingRecord> & { wixProductId: string }): ProductMappingRecord {
  return {
    supplierProductId: "aosom:art-huvud",
    supplier: "aosom",
    sourceUrl: "https://www.aosom.de/item/stuhl~art-huvud.html?utm_source=b2b",
    variants: [
      { supplierVariantId: "art-huvud", sku: "FP-stol", wixVariantId: "wv-1", choices: {}, costUsd: 1, landedCostSek: 1, grossSek: 1 },
    ],
    ...over,
  } as ProductMappingRecord;
}

const sammanslagen = rad({
  wixProductId: ID_C,
  variants: [
    { supplierVariantId: "art-huvud", sku: "FP-stol-svart", wixVariantId: "wv-1", choices: { Färg: "Svart" }, costUsd: 1, landedCostSek: 1, grossSek: 1 },
    { supplierVariantId: "art-gra", sku: "FP-stol-gra", wixVariantId: "wv-2", choices: { Färg: "Grå" }, costUsd: 1, landedCostSek: 1, grossSek: 1 },
  ],
});

const ae = rad({
  wixProductId: ID_B,
  supplier: "aliexpress",
  supplierProductId: "1005000000000001",
  sourceUrl: undefined,
});

describe("tolkaProduktlista", () => {
  it("tar id, slug och butiksadress, åtskilda av komma, mellanslag och radbrytning", () => {
    const { mal, ogiltiga } = tolkaProduktlista(
      `${ID_A.toUpperCase()}, kontorsstol-svart\nhttps://www.fyndplats.se/produkt/Golvlampa-170-cm?x=1  ${ID_B}`,
    );
    expect(mal).toEqual([
      { kind: "id", id: ID_A, fran: ID_A.toUpperCase() },
      { kind: "slug", slug: "kontorsstol-svart", fran: "kontorsstol-svart" },
      { kind: "slug", slug: "golvlampa-170-cm", fran: "https://www.fyndplats.se/produkt/Golvlampa-170-cm?x=1" },
      { kind: "id", id: ID_B, fran: ID_B },
    ]);
    expect(ogiltiga).toEqual([]);
  });

  it("dubbletter tas en gång, och en lista av strängar fungerar som en sträng", () => {
    const { mal } = tolkaProduktlista([ID_A, `${ID_A},kontorsstol-svart`, "KONTORSSTOL-SVART"]);
    expect(mal.map((m) => m.fran)).toEqual([ID_A, "kontorsstol-svart"]);
  });

  it("ordernummer och variant-SKU:er är inga produkter — de returneras som ogiltiga", () => {
    const { mal, ogiltiga } = tolkaProduktlista("10056 FP-kontorsstol-svart kontorsstol-svart");
    expect(mal.map((m) => m.fran)).toEqual(["kontorsstol-svart"]);
    expect(ogiltiga).toEqual(["10056", "FP-kontorsstol-svart"]);
  });
});

describe("byggLeverantorslankar", () => {
  const mappningar = new Map([ID_A, ID_B, ID_C].map((id) => [id, id === ID_B ? ae : id === ID_C ? sammanslagen : rad({ wixProductId: id })]));

  it("en Aosom-rad får mappningens adress och numret utan prefix — samma som uppslagets knapp", () => {
    const { lankar } = byggLeverantorslankar([{ wixProductId: ID_A, fran: "a" }], mappningar, null);
    expect(lankar).toEqual([
      {
        wixProductId: ID_A,
        fran: "a",
        leverantor: "aosom",
        artikelnummer: "art-huvud",
        url: "https://www.aosom.de/item/stuhl~art-huvud.html?utm_source=b2b",
      },
    ]);
  });

  it("en AliExpress-rad får AliExpress-länken, aldrig en Aosom-länk", () => {
    const { lankar } = byggLeverantorslankar([{ wixProductId: ID_B, fran: "b" }], mappningar, null);
    expect(lankar[0]).toMatchObject({
      leverantor: "aliexpress",
      artikelnummer: "1005000000000001",
      url: "https://www.aliexpress.com/item/1005000000000001.html",
    });
    expect(lankar[0].varianter).toBeUndefined();
  });

  it("en sammanslagen sida får en länk per färg ur flödet, skiftlägesokänsligt", () => {
    const flode = { "ART-HUVUD": "stuhl~art-huvud.html", "ART-GRA": "stuhl~art-gra.html" };
    const { lankar } = byggLeverantorslankar([{ wixProductId: ID_C, fran: "c" }], mappningar, flode);
    expect(lankar[0].url).toBe("https://www.aosom.de/item/stuhl~art-huvud.html?utm_source=b2b");
    expect(lankar[0].varianter).toEqual([
      { artikelnummer: "art-huvud", url: "https://www.aosom.de/item/stuhl~art-huvud.html", val: { Färg: "Svart" } },
      { artikelnummer: "art-gra", url: "https://www.aosom.de/item/stuhl~art-gra.html", val: { Färg: "Grå" } },
    ]);
  });

  it("utan flödet får huvudfärgen sidans adress och den andra ingen — ingen gissad adress", () => {
    const { lankar } = byggLeverantorslankar([{ wixProductId: ID_C, fran: "c" }], mappningar, null);
    expect(lankar[0].varianter?.map((v) => v.url)).toEqual([
      "https://www.aosom.de/item/stuhl~art-huvud.html?utm_source=b2b",
      null,
    ]);
    // Numret finns ändå, så färgen går att söka fram för hand.
    expect(lankar[0].varianter?.map((v) => v.artikelnummer)).toEqual(["art-huvud", "art-gra"]);
  });

  it("en Aosom-rad utan egen adress tar adressen ur flödet", () => {
    const utan = new Map([[ID_A, rad({ wixProductId: ID_A, sourceUrl: undefined })]]);
    const { lankar } = byggLeverantorslankar([{ wixProductId: ID_A, fran: "a" }], utan, { "ART-HUVUD": "stuhl~art-huvud.html" });
    expect(lankar[0].url).toBe("https://www.aosom.de/item/stuhl~art-huvud.html");
  });

  it("en produkt utan mappning listas — den tystas inte", () => {
    const { lankar, utanMappning } = byggLeverantorslankar(
      [{ wixProductId: "44444444-4444-4444-8444-444444444444", fran: "saknad-sida" }, { wixProductId: ID_A, fran: "a" }],
      mappningar,
      null,
    );
    expect(utanMappning).toEqual(["saknad-sida"]);
    expect(lankar.map((l) => l.wixProductId)).toEqual([ID_A]);
  });

  it("listans ordning hålls, och samma produkt via id och slug blir en rad", () => {
    const { lankar } = byggLeverantorslankar(
      [
        { wixProductId: ID_C, fran: "c" },
        { wixProductId: ID_A, fran: "a" },
        { wixProductId: ID_C, fran: "c-via-slug" },
      ],
      mappningar,
      null,
    );
    expect(lankar.map((l) => l.fran)).toEqual(["c", "a"]);
  });

  it("☠️ svaret bär inga kostnader — bara det som behövs för att öppna sidan", () => {
    const { lankar } = byggLeverantorslankar(
      [ID_A, ID_B, ID_C].map((id) => ({ wixProductId: id, fran: id })),
      mappningar,
      { "ART-GRA": "stuhl~art-gra.html" },
    );
    const text = JSON.stringify(lankar);
    for (const falt of ["costUsd", "landedCostSek", "grossSek", "aosomFreightShare", "Wholesale"]) {
      expect(text).not.toContain(falt);
    }
  });
});

describe("behoverFlodet", () => {
  it("bara för en sammanslagen sida eller en Aosom-rad utan adress", () => {
    expect(behoverFlodet([rad({ wixProductId: ID_A }), ae])).toBe(false);
    expect(behoverFlodet([rad({ wixProductId: ID_A }), sammanslagen])).toBe(true);
    expect(behoverFlodet([rad({ wixProductId: ID_A, sourceUrl: undefined })])).toBe(true);
    // En AliExpress-rad utan sourceUrl har ändå en länk och behöver inget flöde.
    expect(behoverFlodet([ae])).toBe(false);
  });
});
