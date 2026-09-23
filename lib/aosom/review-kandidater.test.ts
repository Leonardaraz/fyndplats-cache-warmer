import { describe, it, expect } from "vitest";
import { planeraRecensionskandidater } from "./review-kandidater";
import type { ProductMappingRecord } from "../store";

function aosom(nr: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${nr}`,
    supplier: "aosom",
    wixProductId: `wix-${nr}`,
    variants: [],
    ...over,
  };
}

function ae(id: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return { supplierProductId: id, supplier: "aliexpress", wixProductId: `wix-ae-${id}`, variants: [], ...over };
}

describe("planeraRecensionskandidater", () => {
  it("tar synliga Aosom-rader som aldrig kontrollerats", () => {
    const p = planeraRecensionskandidater(
      [aosom("845-001"), aosom("845-002", { reviewsCheckedAt: "2026-09-16T09:20:00Z" })],
      new Set(["wix-845-001", "wix-845-002"]),
    );
    expect(p.kandidater).toEqual([{ wixProductId: "wix-845-001", artikelnummer: "845-001" }]);
    expect(p.redanKontrollerade).toBe(1);
    expect(p.synligaAosom).toBe(2);
  });

  it("hoppar över produkter som inte syns i butiken", () => {
    const p = planeraRecensionskandidater([aosom("845-001"), aosom("845-002")], new Set(["wix-845-002"]));
    expect(p.kandidater.map((k) => k.wixProductId)).toEqual(["wix-845-002"]);
    expect(p.ejSynliga).toBe(1);
    expect(p.aosomRader).toBe(2);
  });

  it("rör aldrig AliExpress-rader", () => {
    const p = planeraRecensionskandidater([ae("1005001"), aosom("845-001")], new Set(["wix-ae-1005001", "wix-845-001"]));
    expect(p.kandidater).toHaveLength(1);
    expect(p.aosomRader).toBe(1);
  });

  it("känner igen en Aosom-rad på prefixet även utan supplier-fält", () => {
    const utanFalt = aosom("845-003", { supplier: undefined });
    const p = planeraRecensionskandidater([utanFalt], new Set(["wix-845-003"]));
    expect(p.kandidater).toEqual([{ wixProductId: "wix-845-003", artikelnummer: "845-003" }]);
  });

  it("räknar en Aosom-rad utan läsbart artikelnummer i stället för att tappa den tyst", () => {
    const trasig = aosom("x", { supplierProductId: "845-004" }); // supplier aosom, men utan prefix
    const p = planeraRecensionskandidater([trasig], new Set(["wix-x"]));
    expect(p.kandidater).toHaveLength(0);
    expect(p.utanArtikelnummer).toBe(1);
  });

  it("tar samma produkt bara en gång även om den har två rader", () => {
    const a = aosom("845-005");
    const b = { ...aosom("845-005"), supplierProductId: "aosom:845-005V01" };
    const p = planeraRecensionskandidater([a, b], new Set(["wix-845-005"]));
    expect(p.kandidater).toHaveLength(1);
  });

  describe("fore — omsvep av gamla produkter", () => {
    const rader = [
      aosom("845-010", { reviewsCheckedAt: "2026-08-29T10:00:00Z" }),
      aosom("845-011", { reviewsCheckedAt: "2026-09-16T09:20:00Z" }),
      aosom("845-012"),
    ];
    const synliga = new Set(rader.map((r) => r.wixProductId));

    it("utan fore räknas varje stämpel som kontrollerad", () => {
      const p = planeraRecensionskandidater(rader, synliga);
      expect(p.kandidater.map((k) => k.artikelnummer)).toEqual(["845-012"]);
    });

    it("med fore tas även det som kontrollerades innan dess", () => {
      const p = planeraRecensionskandidater(rader, synliga, { fore: "2026-09-01T00:00:00Z" });
      expect(p.kandidater.map((k) => k.artikelnummer)).toEqual(["845-010", "845-012"]);
      expect(p.redanKontrollerade).toBe(1);
    });

    it("en oläslig stämpel räknas som okontrollerad när fore används", () => {
      const p = planeraRecensionskandidater(
        [aosom("845-013", { reviewsCheckedAt: "inte ett datum" })],
        new Set(["wix-845-013"]),
        { fore: "2026-09-01T00:00:00Z" },
      );
      expect(p.kandidater).toHaveLength(1);
    });

    it("ett ogiltigt fore kastar i stället för att tyst ta allt eller inget", () => {
      expect(() => planeraRecensionskandidater(rader, synliga, { fore: "igår" })).toThrow(/fore/);
    });
  });

  it("☠️ planen bär bara wixProductId och artikelnummer — inga andra fält från raden", () => {
    const m = aosom("845-020", {
      variants: [{ supplierVariantId: "v1", sku: "FP-1", choices: {}, costUsd: 12, landedCostSek: 900, grossSek: 1079 }],
    } as Partial<ProductMappingRecord>);
    const p = planeraRecensionskandidater([m], new Set(["wix-845-020"]));
    expect(Object.keys(p.kandidater[0]).sort()).toEqual(["artikelnummer", "wixProductId"]);
  });
});
