import { describe, it, expect } from "vitest";
import { buildVariantSkus, skuSlugify } from "./sku";

describe("skuSlugify", () => {
  it("ASCII-säkrar svenska tecken och kollapsar separatorer", () => {
    expect(skuSlugify("Blå Läder")).toBe("bla-lader");
    expect(skuSlugify("17 L")).toBe("17-l");
    expect(skuSlugify("Stål 20cm")).toBe("stal-20cm");
    expect(skuSlugify("Rosé/Guld")).toBe("rose-guld");
    expect(skuSlugify("  ")).toBe("");
  });
});

describe("buildVariantSkus", () => {
  const slug = "temperingsmaskin-choklad-elektrisk-2-3-tankar";

  it("bygger läsbar FP-SKU per variant ur slug + optionsvärde", () => {
    const m = buildVariantSkus(
      [
        { supplierVariantId: "a", options: { Storlek: "17 L" } },
        { supplierVariantId: "b", options: { Storlek: "30 L" } },
      ],
      slug,
      "111",
    );
    expect(m.get("a")).toBe("FP-temperingsmaskin-choklad-17-l");
    expect(m.get("b")).toBe("FP-temperingsmaskin-choklad-30-l");
    // Inget "AE-" / inget AliExpress-skvaller, och ASCII
    for (const sku of m.values()) {
      expect(sku.startsWith("FP-")).toBe(true);
      expect(sku).toMatch(/^[A-Za-z0-9-]+$/);
      expect(sku.length).toBeLessThanOrEqual(40);
    }
  });

  it("kapar alltid till ≤40 tecken (lång slug + lång variant)", () => {
    const m = buildVariantSkus(
      [{ supplierVariantId: "x", options: { Färg: "Mörk gråblå metallic specialutgåva" } }],
      "extremt-langt-produktnamn-som-overstiger-alla-rimliga-granser-for-en-slug",
      "1",
    );
    const sku = m.get("x")!;
    expect(sku.length).toBeLessThanOrEqual(40);
    expect(sku.startsWith("FP-")).toBe(true);
    expect(sku.endsWith("-")).toBe(false);
  });

  it("är unik inom produkten — kollision får -2-suffix", () => {
    const m = buildVariantSkus(
      [
        { supplierVariantId: "a", options: { Storlek: "17 L" } },
        { supplierVariantId: "b", options: { Storlek: "17 L" } }, // samma synliga värde
      ],
      slug,
      "1",
    );
    expect(m.get("a")).toBe("FP-temperingsmaskin-choklad-17-l");
    expect(m.get("b")).toBe("FP-temperingsmaskin-choklad-17-l-2");
    expect(new Set([...m.values()]).size).toBe(2); // verkligen unika
  });

  it("krock mellan naturligt namn och dedup-form ger ändå unika SKU:er (audit-fynd 1)", () => {
    // "Svart 2" slugifieras till samma som "Svart"-dubblettens dedup-form (…-svart-2).
    const m = buildVariantSkus(
      [
        { supplierVariantId: "a", options: { Färg: "Svart" } },
        { supplierVariantId: "b", options: { Färg: "Svart" } }, // dubblett → …-svart-2
        { supplierVariantId: "c", options: { Färg: "Svart 2" } }, // naturligt …-svart-2 → måste vika
      ],
      "p",
      "1",
    );
    expect(new Set([...m.values()]).size).toBe(3); // inga dubbla SKU:er → inga krockande wixVariantId
  });

  it("håller ≤40 tecken även vid många kollisioner (2-siffrigt suffix) (audit-fynd 2)", () => {
    const variants = Array.from({ length: 15 }, (_, i) => ({ supplierVariantId: `v${i}`, options: { Storlek: "L" } }));
    const m = buildVariantSkus(variants, "extremt-langt-produktnamn-som-overstiger-granserna", "1");
    expect(new Set([...m.values()]).size).toBe(15); // alla unika
    for (const sku of m.values()) expect(sku.length).toBeLessThanOrEqual(40);
  });

  it("utan optionsvärden → bara FP-<produkt>", () => {
    const m = buildVariantSkus([{ supplierVariantId: "solo", options: {} }], slug, "1");
    expect(m.get("solo")).toBe("FP-temperingsmaskin-choklad");
  });

  it("tom slug → fallback till supplierProductId, annars 'produkt'", () => {
    expect(buildVariantSkus([{ supplierVariantId: "a", options: {} }], "", "9988").get("a")).toBe("FP-9988");
    expect(buildVariantSkus([{ supplierVariantId: "a", options: {} }], "", "").get("a")).toBe("FP-produkt");
  });
});
