import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "../store";
import type { AosomRow } from "./feed";
import {
  MAX_GRUPP,
  diagnosPar,
  dragAv,
  fargNyckel,
  hittaFamiljer,
  jamfor,
  type FamiljIndata,
  type WixProduktInfo,
} from "./familjer";

// Påhittade artiklar (T-…) och klungor (PSIN-…). Namnen i feeden är tyska med
// flit: det är dem svaret aldrig får bära.

let nastaRad = 1;

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: "PawHut Hundebett Wolke mit Kissen, waschbar",
    url: "",
    imageUrls: [],
    category: "Haustier > Hund > Betten",
    color: "Grau",
    material: "Polyester, Schaumstoff",
    size: "90L x 70B x 20H cm",
    packageSize: "92.00x72.00x22.00 cm",
    weightKg: 3.5,
    descriptionHtml: "",
    bulletsHtml: "",
    qty: 23,
    normalPriceEur: 100,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: nastaRad++,
    psin: "PSIN-1",
    ...over,
  };
}

function mappning(artikel: string, wixProductId: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${artikel}`,
    supplier: "aosom",
    wixProductId,
    variants: [{
      supplierVariantId: artikel,
      sku: `FP-${wixProductId}`,
      wixVariantId: `v-${wixProductId}`,
      choices: {},
      costUsd: 50,
      landedCostSek: 525,
      grossSek: 699,
    }],
    ...over,
  };
}

function wix(id: string, visible: boolean, over: Partial<WixProduktInfo> = {}): [string, WixProduktInfo] {
  return [id, {
    id,
    visible,
    name: visible ? "Hundbädd moln med kudde" : "PawHut Hundebett Wolke mit Kissen",
    slug: visible ? `hundbadd-moln-${id}` : `hundebett-wolke-${id}`,
    prisMin: 699,
    ...over,
  }];
}

function indata(
  rader: AosomRow[],
  mappningar: ProductMappingRecord[],
  wixar: Array<[string, WixProduktInfo]>,
): FamiljIndata {
  return { rader, mappningar, wix: new Map(wixar) };
}

describe("dragAv och fargNyckel", () => {
  it("modellen är namnet utan färg, siffror, enheter, storleksord och husmärke", () => {
    const d = dragAv(rad("T-1", { name: "PawHut Hundebett XXL 90 x 70 cm, Grau, mit Kissen", color: "Grau" }));
    expect([...d.modell].sort()).toEqual(["hundebett", "kissen"]);
  });

  it("färgnyckeln bryr sig inte om ordning, versaler eller ß", () => {
    expect(fargNyckel("Weiß/Grau")).toBe(fargNyckel("grau und weiss"));
    expect(fargNyckel("")).toBe("");
  });

  it("måtten läses med decimalkomma, och bara nollor är inga mått", () => {
    expect(dragAv(rad("T-1", { size: "79,5L x 33B x 90,7H cm" })).matt).toEqual([79.5, 33, 90.7]);
    expect(dragAv(rad("T-1", { size: "0 x 0 x 0 cm" })).matt).toEqual([]);
  });
});

describe("jamfor", () => {
  it("samma mått, paket och vikt men olika färg är ett färgsyskon", () => {
    const j = jamfor(dragAv(rad("T-1")), dragAv(rad("T-2", { color: "Blau", name: "PawHut Hundebett Wolke mit Kissen, waschbar, Blau" })));
    expect(j.relation).toBe("farg");
    expect(j.namnLikhet).toBe(1);
  });

  it("samma färg också är samma vara", () => {
    expect(jamfor(dragAv(rad("T-1")), dragAv(rad("T-2"))).relation).toBe("samma");
  });

  it("olika mått i samma klunga, samma färg och modell är ett storlekssyskon", () => {
    const stor = rad("T-2", {
      name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar",
      size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1,
    });
    expect(jamfor(dragAv(rad("T-1")), dragAv(stor)).relation).toBe("storlek");
  });

  it("olika mått UTAN gemensam klunga är ingenting — två mått är ingen signal", () => {
    const stor = rad("T-2", { psin: "PSIN-2", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 });
    expect(jamfor(dragAv(rad("T-1")), dragAv(stor)).relation).toBeNull();
  });

  it("☠️ samma klunga men en annan modell är ingenting — Psin är ingen variantgrupp", () => {
    const annan = rad("T-2", { name: "PawHut Welpenlaufstall faltbar, 8 Paneele" });
    expect(jamfor(dragAv(rad("T-1")), dragAv(annan)).relation).toBeNull();
  });

  it("utan gemensam klunga krävs ett närmare namn", () => {
    const halvlik = rad("T-2", { psin: "", color: "Blau", name: "Hundebett Wolke Kissen Samt" });
    const bas = rad("T-1", { psin: "", name: "Hundebett Wolke Kissen Leinen" });
    // Tre av fem ord gemensamma: 0,6 räcker inom en klunga men inte utan.
    expect(jamfor(dragAv(bas), dragAv(halvlik)).relation).toBeNull();
    expect(jamfor(dragAv({ ...bas, psin: "PSIN-9" }), dragAv({ ...halvlik, psin: "PSIN-9" })).relation).toBe("farg");
  });

  it("en vikt som skiljer mer än fem procent är en annan vara", () => {
    expect(jamfor(dragAv(rad("T-1")), dragAv(rad("T-2", { color: "Blau", weightKg: 4.2 }))).relation).toBeNull();
  });
});

describe("hittaFamiljer", () => {
  it("en publicerad sida och ett utkast i en annan färg: dagens verktyg klarar det", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau" })],
      [mappning("T-1", "sida"), mappning("T-2", "utkast")],
      [wix("sida", true), wix("utkast", false)],
    ));
    expect(svar.familjer).toHaveLength(1);
    const f = svar.familjer[0];
    expect(f).toMatchObject({ typ: "farg", lage: "en_publicerad", publicerade: 1, utkast: 1, verktygetIdag: true });
    expect(f.medlemmar.map((m) => [m.wixProductId, m.status, m.farg])).toEqual([
      ["sida", "publicerad", "Grau"],
      ["utkast", "utkast", "Blau"],
    ]);
    expect(f.medlemmar[0].matt).toBe("90 × 70 × 20");
    expect(f.medlemmar[0].saldo).toBe(20);
    expect(svar.summering).toMatchObject({ familjer: 1, verktygetIdag: 1, publiceradeIFamiljer: 1, utkastIFamiljer: 1 });
  });

  it("samma vara i samma färg två gånger blir en dubblettgrupp", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2")],
      [mappning("T-1", "sida"), mappning("T-2", "utkast")],
      [wix("sida", true), wix("utkast", false, { prisMin: 999 })],
    ));
    const f = svar.familjer[0];
    expect(f.typ).toBe("samma");
    expect(f.sammaVara).toEqual([["sida", "utkast"]]);
    expect(f.verktygetIdag).toBe(false);
    expect(f.prisSpannPct).toBe(43);
    expect(f.varningar).toContain("priset skiljer 43 %");
  });

  it("storlekssyskon blir en storleksfamilj, som verktyget klarar", () => {
    const svar = hittaFamiljer(indata(
      [
        rad("T-1"),
        rad("T-2", { name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
      ],
      [mappning("T-1", "liten"), mappning("T-2", "stor")],
      [wix("liten", true), wix("stor", false)],
    ));
    expect(svar.familjer[0]).toMatchObject({ typ: "storlek", verktygetIdag: true, prisSpannPct: null });
  });

  it("två publicerade i olika färger: verktyget klarar dem, med omdirigering", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Beige" }), rad("T-3", { color: "Blau" })],
      [mappning("T-1", "a"), mappning("T-2", "b"), mappning("T-3", "c")],
      [wix("a", true), wix("b", true), wix("c", false)],
    ));
    expect(svar.familjer[0]).toMatchObject({ typ: "farg", lage: "flera_publicerade", publicerade: 2, utkast: 1 });
    expect(svar.familjer[0].verktygetIdag).toBe(true);
  });

  it("bara utkast: slå ihop innan poleringen", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau" })],
      [mappning("T-1", "u1"), mappning("T-2", "u2")],
      [wix("u1", false), wix("u2", false)],
    ));
    expect(svar.familjer[0]).toMatchObject({ lage: "bara_utkast", verktygetIdag: false });
    expect(svar.familjer[0].medlemmar.every((m) => m.namn === "" && m.slug === "")).toBe(true);
  });

  it("rader utan klunga hittas på den fysiska signaturen", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1", { psin: "" }), rad("T-2", { psin: "", color: "Blau" })],
      [mappning("T-1", "sida"), mappning("T-2", "utkast")],
      [wix("sida", true), wix("utkast", false)],
    ));
    expect(svar.familjer).toHaveLength(1);
  });

  it("en feedrad vi inte har kan binda ihop två av våra sidor, och räknas", () => {
    const svar = hittaFamiljer(indata(
      [
        rad("T-1"),
        // Grå, stor — inte vår.
        rad("T-2", { name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
        // Blå, stor — vår.
        rad("T-3", { color: "Blau", name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
      ],
      [mappning("T-1", "gra-liten"), mappning("T-3", "bla-stor")],
      [wix("gra-liten", true), wix("bla-stor", false)],
    ));
    expect(svar.familjer).toHaveLength(1);
    expect(svar.familjer[0]).toMatchObject({ typ: "farg_storlek", ejHosOss: 1 });
  });

  it("en feedrad som inte går att skicka hit binder ingenting", () => {
    const svar = hittaFamiljer(indata(
      [
        rad("T-1"),
        rad("T-2", { seFreightEur: 999.9, name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
        rad("T-3", { color: "Blau", name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
      ],
      [mappning("T-1", "gra-liten"), mappning("T-3", "bla-stor")],
      [wix("gra-liten", true), wix("bla-stor", false)],
    ));
    expect(svar.familjer).toHaveLength(0);
  });

  it("en ensam sida med färger i feeden som vi inte har räknas för sig", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau" })],
      [mappning("T-1", "sida")],
      [wix("sida", true)],
    ));
    expect(svar.familjer).toHaveLength(0);
    expect(svar.summering.ensammaMedSyskonIFeeden).toBe(1);
  });

  it("en pensionerad rad räknas inte", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau" })],
      [mappning("T-1", "sida"), mappning("T-2", "utkast", { draftStatus: "rejected" })],
      [wix("sida", true), wix("utkast", false)],
    ));
    expect(svar.familjer).toHaveLength(0);
    expect(svar.underlag.mappningar).toBe(1);
  });

  it("en redan sammanslagen sida bär båda artiklarna och varnar", () => {
    const sida = mappning("T-1", "sida");
    sida.variants = [
      { ...sida.variants[0], wixVariantId: "v-1" },
      { ...sida.variants[0], supplierVariantId: "T-2", sku: "FP-sida-bla", wixVariantId: "v-2" },
    ];
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau" }), rad("T-3", { color: "Beige" })],
      [sida, mappning("T-3", "utkast")],
      [wix("sida", true), wix("utkast", false)],
    ));
    const f = svar.familjer[0];
    expect(f.medlemmar[0]).toMatchObject({ wixProductId: "sida", artiklar: 2, farg: "Grau / Blau" });
    expect(f.varningar).toContain("en sida är redan sammanslagen");
    // En redan sammanslagen sida kan få ett val till.
    expect(f.verktygetIdag).toBe(true);
  });

  it("samma artikel på två sidor är en dubblett även utan feedrad", () => {
    const svar = hittaFamiljer(indata(
      [],
      [mappning("T-1", "a"), mappning("T-1", "b")],
      [wix("a", true), wix("b", false)],
    ));
    expect(svar.summering.sammaArtikelPaTvaSidor).toBe(1);
    expect(svar.familjer[0].sammaVara).toEqual([["a", "b"]]);
    expect(svar.underlag.utanFeedrad).toBe(2);
  });

  it("en mappning utan Wix-produkt räknas och utelämnas", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau" })],
      [mappning("T-1", "sida"), mappning("T-2", "borta")],
      [wix("sida", true)],
    ));
    expect(svar.familjer).toHaveLength(0);
    expect(svar.underlag.utanWixProdukt).toBe(1);
  });

  it("en färglös rad varnar i stället för att gissa", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "" })],
      [mappning("T-1", "sida"), mappning("T-2", "utkast")],
      [wix("sida", true), wix("utkast", false)],
    ));
    expect(svar.familjer[0].typ).toBe("farg");
    expect(svar.familjer[0].varningar[0]).toMatch(/färg saknas i feeden/);
    expect(svar.familjer[0].verktygetIdag).toBe(false);
  });

  it("en för stor kandidatgrupp jämförs inte parvis, men räknas", () => {
    const rader = Array.from({ length: MAX_GRUPP + 1 }, (_, i) => rad(`T-${i}`, { psin: "PSIN-STOR", size: `${i + 1} x 1 x 1 cm`, packageSize: "" }));
    const svar = hittaFamiljer(indata(rader, [], []));
    expect(svar.underlag.forStoraGrupper).toBe(1);
  });

  it("☠️ svaret bär aldrig artikelnummer, klunga, tyska namn eller kostnader", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-100"), rad("T-200", { color: "Blau" }), rad("T-300")],
      [mappning("T-100", "sida"), mappning("T-200", "utkast"), mappning("T-300", "kopia")],
      [wix("sida", true), wix("utkast", false), wix("kopia", false)],
    ));
    expect(svar.familjer).toHaveLength(1);
    const text = JSON.stringify(svar);
    for (const hemligt of ["T-100", "T-200", "T-300", "PSIN-1", "Wolke", "Hundebett", "525", "costUsd", "landedCost", "wholesale"]) {
      expect(text, hemligt).not.toContain(hemligt);
    }
    // Den publicerade sidans svenska namn står på sajten och får visas.
    expect(text).toContain("Hundbädd moln");
  });

  it("☠️ fritext tvättas — ett artikelnummer i en färgkolumn når aldrig svaret", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2", { color: "Blau 999-999ZZ" })],
      [mappning("T-1", "sida"), mappning("T-2", "utkast")],
      [wix("sida", true), wix("utkast", false)],
    ));
    expect(JSON.stringify(svar)).not.toContain("999-999ZZ");
  });
});

describe("diagnosPar", () => {
  const data = indata(
    [rad("T-1"), rad("T-2", { color: "Blau" })],
    [mappning("T-1", "sida"), mappning("T-2", "utkast")],
    [wix("sida", true), wix("utkast", false)],
  );

  it("visar vad jämförelsen såg, utan nummer", () => {
    const d = diagnosPar(data, "sida", "utkast");
    expect(d.jamforelse).toMatchObject({ sammaPsin: true, mattLika: true, fargLika: false, relation: "farg" });
    expect(JSON.stringify(d)).not.toMatch(/T-[12]|PSIN/);
  });

  it("en okänd sida ger ett fel, inte en gissning", () => {
    expect(diagnosPar(data, "sida", "finns-inte").fel).toMatch(/finns-inte/);
  });

  it("☠️ ett nummer inklistrat i stället för ett Wix-id ekas aldrig tillbaka", () => {
    expect(JSON.stringify(diagnosPar(data, "sida", "999-999ZZ"))).not.toContain("999-999ZZ");
  });
});

describe("verktygetIdag", () => {
  it("färg och storlek på en gång klarar verktyget inte", () => {
    const svar = hittaFamiljer(indata(
      [
        rad("T-1"),
        rad("T-2", { name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
        rad("T-3", { color: "Blau", name: "PawHut Hundebett Wolke 110 cm mit Kissen, waschbar", size: "110L x 85B x 24H cm", packageSize: "112x87x26 cm", weightKg: 5.1 }),
      ],
      [mappning("T-1", "gra-liten"), mappning("T-3", "bla-stor")],
      [wix("gra-liten", true), wix("bla-stor", false)],
    ));
    expect(svar.familjer[0]).toMatchObject({ typ: "farg_storlek", verktygetIdag: false });
  });

  it("samma vara två gånger är en pensionering, inte ett val", () => {
    const svar = hittaFamiljer(indata(
      [rad("T-1"), rad("T-2")],
      [mappning("T-1", "sida"), mappning("T-2", "utkast")],
      [wix("sida", true), wix("utkast", false)],
    ));
    expect(svar.familjer[0]).toMatchObject({ typ: "samma", verktygetIdag: false });
  });
});
