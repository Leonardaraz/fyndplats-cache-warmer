import { describe, expect, it } from "vitest";
import type { ImportResult } from "@/lib/import/pipeline";
import { mappingSupplier } from "@/lib/store/supplier";
import { valjVevorBilder } from "./bilder";
import { vevorGranskning } from "./granskning";
import { SIDFRAGA } from "./sida";
import { TESTSKU, testAvlasning, testSokvag } from "./testsida";
import {
  BETYG_GRANS,
  BETYG_MIN_ANTAL,
  MAX_ALDER_IMPORT_MS,
  betygshinder,
  byggVevorMappning,
  importhinder,
  medlemshinder,
  recensionshinder,
  rensaBeskrivning,
  spechinder,
  vevorRecensioner,
  arIdentifierarRad,
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
    // ☠️ Artikelmodellnummer står på sidan men aldrig hos oss (Leonard 2026-10-31).
    expect(p.specifications).toEqual({ "Maximal lastkapacitet": "90,7 kg", Färg: "Svart" });
  });

  it("☠️ artikelnumret står bara i id:na", () => {
    const utanId = JSON.stringify({ ...p, supplierProductId: "", variants: [], sourceUrl: "", imageUrls: [] });
    expect(utanId).not.toContain(TESTSKU);
  });
});

describe("☠️ VEVOR:s modell- och artikelnummer når aldrig specifikationen (Leonard 2026-10-31)", () => {
  it("raderna som bär ett nummer tas bort, i tabellen och bland egenskaperna", () => {
    const spec: [string, string][] = [
      ["Artikelmodellnummer", "TEST-1"],
      ["Artikelnummer", "#TEST2"],
      ["Artikelnummer Modell", "TEST3"],
      ["Produktmodell", "TEST-4"],
      ["Modellnummer", "TEST-5"],
      ["Artikelmodell", "TEST-6"],
      ["ltem modellnummer", "TEST--7"],
      ["Modell", "TEST-8"],
      ["Färg", "Svart"],
    ];
    expect(specifikation({ spec, egenskaper: [["Modellnummer:", "TEST-9"], ["Storlek", "Stor"]] })).toEqual({
      Färg: "Svart",
      Storlek: "Stor",
    });
  });

  it("en modell med ord står kvar, och raderna om vad varan passar till står kvar", () => {
    const spec: [string, string][] = [
      ["Modell", "Premium"],
      ["Kompatibel bilmodell", "Testbil 2015-2020"],
      ["Fordonsmodell", "Testbil 2018"],
      ["OE-nummer", "1234567"],
    ];
    expect(specifikation({ spec, egenskaper: [] })).toEqual({
      Modell: "Premium",
      "Kompatibel bilmodell": "Testbil 2015-2020",
      Fordonsmodell: "Testbil 2018",
      "OE-nummer": "1234567",
    });
  });

  it("regeln är etikettens, inte formens", () => {
    expect(arIdentifierarRad("ARTIKELMODELLNUMMER", "x")).toBe(true);
    expect(arIdentifierarRad(" Artikel  nummer ", "x")).toBe(false);
    expect(arIdentifierarRad("Modell", "TEST 123")).toBe(true);
    expect(arIdentifierarRad("Modell", "Basmodell 2")).toBe(false);
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

describe("rensaBeskrivning", () => {
  // Formen är uppmätt på VEVOR:s svenska sidor 2026-10-30; varutexten är påhittad.
  const reklam = [
    "Vevor är ett ledande varumärke som är specialiserat på utrustning och verktyg. Tillsammans med tusentals anställda.",
    "Varför välja VeVor?",
    "Premium tuff kvalitet",
    "Otroligt låga priser",
    "Snabb och säker leverans",
    "30-dagars gratis retur",
    "24/7 uppmärksam service",
  ];
  const vara = ["Nyckelfunktioner", "Testlampa i stål", "Lyser i åtta timmar", "Specifikationer", "Material: Stål", "Paketets innehåll", "1 x Testlampa"];

  it("☠️ VEVOR:s reklam och upprepade rader försvinner, varan och rubrikerna står kvar", () => {
    const text = [...vara.slice(0, 3), ...reklam, "Prestanda på proffsnivå utan kostnad", ...reklam, ...vara, ...vara].join("\n");
    expect(rensaBeskrivning(text).split("\n")).toEqual(vara);
  });

  it("en rad som bara liknar reklamen, eller nämner returer, står kvar", () => {
    const text = "Snabb och säker leverans av vatten till trädgården\nGratis retur gäller inte här\nVEVOR-lampan tål regn";
    expect(rensaBeskrivning(text)).toBe(text);
  });

  it("jämförelsen tål versaler och extra mellanslag, och utkastets text byggs av den rensade", () => {
    expect(rensaBeskrivning("Material:  Stål\nmaterial: stål\n  30-DAGARS gratis   retur ")).toBe("Material: Stål");
    const p = vevorProdukt(testAvlasning({ beskrivning: ["Testlampa", ...reklam, "Testlampa"].join("\n") }), PRIS, valjVevorBilder([]));
    expect(p.rawDescription).toBe("Testlampa");
    expect(p.descriptionHtml).toBe("<p>Testlampa</p>");
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

  it("vevorArtiklar bär radens artikel och varianternas, med prefix, en gång var", () => {
    expect(m.vevorArtiklar).toEqual([`vevor:${TESTSKU}`]);
    const familj = byggVevorMappning(
      a,
      {
        ...resultat,
        variantMappings: [
          { supplierVariantId: TESTSKU, sku: "FP-a", choices: { Typ: "A" }, costUsd: 1, wixVariantId: "v1" },
          { supplierVariantId: "TESTSKUSYSKON000002", sku: "FP-b", choices: { Typ: "B" }, costUsd: 1, wixVariantId: "v2" },
        ],
      } as unknown as ImportResult,
      g,
      "2026-10-29T12:00:00.000Z",
    );
    expect(familj.vevorArtiklar).toEqual([`vevor:${TESTSKU}`, "vevor:TESTSKUSYSKON000002"]);
  });
});

describe("betyget (steg 8)", () => {
  it(`☠️ under ${BETYG_GRANS} med minst ${BETYG_MIN_ANTAL} recensioner stoppar importen`, () => {
    expect(betygshinder({ betyg: { snitt: 3.79, antal: 5 } })).toBe("lagt_betyg");
    expect(importhinder(testAvlasning({ betyg: { snitt: 2.81, antal: 16 } }), NU)).toBe("lagt_betyg");
  });

  it("färre recensioner, eller ett betyg på gränsen, stoppar inte", () => {
    expect(betygshinder({ betyg: { snitt: 3.79, antal: 4 } })).toBeNull();
    expect(betygshinder({ betyg: { snitt: 3.8, antal: 196 } })).toBeNull();
    expect(betygshinder({ betyg: { snitt: 5, antal: 1 } })).toBeNull();
  });

  it("☠️ en avläsning från före steg 8 väntar, en sida utan betyg gör det inte", () => {
    expect(betygshinder({ betyg: undefined })).toBe("betyg_okant");
    expect(importhinder(testAvlasning({ betyg: undefined }), NU)).toBe("betyg_okant");
    expect(betygshinder({ betyg: null })).toBeNull();
  });

  it("lagret och leveransen går före betyget", () => {
    expect(importhinder(testAvlasning({ saldo: 0, betyg: { snitt: 1, antal: 50 } }), NU)).toBe("ej_i_lager");
    expect(importhinder(testAvlasning({ borta: true, betyg: undefined }), NU)).toBe("borta");
  });

  it("ett syskon som är slut får följa med en familj, men inte med lågt betyg", () => {
    expect(medlemshinder(testAvlasning({ status: "slut", saldo: 0 }), NU)).toBeNull();
    expect(medlemshinder(testAvlasning({ status: "slut", saldo: 0, betyg: { snitt: 3, antal: 9 } }), NU)).toBe("lagt_betyg");
    expect(medlemshinder(testAvlasning({ levererasTillSe: false }), NU)).toBe("ej_levererbar");
  });
});

describe("☠️ specifikationen från den gamla läsaren (2026-10-30)", () => {
  const utan = { spec: [] as [string, string][], punkter: [] as string[] };

  it("en avläsning utan specifikation och punktlista från före lagningen väntar på nästa läsning", () => {
    expect(spechinder({ ...utan, specKalla: undefined })).toBe("spec_okant");
    expect(importhinder(testAvlasning({ ...utan, specKalla: undefined }), NU)).toBe("spec_okant");
  });

  it("den lagade läsaren säger var specifikationen kom ifrån, och då är en tom sida inget hinder", () => {
    expect(spechinder({ ...utan, specKalla: null })).toBeNull();
    expect(spechinder({ ...utan, specKalla: "data" })).toBeNull();
  });

  it("en gammal avläsning som har specifikationen eller punktlistan är redan hel", () => {
    expect(spechinder({ spec: [["Antal", "4 st"]], punkter: [], specKalla: undefined })).toBeNull();
    expect(spechinder({ spec: [], punkter: ["Stark."], specKalla: undefined })).toBeNull();
  });

  it("lagret och betyget går före, och ☠️ ett syskon i en familj behöver sin specifikation (2026-10-30)", () => {
    expect(importhinder(testAvlasning({ ...utan, saldo: 0 }), NU)).toBe("ej_i_lager");
    expect(importhinder(testAvlasning({ ...utan, betyg: undefined }), NU)).toBe("betyg_okant");
    // Familjens flik visar varje varians värde, så ett syskon utan specifikation väntar.
    expect(medlemshinder(testAvlasning({ ...utan }), NU)).toBe("spec_okant");
    expect(medlemshinder(testAvlasning({ ...utan, saldo: 0, status: "slut" }), NU)).toBe("spec_okant");
    expect(medlemshinder(testAvlasning({ ...utan, betyg: undefined }), NU)).toBe("betyg_okant");
    expect(medlemshinder(testAvlasning({ saldo: 0, status: "slut" }), NU)).toBeNull();
  });
});

describe("recensionshinder (2026-10-30)", () => {
  it("☠️ en avläsning från före 2026-10-30 säger inte vilken artikel recensionerna gäller och väntar", () => {
    const gammal = { betyg: 5, text: "Gammal.", datum: null, namn: null };
    expect(recensionshinder({ recensioner: [gammal] })).toBe("recension_okand");
    expect(importhinder(testAvlasning({ recensioner: [gammal] }), NU)).toBe("recension_okand");
    // En recension vars artikel inte gick att avgöra (null) är inget hinder: den tas bara inte med.
    expect(recensionshinder({ recensioner: [{ ...gammal, artikel: null }] })).toBeNull();
    expect(recensionshinder({ recensioner: [] })).toBeNull();
    expect(recensionshinder({})).toBeNull();
  });
});

describe("vevorRecensioner", () => {
  it("sidans recensioner i importens format, utan tomma fält", () => {
    expect(
      vevorRecensioner({
        recensioner: [
          { betyg: 5, text: "Stabil och bra.", datum: "2026-09-14", namn: "Test P." },
          { betyg: 4, text: "Funkar.", datum: null, namn: null },
        ],
      }),
    ).toEqual([
      { rating: 5, text: "Stabil och bra.", date: "2026-09-14", customerName: "Test P." },
      { rating: 4, text: "Funkar." },
    ]);
    expect(vevorRecensioner({})).toEqual([]);
  });

  it("☠️ med artiklar tas bara recensioner om dem med, aldrig en vars artikel är okänd", () => {
    const r = (text: string, artikel?: string | null) => ({ betyg: 5, text, datum: null, namn: null, artikel });
    const recensioner = [r("Egen.", "TESTSKUA0000001"), r("Annan.", "TESTSKUB0000001"), r("Okänd.", null), r("Gammal.")];
    expect(vevorRecensioner({ recensioner }, new Set(["TESTSKUA0000001"])).map((x) => x.text)).toEqual(["Egen."]);
    // Utan artiklar: alla, som förut.
    expect(vevorRecensioner({ recensioner })).toHaveLength(4);
  });

  it("recensionen bär sin artikel när avläsningen vet den (poleringen läser den)", () => {
    const r = (text: string, artikel?: string | null) => ({ betyg: 5, text, datum: null, namn: null, artikel });
    const ut = vevorRecensioner({ recensioner: [r("Egen.", "TESTSKUA0000001"), r("Okänd.", null)] });
    expect(ut.map((x) => x.vevorArtikel)).toEqual(["TESTSKUA0000001", undefined]);
  });

  it("kundens foton följer med recensionen", () => {
    const foto = "https://adsimg-custom.vevorstatic.com/upload/vevor/review/20261001/testfoto.jpeg?format=webp";
    expect(
      vevorRecensioner({ recensioner: [{ betyg: 5, text: "Med foto.", datum: null, namn: null, bilder: [foto] }] }),
    ).toEqual([{ rating: 5, text: "Med foto.", imageUrls: [foto], hasImage: true }]);
  });
});
