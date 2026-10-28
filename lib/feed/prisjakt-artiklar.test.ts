// Artikelnummer och märke per variant till butikens Prisjakt-flöde.
//
// Alla nummer här är påhittade (TEST-…). Riktiga artikelnummer får aldrig stå
// i repot, som är publikt.

import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import {
  adressensArtikel,
  arArtikelnummer,
  byggPrisjaktArtiklar,
  markeFor,
  prisjaktAuktoriserad,
  type MarkeKallor,
} from "./prisjakt-artiklar";

const adress = (slug: string, artikel: string) => `https://www.aosom.de/item/${slug}~${artikel}.html`;

const kallor = (flodet: Record<string, string> = {}, gpsr: Record<string, string> = {}): MarkeKallor => ({
  flodetsAdresser: new Map(Object.entries(flodet)),
  gpsrMarke: (a) => gpsr[a] ?? null,
});

function enRad(wixProductId: string, artikel: string, variantId: string | null, sourceUrl?: string): ProductMappingRecord {
  return {
    wixProductId,
    supplier: "aosom",
    supplierProductId: `aosom:${artikel}`,
    sourceUrl,
    variants: [
      {
        supplierVariantId: artikel,
        ...(variantId ? { wixVariantId: variantId } : {}),
        sku: "FP-test",
        choices: {},
      },
    ],
  } as unknown as ProductMappingRecord;
}

function sammanslagen(
  wixProductId: string,
  radensArtikel: string,
  varianter: Array<{ artikel: string; variantId: string; farg: string }>,
  sourceUrl?: string,
): ProductMappingRecord {
  return {
    wixProductId,
    supplier: "aosom",
    supplierProductId: `aosom:${radensArtikel}`,
    sourceUrl,
    variants: varianter.map((v) => ({
      supplierVariantId: v.artikel,
      wixVariantId: v.variantId,
      sku: `FP-test-${v.farg}`,
      choices: { Färg: v.farg },
    })),
  } as unknown as ProductMappingRecord;
}

describe("adressensArtikel", () => {
  it("läser artikeln ur adressen till Aosoms produktsida", () => {
    expect(adressensArtikel(adress("homcom-stuhl", "TEST-0001"))).toBe("TEST-0001");
    expect(adressensArtikel(`${adress("homcom-stuhl", "TEST-0001")}?x=1`)).toBe("TEST-0001");
  });

  it("null när adressen inte slutar på en artikel", () => {
    expect(adressensArtikel("https://www.aosom.de/item/homcom-stuhl")).toBeNull();
    expect(adressensArtikel("")).toBeNull();
  });
});

describe("arArtikelnummer", () => {
  it("godtar versaler, siffror och bindestreck", () => {
    expect(arArtikelnummer("TEST-0001")).toBe(true);
  });

  it("vägrar allt som inte ser ut som ett nummer", () => {
    for (const s of ["", "A", "-TEST", "TEST 1", "TEST<1>", "TEST/1", "x".repeat(41)]) {
      expect(arArtikelnummer(s)).toBe(false);
    }
  });
});

describe("markeFor", () => {
  it("tar märket ur flödets adress först", () => {
    const k = kallor({ "TEST-0001": adress("outsunny-pavillon", "TEST-0001") }, { "TEST-0001": "HOMCOM" });
    expect(markeFor("TEST-0001", adress("pawhut-x", "TEST-0001"), k)).toEqual({ marke: "Outsunny", kalla: "flodet" });
  });

  it("tar mappningens adress bara när den slutar på samma artikel", () => {
    expect(markeFor("TEST-0002", adress("pawhut-kratzbaum", "TEST-0002"), kallor())).toEqual({ marke: "PawHut", kalla: "mappningen" });
    // En ommappad rad kan bära adressen till en annan artikel. Den gissar inte.
    expect(markeFor("TEST-0002", adress("pawhut-kratzbaum", "TEST-9999"), kallor())).toEqual({ marke: null, kalla: null });
  });

  it("faller tillbaka på GPSR-datan", () => {
    expect(markeFor("TEST-0003", undefined, kallor({}, { "TEST-0003": "Vinsetto" }))).toEqual({ marke: "Vinsetto", kalla: "gpsr" });
  });

  it("Aosom räknas inte som märke: nästa källa prövas (Leonard 2026-10-28)", () => {
    const k = kallor({ "TEST-0005": adress("aosom-hocker", "TEST-0005") }, { "TEST-0005": "AOSOM" });
    expect(markeFor("TEST-0005", adress("homcom-hocker", "TEST-0005"), k)).toEqual({ marke: "HOMCOM", kalla: "mappningen" });
    expect(markeFor("TEST-0005", undefined, kallor({}, { "TEST-0005": "aosom" }))).toEqual({ marke: null, kalla: null });
    expect(markeFor("TEST-0005", adress("aosom-hocker", "TEST-0005"), k)).toEqual({ marke: null, kalla: null });
  });

  it("null när adressen inte börjar med ett känt märke", () => {
    const k = kallor({ "TEST-0004": adress("heimtrainer-fahrrad", "TEST-0004") });
    expect(markeFor("TEST-0004", undefined, k)).toEqual({ marke: null, kalla: null });
  });
});

describe("byggPrisjaktArtiklar", () => {
  it("ger en sida med en artikel numret och märket på sin variant", () => {
    const { artiklar, rakning } = byggPrisjaktArtiklar(
      [enRad("p1", "TEST-0001", "v1")],
      kallor({ "TEST-0001": adress("homcom-stuhl", "TEST-0001") }),
    );
    expect(artiklar.varianter).toEqual({ v1: { mpn: "TEST-0001", marke: "HOMCOM" } });
    expect(artiklar.produkter).toEqual({});
    expect(rakning).toMatchObject({ aosomRader: 1, enArtikel: 1, medMarke: 1, utanMarke: 0 });
    expect(rakning.markeKalla).toEqual({ flodet: 1, mappningen: 0, gpsr: 0 });
  });

  it("en vara vars enda märke är Aosom behåller numret men får inget märke", () => {
    const { artiklar, rakning } = byggPrisjaktArtiklar(
      [enRad("p1", "TEST-0006", "v1", adress("aosom-pall", "TEST-0006"))],
      kallor({ "TEST-0006": adress("aosom-pall", "TEST-0006") }, { "TEST-0006": "Aosom" }),
    );
    expect(artiklar.varianter).toEqual({ v1: { mpn: "TEST-0006", marke: null } });
    expect(rakning).toMatchObject({ medMarke: 0, utanMarke: 1 });
  });

  it("nycklar på produkten när variant-id saknas", () => {
    const { artiklar, rakning } = byggPrisjaktArtiklar([enRad("p1", "TEST-0001", null)], kallor());
    expect(artiklar.varianter).toEqual({});
    expect(artiklar.produkter).toEqual({ p1: { mpn: "TEST-0001", marke: null } });
    expect(rakning).toMatchObject({ utanVariantId: 1, utanMarke: 1 });
  });

  it("ger varje färg på en sammanslagen sida sin egen artikel", () => {
    const rad = sammanslagen(
      "p2",
      "TEST-0010",
      [
        { artikel: "TEST-0010", variantId: "v-gra", farg: "grå" },
        { artikel: "TEST-0011", variantId: "v-bla", farg: "blå" },
      ],
      adress("homcom-sofa", "TEST-0010"),
    );
    const { artiklar, rakning } = byggPrisjaktArtiklar([rad], kallor({ "TEST-0011": adress("homcom-sofa", "TEST-0011") }));
    expect(artiklar.varianter).toEqual({
      "v-gra": { mpn: "TEST-0010", marke: "HOMCOM" },
      "v-bla": { mpn: "TEST-0011", marke: "HOMCOM" },
    });
    expect(rakning).toMatchObject({ sammanslagna: 1, sammanslagnaVarianter: 2 });
    expect(rakning.markeKalla).toEqual({ flodet: 1, mappningen: 1, gpsr: 0 });
  });

  it("mappningens adress gäller inte färgerna på en sammanslagen sida", () => {
    // Radens adress slutar på radens artikel. Den andra färgen får inget märke ur den.
    const rad = sammanslagen(
      "p2",
      "TEST-0010",
      [
        { artikel: "TEST-0010", variantId: "v-gra", farg: "grå" },
        { artikel: "TEST-0011", variantId: "v-bla", farg: "blå" },
      ],
      adress("homcom-sofa", "TEST-0010"),
    );
    const { artiklar } = byggPrisjaktArtiklar([rad], kallor());
    expect(artiklar.varianter["v-bla"]).toEqual({ mpn: "TEST-0011", marke: null });
  });

  it("en tvetydig sida får ingenting", () => {
    const rad = sammanslagen("p3", "TEST-0020", [
      { artikel: "TEST-0021", variantId: "v-1", farg: "röd" },
      { artikel: "TEST-0022", variantId: "v-2", farg: "blå" },
    ]);
    const { artiklar, rakning } = byggPrisjaktArtiklar([rad], kallor());
    expect(artiklar).toEqual({ varianter: {}, produkter: {} });
    expect(rakning.tvetydiga).toBe(1);
  });

  it("rör bara Aosom-rader", () => {
    const ae = { wixProductId: "p4", supplierProductId: "1005006000000000", variants: [{ wixVariantId: "v4", supplierVariantId: "1" }] };
    const vevor = { wixProductId: "p5", supplier: "vevor", supplierProductId: "vevor:TEST-0005", variants: [{ wixVariantId: "v5" }] };
    const pensionerad = { wixProductId: "p6", supplier: "aosom", supplierProductId: "", variants: [{ wixVariantId: "v6" }] };
    const { artiklar, rakning } = byggPrisjaktArtiklar(
      [ae, vevor, pensionerad] as unknown as ProductMappingRecord[],
      kallor(),
    );
    expect(artiklar).toEqual({ varianter: {}, produkter: {} });
    expect(rakning.aosomRader).toBe(0);
  });

  it("ett nummer som inte ser ut som ett nummer får ingenting", () => {
    const { artiklar, rakning } = byggPrisjaktArtiklar([enRad("p7", "TEST<0007>", "v7")], kallor());
    expect(artiklar.varianter).toEqual({});
    expect(rakning.ogiltigtNummer).toBe(1);
  });

  it("två rader som ger samma variant olika artiklar ger den ingenting", () => {
    const { artiklar, rakning } = byggPrisjaktArtiklar(
      [enRad("p8", "TEST-0008", "v8"), enRad("p9", "TEST-0009", "v8"), enRad("p10", "TEST-0010", "v8")],
      kallor(),
    );
    expect(artiklar.varianter).toEqual({});
    expect(rakning.konflikter).toBe(1);
  });

  it("samma artikel på samma variant två gånger är ingen krock", () => {
    const { artiklar, rakning } = byggPrisjaktArtiklar([enRad("p8", "TEST-0008", "v8"), enRad("p8", "TEST-0008", "v8")], kallor());
    expect(artiklar.varianter).toEqual({ v8: { mpn: "TEST-0008", marke: null } });
    expect(rakning.konflikter).toBe(0);
  });
});

describe("prisjaktAuktoriserad", () => {
  it("osatt utan hemlighet", () => {
    expect(prisjaktAuktoriserad("Bearer x", undefined)).toBe("osatt");
    expect(prisjaktAuktoriserad("Bearer x", "")).toBe("osatt");
  });

  it("ok bara för exakt rätt hemlighet", () => {
    expect(prisjaktAuktoriserad("Bearer hemligt", "hemligt")).toBe("ok");
    expect(prisjaktAuktoriserad("Bearer hemligt2", "hemligt")).toBe("nej");
    expect(prisjaktAuktoriserad("hemligt", "hemligt")).toBe("nej");
    expect(prisjaktAuktoriserad(null, "hemligt")).toBe("nej");
  });
});
