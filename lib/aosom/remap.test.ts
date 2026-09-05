import { describe, it, expect } from "vitest";
import {
  MIN_REMAP_MARGIN_PCT,
  landadInklMoms,
  pensioneraDubblett,
  planeraOmmappning,
  tillämpaOmmappning,
} from "./remap";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import { mappingSupplier } from "../store/supplier";

const FX = { eurToSek: 11, usdToSek: 10 };

function rad(over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku: "845-030CG",
    name: "Hundbur",
    url: "https://www.aosom.de/p/845-030CG",
    imageUrls: [],
    category: "",
    color: "",
    material: "",
    size: "",
    packageSize: "",
    weightKg: 10,
    descriptionHtml: "",
    bulletsHtml: "",
    qty: 12,
    normalPriceEur: 443.9,
    wholesaleEur: 100,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

function mappning(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: "1005005972133031",
    wixProductId: "wix-1",
    draftStatus: "published",
    seoTitle: "Hundbur i metall",
    createdAt: "2026-07-01T00:00:00.000Z",
    shipsFromCountries: ["ES"],
    hasEuWarehouse: true,
    reviewsCheckedAt: "2026-08-01T00:00:00.000Z",
    variants: [
      {
        supplierVariantId: "12000039",
        sku: "FP-hundbur",
        wixVariantId: "wv1",
        choices: {},
        costUsd: 120,
        landedCostSek: 1200,
        // 1 320 kr netto-intäkt mot 1 200 kr brutto-kostnad ⇒ ~27 % marginal
        grossSek: 1999,
        shippableToSe: false,
        shippabilityManual: true,
      },
    ],
    ...over,
  } as ProductMappingRecord;
}

const INGA_ANDRA: Parameters<typeof planeraOmmappning>[0]["alla"] = [];

describe("planeraOmmappning", () => {
  it("planerar ett rent byte utan hinder", () => {
    const p = planeraOmmappning({ mappning: mappning(), rad: rad(), alla: INGA_ANDRA, fx: FX });
    expect(p.hinder).toEqual([]);
    expect(p.sku).toBe("845-030CG");
    expect(p.frånLeverantör).toBe("aliexpress");
    // (100 + 20) × 11 × 1,25 = 1 650
    expect(p.nyLandadSek).toBe(1650);
    expect(p.nyCostUsd).toBe(165);
    expect(p.fraktandel).toBeCloseTo(0.167, 3);
    expect(p.prisSek).toBe(1999);
  });

  it("räknar marginalen netto mot netto och rapporterar båda sidor", () => {
    const p = planeraOmmappning({ mappning: mappning(), rad: rad(), alla: INGA_ANDRA, fx: FX });
    // (1999/1,25 − 1650/1,25) / (1999/1,25) = 17,46 %
    expect(p.nyMarginalPct).toBeCloseTo(17.46, 1);
    expect(p.gammalMarginalPct).toBeCloseTo(39.97, 1);
  });

  it("☠️ vägrar när marginalen hamnar under golvet", () => {
    // Frakten ensam äter påslaget: (100 + 60) × 11 × 1,25 = 2 200 > priset.
    const p = planeraOmmappning({
      mappning: mappning(),
      rad: rad({ seFreightEur: 60 }),
      alla: INGA_ANDRA,
      fx: FX,
    });
    expect(p.hinder).toContain("marginal_under_golv");
    expect(p.nyMarginalPct!).toBeLessThan(MIN_REMAP_MARGIN_PCT);
  });

  it("vägrar en rad som inte går att skicka till Sverige", () => {
    const p = planeraOmmappning({
      mappning: mappning(),
      rad: rad({ qty: 0 }),
      alla: INGA_ANDRA,
      fx: FX,
    });
    expect(p.hinder).toContain("ej_skeppbar_till_se");
  });

  it("vägrar när SKU:n saknas i feeden", () => {
    const p = planeraOmmappning({ mappning: mappning(), rad: undefined, alla: INGA_ANDRA, fx: FX });
    expect(p.hinder).toContain("saknas_i_feeden");
  });

  it("är idempotent: en rad som redan är Aosom flaggas", () => {
    const p = planeraOmmappning({
      mappning: mappning({ supplierProductId: "aosom:845-030CG", supplier: "aosom" }),
      rad: rad(),
      alla: INGA_ANDRA,
      fx: FX,
    });
    expect(p.hinder).toContain("redan_aosom");
  });

  it("☠️ vägrar när artikelnumret redan sitter på en ANNAN produkt", () => {
    // Att peka två Wix-produkter på samma artikel skapar exakt den dubblett
    // ommappningen finns för att ta bort.
    const p = planeraOmmappning({
      mappning: mappning(),
      rad: rad(),
      alla: [{ supplierProductId: "aosom:845-030CG", wixProductId: "wix-2", supplier: "aosom" }],
      fx: FX,
    });
    expect(p.hinder).toContain("skun_upptagen");
  });

  it("tillåter att raden pekar på sig själv (omkörning av samma par)", () => {
    const p = planeraOmmappning({
      mappning: mappning(),
      rad: rad(),
      alla: [{ supplierProductId: "aosom:845-030CG", wixProductId: "wix-1", supplier: "aosom" }],
      fx: FX,
    });
    expect(p.hinder).not.toContain("skun_upptagen");
  });

  it("☠️ räknar INTE den rad anroparen pekat ut som dubblett", () => {
    // Så hittas en äkta dubblett: Aosom-utkastet ÄR beviset, och det bär
    // artikelnumret. Räknades det som "upptaget" hade grinden fällt varje
    // ommappning som gjorts på rätt sätt — uppmätt på båda de lönsamma paren
    // 2026-09-03.
    const p = planeraOmmappning({
      mappning: mappning(),
      rad: rad(),
      alla: [{ supplierProductId: "aosom:845-030CG", wixProductId: "wix-2", supplier: "aosom" }],
      fx: FX,
      dubblett: "wix-2",
    });
    expect(p.hinder).not.toContain("skun_upptagen");
  });

  it("☠️ fäller ändå när numret sitter på en TREDJE rad", () => {
    // Undantaget gäller exakt den utpekade dubbletten, inte "någon annan rad".
    const p = planeraOmmappning({
      mappning: mappning(),
      rad: rad(),
      alla: [
        { supplierProductId: "aosom:845-030CG", wixProductId: "wix-2", supplier: "aosom" },
        { supplierProductId: "aosom:845-030CG", wixProductId: "wix-3", supplier: "aosom" },
      ],
      fx: FX,
      dubblett: "wix-2",
    });
    expect(p.hinder).toContain("skun_upptagen");
  });

  it("☠️ vägrar en flervariantssida", () => {
    // En Aosom-rad ÄR en artikel. Alla varianter hade pekat på samma nummer,
    // och då beställs fel färg så fort kunden väljer den andra.
    const m = mappning();
    const p = planeraOmmappning({
      mappning: mappning({ variants: [m.variants[0], { ...m.variants[0], wixVariantId: "wv2" }] }),
      rad: rad(),
      alla: INGA_ANDRA,
      fx: FX,
    });
    expect(p.hinder).toContain("flera_varianter");
  });

  it("vägrar när priset saknas — marginalen går inte att bedöma", () => {
    const m = mappning();
    const p = planeraOmmappning({
      mappning: mappning({ variants: [{ ...m.variants[0], grossSek: 0 }] }),
      rad: rad(),
      alla: INGA_ANDRA,
      fx: FX,
    });
    expect(p.hinder).toContain("pris_okant");
  });
});

describe("tillämpaOmmappning", () => {
  const ny = tillämpaOmmappning(mappning(), rad(), FX);

  it("byter leverantör, id och källa", () => {
    expect(ny.supplier).toBe("aosom");
    expect(ny.supplierProductId).toBe("aosom:845-030CG");
    expect(ny.sourceUrl).toBe("https://www.aosom.de/p/845-030CG");
    expect(ny.aosomFreightShare).toBeCloseTo(0.167, 3);
  });

  it("☠️ behåller allt som beskriver WIX-produkten", () => {
    // En rad byggd från grunden hade raderat dem, och en rad utan draftStatus
    // försvinner ur /admin/queue helt.
    expect(ny.draftStatus).toBe("published");
    expect(ny.seoTitle).toBe("Hundbur i metall");
    expect(ny.createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(ny.wixProductId).toBe("wix-1");
  });

  it("☠️ nollar allt som beskrev den gamla AE-listningen", () => {
    expect(ny.shipsFromCountries).toBeUndefined();
    expect(ny.hasEuWarehouse).toBeUndefined();
    expect(ny.reviewsCheckedAt).toBeUndefined();
    expect(ny.variants[0].shippableToSe).toBeUndefined();
    expect(ny.variants[0].shippabilityManual).toBeUndefined();
  });

  it("☠️ skriver kostnaden men RÖR ALDRIG priset", () => {
    expect(ny.variants[0].landedCostSek).toBe(1650);
    expect(ny.variants[0].costUsd).toBe(165);
    expect(ny.variants[0].supplierVariantId).toBe("845-030CG");
    expect(ny.variants[0].grossSek).toBe(1999);
    expect(ny.variants[0].sku).toBe("FP-hundbur");
  });

  it("☠️ bruttar upp med moms — annars blir auktionens golvbud 20 % för lågt", () => {
    // Aosoms B2B-faktura är NETTO; landedCostSek läses som BRUTTO.
    expect(landadInklMoms(rad(), FX.eurToSek)).toBeCloseTo((100 + 20) * 11 * 1.25, 6);
  });
});

describe("pensioneraDubblett", () => {
  it("tar dubbletten ur poleringskön utan att radera den", () => {
    const d = pensioneraDubblett(mappning({ wixProductId: "wix-2", needsAiPolish: true }));
    expect(d.draftStatus).toBe("rejected");
    expect(d.needsAiPolish).toBe(false);
    expect(d.wixProductId).toBe("wix-2");
    expect(d.reviewedAt).toBeTruthy();
  });

  it("☠️ släpper artikelnumret — annars bär två rader samma", () => {
    // Numret följer den levande sidan. Två bärare gör frågan "vilken produkt
    // köper vi artikeln som?" tvetydig och får Aosom-synken att skriva till båda.
    const d = pensioneraDubblett(
      mappning({ wixProductId: "wix-2", supplierProductId: "aosom:845-030CG" }),
    );
    expect(d.supplierProductId).toBe("");
  });

  it("☠️ fryser leverantören innan numret försvinner", () => {
    // Utan `supplier` faller mappingSupplier tillbaka på `aosom:`-prefixet. En
    // tömd rad hade klassats som AliExpress och gått in i sync-all:s omöjliga
    // uppslag — den rutten NOLLAR lagret vid `offline`.
    const d = pensioneraDubblett(
      mappning({
        wixProductId: "wix-2",
        supplierProductId: "aosom:845-030CG",
        supplier: undefined,
      }),
    );
    expect(mappingSupplier(d)).toBe("aosom");
  });

  // ☠️ BUTIKEN AR FACIT, INTE MAPPNINGEN.
  //
  // Uppmatt 2026-09-05 pa kontorsstolen f13cd415: mappningen bar grossSek 879
  // medan kunden precis hade betalat 1 299 i butiken. Marginalgrinden raknade
  // pa 879, fick -2,41 % och fallde en ommappning som i verkligheten gav
  // +30,7 %. Exakt samma forvaxling som `jamforelsePris` byggdes for i synken
  // 2026-09-02, pa ett annat stalle.
  describe("butikens pris vinner over mappningens", () => {
    it("anvander butikens pris nar det lasts, och sager varifran det kom", () => {
      const p = planeraOmmappning({
        mappning: mappning(),
        rad: rad(),
        alla: INGA_ANDRA,
        fx: FX,
        butikensPrisSek: 2999,
      });
      expect(p.prisSek).toBe(2999);
      expect(p.prisKalla).toBe("butik");
      // Hogre pris an mappningens 1999 ⇒ battre marginal an de 17,46 % ovan.
      expect(p.nyMarginalPct).toBeGreaterThan(17.46);
    });

    it("faller tillbaka pa mappningen nar butiken inte lastes", () => {
      const p = planeraOmmappning({ mappning: mappning(), rad: rad(), alla: INGA_ANDRA, fx: FX });
      expect(p.prisSek).toBe(1999);
      expect(p.prisKalla).toBe("mappning");
    });

    it("ett noll- eller negativt butikspris ar inget pris — mappningen galler", () => {
      for (const dumt of [0, -1, null]) {
        const p = planeraOmmappning({
          mappning: mappning(),
          rad: rad(),
          alla: INGA_ANDRA,
          fx: FX,
          butikensPrisSek: dumt,
        });
        expect(p.prisSek).toBe(1999);
        expect(p.prisKalla).toBe("mappning");
      }
    });

    it("☠️ ett gammalt mappningspris far inte falla en lonsam ommappning", () => {
      // Kontorsstolen, med riktiga tal: landat 900,21 mot butikens 1 299.
      const stol = mappning({
        variants: [
          {
            supplierVariantId: "14:771",
            sku: "FP-kontorsstol-mesh-beige",
            wixVariantId: "wv1",
            choices: {},
            costUsd: 63.7,
            landedCostSek: 668.8,
            grossSek: 879, // GAMMALT — kunden betalade 1 299
            shippableToSe: true,
            shippabilityManual: true,
          },
        ],
      } as never);
      // 900,21 = (wholesale + frakt) × 11 × 1,25 ⇒ 65,47 EUR
      const stolrad = rad({ sku: "921-672V00BG", wholesaleEur: 45.47, seFreightEur: 20 });

      const paMappningen = planeraOmmappning({
        mappning: stol, rad: stolrad, alla: INGA_ANDRA, fx: FX,
      });
      expect(paMappningen.hinder).toContain("marginal_under_golv");

      const paButiken = planeraOmmappning({
        mappning: stol, rad: stolrad, alla: INGA_ANDRA, fx: FX, butikensPrisSek: 1299,
      });
      expect(paButiken.hinder).not.toContain("marginal_under_golv");
      expect(paButiken.nyMarginalPct).toBeGreaterThan(MIN_REMAP_MARGIN_PCT);
    });
  });

  // Leonards beslut 2026-09-05: alla Aosom-varor kopta via AliExpress ska peka
  // om "oavsett om de ar billigare eller inte". Golvet ar darfor sankbart —
  // men bara medvetet, per anrop, och det hamnar i audit-raden.
  it("minMarginPct sanker golvet, och default ligger kvar", () => {
    const tunn = rad({ wholesaleEur: 100, seFreightEur: 60 });
    const utan = planeraOmmappning({ mappning: mappning(), rad: tunn, alla: INGA_ANDRA, fx: FX });
    expect(utan.hinder).toContain("marginal_under_golv");

    const med = planeraOmmappning({
      mappning: mappning(), rad: tunn, alla: INGA_ANDRA, fx: FX, minMarginPct: -100,
    });
    expect(med.hinder).not.toContain("marginal_under_golv");
  });

});
