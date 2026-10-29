import { describe, expect, it } from "vitest";
import type { ImportResult } from "@/lib/import/pipeline";
import { mappingSupplier } from "@/lib/store/supplier";
import { valjVevorBilder } from "./bilder";
import { vevorGranskning } from "./granskning";
import { SIDFRAGA } from "./sida";
import { TESTSKU, testAvlasning, testSokvag } from "./testsida";
import {
  MAX_ALDER_IMPORT_MS,
  byggVevorMappning,
  importhinder,
  specifikation,
  textTillHtml,
  vevorProdukt,
  vevorSupplierProductId,
} from "./to-product";

// Påhittade nummer, priser och rabatter.
const NU = Date.parse("2026-10-29T12:00:00.000Z");
const PRIS = { rabatt: 0.0425, usdToSek: 10 };

describe("importhinder", () => {
  it("en färsk avläsning i lager, till Sverige från EU-lagret, kan importeras", () => {
    expect(importhinder(testAvlasning(), NU)).toBeNull();
  });

  it("allt annat har ett skäl", () => {
    expect(importhinder(testAvlasning({ status: "slut", saldo: 0 }), NU)).toBe("ej_i_lager");
    expect(importhinder(testAvlasning({ saldo: 0 }), NU)).toBe("ej_i_lager");
    expect(importhinder(testAvlasning({ levererasTillSe: false }), NU)).toBe("ej_levererbar");
    expect(importhinder(testAvlasning({ flode: "US" }), NU)).toBe("ej_levererbar");
    expect(importhinder(testAvlasning({ borta: true }), NU)).toBe("borta");
    expect(importhinder(testAvlasning({ misslyckadAt: "2026-10-29T11:00:00.000Z" }), NU)).toBe("misslyckad");
    const gammal = new Date(NU - MAX_ALDER_IMPORT_MS - 1).toISOString();
    expect(importhinder(testAvlasning({ lastAt: gammal }), NU)).toBe("gammal");
  });

  it("ett misslyckat försök före den giltiga avläsningen hindrar inte", () => {
    expect(importhinder(testAvlasning({ misslyckadAt: "2026-10-29T09:00:00.000Z" }), NU)).toBeNull();
  });
});

describe("vevorProdukt", () => {
  const a = testAvlasning();
  const p = vevorProdukt(a, PRIS, valjVevorBilder(a.bilder));

  it("id:t bär prefixet, och källan är den svenska sidan i kronor", () => {
    expect(p.supplierProductId).toBe(`vevor:${TESTSKU}`);
    expect(vevorSupplierProductId(TESTSKU)).toBe(p.supplierProductId);
    expect(p.sourceUrl).toBe(`https://eur.vevor.com${testSokvag()}${SIDFRAGA}`);
  });

  it("en variant: VEVOR:s saldo rakt av (buffert 0) och kostnaden ur prisregeln", () => {
    expect(p.variants).toHaveLength(1);
    const v = p.variants[0];
    expect(v.supplierVariantId).toBe(TESTSKU);
    expect(v.options).toEqual({});
    expect(v.stock).toBe(12);
    expect(v.included).toBe(true);
    // 1 240 / 1,24 × 0,9575 × 1,25 = 1 196,88 kr = 119,69 USD vid kursen 10
    expect(v.costUsd).toBe(119.69);
  });

  it("☠️ inget lagerland: ett påhittat land hade gett en EU-märkning vi inte kan stå för", () => {
    expect(p.shipsFrom).toEqual([]);
    expect(p.variants[0].shipFrom).toBeUndefined();
  });

  it("sex bilder, text, punkter och specifikation från sidan", () => {
    expect(p.imageUrls).toHaveLength(6);
    expect(p.rawTitle).toBe(a.namn);
    expect(p.features).toEqual(a.punkter);
    expect(p.specifications).toEqual({ Artikelmodellnummer: "TEST-1", "Maximal lastkapacitet": "90,7 kg", Färg: "Svart" });
  });

  it("☠️ artikelnumret står bara i id:na", () => {
    const utanId = JSON.stringify({ ...p, supplierProductId: "", variants: [], sourceUrl: "", imageUrls: [] });
    expect(utanId).not.toContain(TESTSKU);
  });
});

describe("specifikation och textTillHtml", () => {
  it("specifikationen går först, och en egenskap som redan står där läggs inte till igen", () => {
    expect(
      specifikation({ spec: [["Färg", "Svart"], [" ", "x"]], egenskaper: [["färg", "Röd"], ["Storlek", "Stor"]] }),
    ).toEqual({ Färg: "Svart", Storlek: "Stor" });
  });

  it("styckena escapas", () => {
    expect(textTillHtml("Rubrik\n\nTar <grus> & sand\n")).toBe("<p>Rubrik</p><p>Tar &lt;grus&gt; &amp; sand</p>");
  });
});

describe("byggVevorMappning", () => {
  const a = testAvlasning();
  const resultat = {
    wixProductId: "wix-1",
    supplierProductId: `vevor:${TESTSKU}`,
    seo: { title: "VEVOR Testvagn" },
    variantMappings: [{ supplierVariantId: TESTSKU, sku: "FP-testvagn", choices: {}, costUsd: 1, wixVariantId: "v1" }],
    slugSuffix: "-2",
  } as unknown as ImportResult;
  const g = vevorGranskning(a, valjVevorBilder(a.bilder));
  const m = byggVevorMappning(a, resultat, g, "2026-10-29T12:00:00.000Z");

  it("leverantören vevor, ett osynligt utkast som ska poleras, i EU-lagret utan land", () => {
    expect(m.supplier).toBe("vevor");
    expect(mappingSupplier(m)).toBe("vevor");
    expect(m.draftStatus).toBe("pending_review");
    expect(m.needsAiPolish).toBe(true);
    expect(m.hasEuWarehouse).toBe(true);
    expect(m.warehouseClass).toBe("EU");
    expect(m.shipsFromCountries).toEqual([]);
    expect(m.vevorGranskning).toEqual(g);
    expect(m.slugSuffix).toBe("-2");
    expect(m.variants[0].wixVariantId).toBe("v1");
  });
});
