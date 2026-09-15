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
