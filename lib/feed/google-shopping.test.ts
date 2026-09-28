import { describe, it, expect } from "vitest";
import {
  KOLUMNER,
  byggTillaggsfeed,
  konkurrenslage,
  prisband,
  tillTsv,
} from "./google-shopping";
import type { ProductMappingRecord } from "../store";
import type { WixProduktPris } from "../wix/v3-products";

const NR = "83B-129V00GY";

/** Variantens Wix-id är i verkligheten ett uuid — fixturen får inte råka bära artikelnumret. */
const variantId = (nr: string) => `v-${Buffer.from(nr).toString("hex")}`;

function mappning(nr: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${nr}`,
    supplier: "aosom",
    wixProductId: `wix-${nr}`,
    variants: [{ supplierVariantId: nr, sku: `FP-${nr}`, wixVariantId: variantId(nr), choices: {}, costUsd: 1, landedCostSek: 10, grossSek: 20 }],
    ...over,
  };
}

function priser(rader: Record<string, number | null>): Map<string, WixProduktPris> {
  const m = new Map<string, WixProduktPris>();
  for (const [id, p] of Object.entries(rader)) m.set(id, { priceSek: p, variantCount: p === null ? 2 : 1 });
  return m;
}

describe("byggTillaggsfeed", () => {
  it("nycklar raden på VARIANTENS id och bär bara etiketter", () => {
    const u = byggTillaggsfeed(
      [mappning(NR, { prisgrupp: "A", konkurrent: { pris: 13129, hamtad: "2026-09-15T00:00:00Z" } })],
      priser({ [`wix-${NR}`]: 7919 }),
    );
    expect(u.rader).toEqual([
      { id: variantId(NR), custom_label_0: "A", custom_label_1: "4000_8000", custom_label_2: "under_dealproffsen" },
    ]);
    expect(u.perGrupp).toEqual({ A: 1, B: 0, ingen: 0 });
  });

  it("☠️ feeden bär aldrig artikelnummer, inköpspris eller dealproffsens pris i kronor", () => {
    const m = mappning(NR, { prisgrupp: "B", konkurrent: { pris: 13129, hamtad: "2026-09-15T00:00:00Z" } });
    const tsv = tillTsv(byggTillaggsfeed([m], priser({ [m.wixProductId]: 7919 })).rader);
    expect(tsv).not.toContain(NR);
    expect(tsv).not.toContain("13129");
    expect(tsv).not.toContain("7919");
    expect(tsv).not.toMatch(/landed|cost|kostnad/i);
    for (const k of KOLUMNER) expect(k).toMatch(/^(id|custom_label_[0-4])$/);
  });

  it("utan grupp är etiketten tom — det är så kampanjen väljer bort raden", () => {
    const m = mappning(NR);
    const u = byggTillaggsfeed([m], priser({ [m.wixProductId]: 2499 }));
    expect(u.rader[0].custom_label_0).toBe("");
    expect(u.rader[0].custom_label_2).toBe("ingen_jamforelse");
    expect(u.perGrupp.ingen).toBe(1);
  });

  it("☠️ utan variant-id utelämnas raden och räknas — en rad på produkt-id matchar ingenting", () => {
    const m = mappning(NR, { variants: [] });
    const u = byggTillaggsfeed([m], priser({ [m.wixProductId]: 2499 }));
    expect(u.rader).toHaveLength(0);
    expect(u.utanVariantId).toBe(1);
  });

  it("tvetydigt eller saknat butikspris → ingen etikett, ingen gissning", () => {
    const a = mappning("1");
    const b = mappning("2");
    const u = byggTillaggsfeed([a, b], priser({ "wix-1": null }));
    expect(u.rader).toHaveLength(0);
    expect(u.utanPris).toBe(2);
  });

  it("☠️ en raderad produkt räknas som raderad, inte som 'utan pris'", () => {
    const kvar = mappning("1");
    const borta = mappning("2", {
      draftStatus: "rejected",
      supplierProductId: "",
      wixRaderad: { at: "2026-10-12T04:00:00.000Z" },
    });
    // Butiken har inget pris för den raderade — precis det som annars hade
    // hamnat i utanPris.
    const u = byggTillaggsfeed([kvar, borta], priser({ "wix-1": 499 }));
    expect(u.rader).toHaveLength(1);
    expect(u.raderadeIWix).toBe(1);
    expect(u.utanPris).toBe(0);
  });

  it("AliExpress-rader lämnas utanför", () => {
    const u = byggTillaggsfeed([mappning("x", { supplier: "aliexpress", supplierProductId: "123" })], priser({}));
    expect(u.rader).toHaveLength(0);
    expect(u.ejAosom).toBe(1);
  });

  it("över dealproffsen märks som over_dealproffsen", () => {
    const m = mappning(NR, { konkurrent: { pris: 2495, hamtad: "" } });
    const u = byggTillaggsfeed([m], priser({ [m.wixProductId]: 2499 }));
    expect(u.rader[0].custom_label_2).toBe("over_dealproffsen");
    expect(u.perKonkurrenslage).toEqual({ over_dealproffsen: 1 });
  });
});

describe("byggTillaggsfeed — färgsammanslagna sidor", () => {
  // En sammanslagen sida bär en artikel per färg (lib/aosom/artiklar.ts).
  // Syntetiska artikelnummer: riktiga får aldrig stå här.
  function sammanslagen(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
    const bas = mappning("S-1");
    return {
      ...bas,
      variants: [bas.variants[0], { ...bas.variants[0], supplierVariantId: "S-2", sku: "FP-S-2", wixVariantId: variantId("S-2") }],
      ...over,
    };
  }
  const konkurrent = { pris: 3000, hamtad: "2026-09-27T00:00:00Z" };

  it("☠️ en rad per färg på färgens eget pris — sidan faller inte ur kampanjen", () => {
    // Färgerna kostar olika, så produktens pris är ett spann (null). Den gamla
    // vägen gav då sidan ingen etikett alls.
    const u = byggTillaggsfeed(
      [sammanslagen({ prisgrupp: "A", konkurrent })],
      priser({ "wix-S-1": null }),
      new Map([["wix-S-1", new Map([[variantId("S-1"), 2499], [variantId("S-2"), 1899]])]]),
    );
    expect(u.rader).toEqual([
      { id: variantId("S-1"), custom_label_0: "A", custom_label_1: "2000_4000", custom_label_2: "under_dealproffsen" },
      // Den andra färgen har ingen jämförelse och är därför inte med i kampanjen.
      { id: variantId("S-2"), custom_label_0: "", custom_label_1: "1000_2000", custom_label_2: "ingen_jamforelse" },
    ]);
    expect(u.perGrupp).toEqual({ A: 1, B: 0, ingen: 1 });
    expect(u.utanPris).toBe(0);
  });

  it("ett entydigt produktpris gäller alla färger när variantpriset saknas", () => {
    const u = byggTillaggsfeed([sammanslagen()], priser({ "wix-S-1": 1499 }));
    expect(u.rader.map((r) => [r.id, r.custom_label_1])).toEqual([
      [variantId("S-1"), "1000_2000"],
      [variantId("S-2"), "1000_2000"],
    ]);
  });

  it("☠️ utan något pris får färgen ingen etikett — aldrig en gissning", () => {
    const u = byggTillaggsfeed([sammanslagen()], priser({ "wix-S-1": null }));
    expect(u.rader).toEqual([]);
    expect(u.utanPris).toBe(2);
  });
});

describe("tillTsv", () => {
  it("rubrikrad + en rad per produkt, TSV-säkra fält", () => {
    const tsv = tillTsv([{ id: "v\t1", custom_label_0: "A", custom_label_1: "2000_4000", custom_label_2: "x" }]);
    const rader = tsv.trimEnd().split("\n");
    expect(rader[0]).toBe("id\tcustom_label_0\tcustom_label_1\tcustom_label_2");
    expect(rader[1]).toBe("v 1\tA\t2000_4000\tx");
  });
});

describe("hjälpfunktioner", () => {
  it("prisband och konkurrensläge", () => {
    expect(prisband(999)).toBe("500_1000");
    expect(prisband(2499)).toBe("2000_4000");
    expect(prisband(9000)).toBe("8000_plus");
    expect(konkurrenslage(2499, undefined)).toBe("ingen_jamforelse");
    expect(konkurrenslage(2499, { pris: 2495, hamtad: "" })).toBe("over_dealproffsen");
    expect(konkurrenslage(2449, { pris: 2495, hamtad: "" })).toBe("under_dealproffsen");
  });
});
