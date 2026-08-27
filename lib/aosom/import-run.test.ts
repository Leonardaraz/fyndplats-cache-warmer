import { describe, it, expect, vi } from "vitest";
import { runAosomImport, buildMapping, RAW_FLAGS, type AosomImportDeps } from "./import-run";
import { aosomSupplierProductId } from "./to-product";
import type { AosomRow } from "./feed";
import type { ImportResult } from "../import/pipeline";
import type { AliExpressProduct } from "../import/types";
import type { ProductMappingRecord } from "../store";

const FX = { eurToSek: 11.1, usdToSek: 10.5 };

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: `Produkt ${sku}`,
    url: `https://www.aosom.de/item/x~${sku}.html`,
    imageUrls: ["https://img.aosomcdn.com/a.jpg", "https://img.aosomcdn.com/b.jpg"],
    category: "Haus & Wohnen",
    color: "Schwarz",
    material: "Stahl",
    size: "50L x 40B x 30H cm",
    packageSize: "55.00x45.00x35.00 cm",
    weightKg: 5,
    descriptionHtml: "<p>Text</p>",
    bulletsHtml: "<ul><li>Punkt</li></ul>",
    qty: 10,
    normalPriceEur: 100,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

function resultatFor(product: AliExpressProduct): ImportResult {
  return {
    wixProductId: `wix-${product.supplierProductId}`,
    slug: "slug",
    supplierProductId: product.supplierProductId,
    seo: { title: product.rawTitle, metaDescription: "", descriptionHtml: "", slug: "slug", suggestedCategory: "", imageAltTexts: [] },
    variantMappings: [
      { supplierVariantId: "v", sku: "FP-X", choices: {}, costUsd: 1, landedCostSek: 10, grossSek: 25 },
    ],
    imageAnalysis: [],
    categorySuggestion: { collectionSlug: null, confidence: 0, reason: "", status: "uncategorized" },
    stockQuantity: 10,
    shipsFromCountries: ["DE"],
    hasEuWarehouse: true,
    warehouseClass: "EU",
    needsAiPolish: true,
  } as unknown as ImportResult;
}

function deps(rows: AosomRow[], over: Partial<AosomImportDeps> = {}): AosomImportDeps & {
  sparade: ProductMappingRecord[];
  importerade: AliExpressProduct[];
} {
  const sparade: ProductMappingRecord[] = [];
  const importerade: AliExpressProduct[] = [];
  return {
    fetchFeed: async () => rows,
    listMappings: async () => [],
    importOne: async (p) => {
      importerade.push(p);
      return resultatFor(p);
    },
    saveMapping: async (m) => {
      sparade.push(m);
    },
    fx: FX,
    sparade,
    importerade,
    ...over,
  };
}

describe("torrkörning", () => {
  it("är default — utan dryRun:false skrivs ingenting", async () => {
    const d = deps([rad("A-1"), rad("A-2")]);
    const s = await runAosomImport(d);
    expect(s.dryRun).toBe(true);
    expect(s.imported).toBe(2);
    expect(d.sparade).toHaveLength(0);
    expect(d.importerade).toHaveLength(0);
  });

  it("räknar ändå fram vad som skulle göras, inklusive bildvolymen", async () => {
    const s = await runAosomImport(deps([rad("A-1"), rad("A-2"), rad("A-3")]));
    expect(s.shippable).toBe(3);
    expect(s.remainingImages).toBe(6);
  });
});

describe("urval", () => {
  it("släpper bara igenom rader som går att frakta hit", async () => {
    const s = await runAosomImport(
      deps([rad("A-1"), rad("A-2", { qty: 0 }), rad("A-3", { seFreightEur: 999.9 })]),
    );
    expect(s.feedRows).toBe(3);
    expect(s.shippable).toBe(1);
  });

  it("hoppar över det som redan importerats — omkörning är en no-op", async () => {
    const d = deps([rad("A-1"), rad("A-2")], {
      listMappings: async () => [
        { supplier: "aosom", supplierProductId: aosomSupplierProductId("A-1") },
      ],
    });
    const s = await runAosomImport(d, { dryRun: false });
    expect(s.alreadyImported).toBe(1);
    expect(s.imported).toBe(1);
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["aosom:A-2"]);
  });

  it("skipFreightHeavy lämnar raderna där frakten är dyrare än varan", async () => {
    const s = await runAosomImport(
      deps([rad("A-1"), rad("A-2", { wholesaleEur: 10, seFreightEur: 25 })]),
      { skipFreightHeavy: true },
    );
    expect(s.skippedFreightHeavy).toBe(1);
    expect(s.imported).toBe(1);
  });

  it("men tar dem som default — Leonard bad om allt som går att frakta hit", async () => {
    const s = await runAosomImport(deps([rad("A-1"), rad("A-2", { wholesaleEur: 10, seFreightEur: 25 })]));
    expect(s.skippedFreightHeavy).toBe(0);
    expect(s.imported).toBe(2);
  });

  it("onlySkus kör riktat", async () => {
    const d = deps([rad("A-1"), rad("A-2"), rad("A-3")]);
    const s = await runAosomImport(d, { dryRun: false, onlySkus: ["A-2"] });
    expect(s.imported).toBe(1);
    expect(d.sparade[0].supplierProductId).toBe("aosom:A-2");
  });
});

describe("markör och återupptagning", () => {
  it("sorterar deterministiskt på artikelnummer", async () => {
    const d = deps([rad("C-1"), rad("A-1"), rad("B-1")]);
    await runAosomImport(d, { dryRun: false });
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["aosom:A-1", "aosom:B-1", "aosom:C-1"]);
  });

  it("stannar på limit och lämnar en markör att fortsätta från", async () => {
    const rows = [rad("A-1"), rad("A-2"), rad("A-3")];
    const s1 = await runAosomImport(deps(rows), { limit: 2 });
    expect(s1.imported).toBe(2);
    expect(s1.stoppedBy).toBe("limit");
    expect(s1.cursor).toBe("A-2");
    expect(s1.remaining).toBe(1);

    const d2 = deps(rows);
    const s2 = await runAosomImport(d2, { dryRun: false, after: s1.cursor! });
    expect(d2.sparade.map((m) => m.supplierProductId)).toEqual(["aosom:A-3"]);
    expect(s2.cursor).toBeNull();
    expect(s2.stoppedBy).toBe("klart");
  });

  it("nollar markören när allt är klart", async () => {
    const s = await runAosomImport(deps([rad("A-1")]));
    expect(s.cursor).toBeNull();
    expect(s.remaining).toBe(0);
  });
});

describe("tidsbudget", () => {
  it("stannar FÖRE en produkt, aldrig mitt i — halva bilder utan mappningsrad vore värre", async () => {
    let t = 0;
    const d = deps([rad("A-1"), rad("A-2"), rad("A-3")], {
      // Varje klockavläsning kostar 100 ms; budgeten spricker efter första varvet.
      now: () => (t += 100),
    });
    const s = await runAosomImport(d, { dryRun: false, timeBudgetMs: 150 });
    expect(s.stoppedBy).toBe("tidsbudget");
    expect(s.attempted).toBe(1);
    expect(d.sparade).toHaveLength(1);
  });
});

describe("fel", () => {
  it("fastnar inte på en trasig rad — markören flyttas ändå", async () => {
    const d = deps([rad("A-1"), rad("A-2")], {
      importOne: async (p) => {
        if (p.supplierProductId === "aosom:A-1") throw new Error("Wix svarade 400");
        return resultatFor(p);
      },
    });
    const s = await runAosomImport(d, { dryRun: false });
    expect(s.failed).toBe(1);
    expect(s.imported).toBe(1);
    expect(s.errors).toEqual([{ sku: "A-1", error: "Wix svarade 400" }]);
    expect(s.cursor).toBeNull();
    expect(d.sparade.map((m) => m.supplierProductId)).toEqual(["aosom:A-2"]);
  });

  it("ett fel mitt i lämnar en markör efter den trasiga raden, inte före", async () => {
    const d = deps([rad("A-1"), rad("A-2"), rad("A-3")], {
      importOne: async () => {
        throw new Error("nere");
      },
    });
    const s = await runAosomImport(d, { dryRun: false, limit: 2 });
    expect(s.cursor).toBe("A-2");
    expect(s.failed).toBe(2);
  });
});

describe("mappningsraden", () => {
  it("bär supplier, utkaststatus och poleringsflaggan", async () => {
    const d = deps([rad("A-1")]);
    await runAosomImport(d, { dryRun: false });
    const m = d.sparade[0];
    expect(m.supplier).toBe("aosom");
    expect(m.draftStatus).toBe("pending_review");
    expect(m.needsAiPolish).toBe(true);
    expect(m.supplierProductId).toBe("aosom:A-1");
    expect(m.sourceUrl).toBe("https://www.aosom.de/item/x~A-1.html");
    expect(m.warehouseClass).toBe("EU");
  });

  it("sparar fraktandelen så poleringskön kan sortera de lönsamma först", async () => {
    const d = deps([rad("A-1", { wholesaleEur: 20, seFreightEur: 24 })]);
    await runAosomImport(d, { dryRun: false });
    expect(d.sparade[0].aosomFreightShare).toBeCloseTo(0.545, 3);
  });

  it("needsAiPolish sätts även om pipelinen inte flaggade — texten är tysk", () => {
    const utan = { ...resultatFor({ supplierProductId: "aosom:A-1", rawTitle: "x" } as AliExpressProduct) };
    delete (utan as unknown as Record<string, unknown>).needsAiPolish;
    expect(buildMapping(rad("A-1"), utan).needsAiPolish).toBe(true);
  });
});

describe("läget", () => {
  it("är alltid rått — det är det som håller produkten osynlig", () => {
    expect(RAW_FLAGS.qualityMode).toBe("raw");
    expect(RAW_FLAGS.enableAI).toBe(false);
  });

  it("importOne får produkten som adaptern byggt den", async () => {
    const d = deps([rad("A-1")]);
    await runAosomImport(d, { dryRun: false });
    const p = d.importerade[0];
    expect(p.supplierProductId).toBe("aosom:A-1");
    expect(p.variants).toHaveLength(1);
    // (40 + 20) × 11,10 / 10,5 = 63,43 USD → landat 666 kr.
    expect(p.variants[0].costUsd).toBeCloseTo(63.43, 2);
  });
});

describe("tomt fall", () => {
  it("en feed utan fraktbara rader ger en tom, felfri sammanfattning", async () => {
    const s = await runAosomImport(deps([rad("A-1", { qty: 0 })]));
    expect(s).toMatchObject({ shippable: 0, attempted: 0, imported: 0, failed: 0, cursor: null, stoppedBy: "klart" });
  });

  it("fetchFeed som kastar bubblar upp — en trasig feed ska synas, inte tigas ihjäl", async () => {
    const d = deps([], { fetchFeed: async () => { throw new Error("503"); } });
    await expect(runAosomImport(d)).rejects.toThrow("503");
  });
});
