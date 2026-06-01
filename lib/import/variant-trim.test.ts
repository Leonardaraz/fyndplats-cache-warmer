import { describe, it, expect } from "vitest";
import { trimVariants, type TrimmableVariant } from "./variant-trim";

function v(
  id: string,
  options: Record<string, string>,
  extra: Partial<TrimmableVariant> = {},
): TrimmableVariant {
  return { supplierVariantId: id, options, ...extra };
}

describe("trimVariants", () => {
  it("no-op när antalet är <= maxCount", () => {
    const vs = [v("1", { Storlek: "M" }), v("2", { Storlek: "L" })];
    const r = trimVariants(vs, 8);
    expect(r.kept).toHaveLength(2);
    expect(r.removed).toHaveLength(0);
  });

  it("trimmar ner till maxCount och bevarar de mest sålda", () => {
    const vs = Array.from({ length: 20 }, (_, i) =>
      v(String(i), { Storlek: String(i) }, { salesCount: i }),
    );
    const r = trimVariants(vs, 8);
    expect(r.kept).toHaveLength(8);
    expect(r.removed).toHaveLength(12);
    // De 8 högsta salesCount (12..19) ska behållas.
    const keptIds = r.kept.map((k) => Number(k.supplierVariantId)).sort((a, b) => a - b);
    expect(keptIds).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it("faller tillbaka på stock när ingen sälj-data finns", () => {
    const vs = Array.from({ length: 12 }, (_, i) =>
      v(String(i), { Storlek: String(i) }, { stock: i }),
    );
    const r = trimVariants(vs, 5);
    expect(r.kept).toHaveLength(5);
    const keptStocks = r.kept.map((k) => k.stock).sort((a, b) => (a! - b!));
    expect(keptStocks).toEqual([7, 8, 9, 10, 11]);
    expect(r.summary).toContain("sales: 0");
  });

  it("behåller minst en variant per huvudfärg (stänger inte ut en hel färg)", () => {
    // 3 färger × 4 storlekar = 12 varianter. Blå har lågt lager men ska ändå
    // få minst en plats kvar när maxCount (4) >= antal färger (3).
    const colors = ["Röd", "Grön", "Blå"];
    const vs: TrimmableVariant[] = [];
    for (const c of colors) {
      for (let s = 0; s < 4; s++) {
        // Blå får genomgående lägst lager.
        const stock = c === "Blå" ? 1 : 50 + s;
        vs.push(v(`${c}-${s}`, { Färg: c, Storlek: String(s) }, { stock }));
      }
    }
    const r = trimVariants(vs, 4);
    expect(r.kept).toHaveLength(4);
    const keptColors = new Set(r.kept.map((k) => k.options.Färg));
    // Alla tre färger måste vara representerade trots Blås låga lager.
    expect(keptColors).toEqual(new Set(["Röd", "Grön", "Blå"]));
  });

  it("behåller de bäst rankade färgerna när färgerna är fler än maxCount", () => {
    // 6 färger, en variant per färg, maxCount 3 → topp-3-färgerna efter stock.
    const vs = [
      v("a", { Färg: "A" }, { stock: 1 }),
      v("b", { Färg: "B" }, { stock: 100 }),
      v("c", { Färg: "C" }, { stock: 2 }),
      v("d", { Färg: "D" }, { stock: 99 }),
      v("e", { Färg: "E" }, { stock: 3 }),
      v("f", { Färg: "F" }, { stock: 98 }),
    ];
    const r = trimVariants(vs, 3);
    expect(r.kept).toHaveLength(3);
    expect(new Set(r.kept.map((k) => k.options.Färg))).toEqual(new Set(["B", "D", "F"]));
  });

  it("ger distinkt-bild-bonus som bryter likalägen", () => {
    // Två varianter med identiskt lager; den med egen bild ska vinna sista platsen.
    // base[0].image = "main.jpg" är produktens default-bild. dupImg återanvänder den
    // (ingen visuell skillnad → ingen bonus); ownImg har en egen bild (bonus).
    const base = Array.from({ length: 7 }, (_, i) =>
      v(`base-${i}`, { Storlek: String(i) }, { stock: 100, image: "main.jpg" }),
    );
    const dupImg = v("dup", { Storlek: "X" }, { stock: 5, image: "main.jpg" });
    const ownImg = v("own", { Storlek: "Y" }, { stock: 5, image: "own.jpg" });
    const vs = [...base, dupImg, ownImg];
    const r = trimVariants(vs, 8);
    const keptIds = new Set(r.kept.map((k) => k.supplierVariantId));
    expect(keptIds.has("own")).toBe(true);
    expect(keptIds.has("dup")).toBe(false);
  });

  it("returnerar alltid minst en variant även med maxCount 0", () => {
    const vs = [v("1", { S: "M" }, { stock: 1 }), v("2", { S: "L" }, { stock: 2 })];
    const r = trimVariants(vs, 0);
    expect(r.kept.length).toBeGreaterThanOrEqual(1);
  });

  it("är deterministisk (samma indata → samma utfall)", () => {
    const vs = Array.from({ length: 15 }, (_, i) =>
      v(String(i), { Färg: ["X", "Y", "Z"][i % 3], Storlek: String(i) }, { stock: (i * 7) % 11 }),
    );
    const a = trimVariants(vs, 8);
    const b = trimVariants(vs, 8);
    expect(a.kept.map((k) => k.supplierVariantId)).toEqual(b.kept.map((k) => k.supplierVariantId));
  });
});
