import { describe, expect, it } from "vitest";
import { hittaSyskonRader, mattText, syskonSvar } from "./syskon-import";
import type { AosomRow } from "./feed";

// Syntetiska artikelnummer — riktiga får aldrig stå i en testfil, repot är publikt.

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: "Ersatzdach Pavillon",
    url: `https://example.invalid/${sku}`,
    imageUrls: [],
    category: "Garten > Pavillons",
    color: "Braun",
    material: "Polyester",
    size: "298L x 298B cm",
    packageSize: "40.00x30.00x10.00 cm",
    weightKg: 3.2,
    descriptionHtml: "",
    bulletsHtml: "",
    qty: 50,
    normalPriceEur: 60,
    wholesaleEur: 20,
    seFreightEur: 15,
    rowIndex: 1,
    psin: "KLUNGA-1",
    ...over,
  };
}

const saldo = (q: number) => Math.max(0, q - 3);

describe("hittaSyskonRader", () => {
  const feed = [
    rad("A-1"),
    rad("A-2", { color: "Orange" }),
    rad("A-3"), // samma färg och mått: en dubblett, inget syskon
    rad("A-4", { size: "398L x 298B cm", packageSize: "50.00x30.00x10.00 cm", weightKg: 4.1 }),
    rad("B-1", { name: "Gartenstuhl", size: "60L x 55B x 90H cm", psin: "ANNAN", color: "Grau" }),
  ];

  it("hittar färg- och storlekssyskon men aldrig samma vara eller en annan vara", () => {
    const { ankare, syskon } = hittaSyskonRader(feed, ["A-1"]);
    expect(ankare).toBe(1);
    expect(syskon.map((s) => [s.rad.sku, s.relation])).toEqual([
      ["A-2", "farg"],
      ["A-4", "storlek"],
    ]);
  });

  it("en sidas egna artiklar är aldrig sina egna syskon", () => {
    const { syskon } = hittaSyskonRader(feed, ["A-1", "A-2"]);
    expect(syskon.map((s) => s.rad.sku)).toEqual(["A-4"]);
  });

  it("☠️ en dubblett av en av sidans färger är ingen ny färg, fast den skiljer sig från en annan", () => {
    // A-3 är brun som A-1 men orange A-2 skiljer sig — utan spärren hade den
    // importerats som en färg till på en sida som redan är brun.
    const { syskon, dubbletter } = hittaSyskonRader(feed, ["A-1", "A-2"]);
    expect(syskon.map((s) => s.rad.sku)).not.toContain("A-3");
    expect(dubbletter).toBe(1);
  });

  it("två kandidater som är samma vara blir en — den med störst saldo", () => {
    const tva = [rad("A-1"), rad("A-5", { color: "Grün", qty: 5 }), rad("A-6", { color: "Grün", qty: 80 })];
    const { syskon, dubbletter } = hittaSyskonRader(tva, ["A-1"]);
    expect(syskon.map((s) => s.rad.sku)).toEqual(["A-6"]);
    expect(dubbletter).toBe(1);
  });

  it("☠️ utan ankare i feeden går det inte att jämföra — noll ankare, inte noll syskon", () => {
    expect(hittaSyskonRader(feed, ["Z-9"])).toEqual({ ankare: 0, syskon: [], dubbletter: 0 });
  });
});

describe("syskonSvar", () => {
  it("beskriver raden utan artikelnummer, pris eller kostnad", () => {
    const s = syskonSvar({ rad: rad("A-2", { color: "Orange" }), relation: "farg" }, { fanns: false, synligtSaldo: saldo });
    expect(s).toEqual({
      relation: "farg",
      farg: "Orange",
      matt: "298 × 298",
      saldo: 47,
      status: "importeras",
      nattensImportHoppar: false,
    });
    expect(JSON.stringify(s)).not.toContain("A-2");
  });

  it("säger varför nattens import hoppar över raden: frakten kostar mer än varan", () => {
    const s = syskonSvar({ rad: rad("A-2", { wholesaleEur: 10, seFreightEur: 20 }), relation: "farg" }, { fanns: false, synligtSaldo: saldo });
    expect(s.nattensImportHoppar).toBe(true);
  });

  it("en rad som redan finns pekar på sin sida, och en som inte går att skicka hit säger det", () => {
    const fanns = syskonSvar({ rad: rad("A-2"), relation: "farg" }, { fanns: true, wixProductId: "wix-1", synligtSaldo: saldo });
    expect(fanns).toMatchObject({ status: "fanns", wixProductId: "wix-1", nattensImportHoppar: false });
    const tom = syskonSvar({ rad: rad("A-2", { qty: 0 }), relation: "farg" }, { fanns: false, synligtSaldo: saldo });
    expect(tom).toMatchObject({ status: "ej_skeppbar", saldo: 0, nattensImportHoppar: false });
  });

  it("måtten med decimalkomma", () => {
    expect(mattText(rad("A-1", { size: "79,5L x 33B x 90,7H cm" }))).toBe("79,5 × 33 × 90,7");
  });
});
