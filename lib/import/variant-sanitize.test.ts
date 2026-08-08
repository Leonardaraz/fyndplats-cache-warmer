import { describe, expect, it } from "vitest";
import { isEffectivelyEmpty, sanitizeVariantOptions } from "./variant-sanitize";

// VEVOR-pumpen 2026-08-08: en axel med tomma värden nådde Wix → 400
// "choicesSettings.choices[].name has size 0" och importen föll.
const v = (options: Record<string, string>, included = true, id = "") => ({
  supplierVariantId: id,
  options,
  included,
});

describe("sanitizeVariantOptions", () => {
  it("pumpens exakta fall: tom axel bort + dubblettvarianter sammanslagna", () => {
    // 6 SKU:er där skrapan inte kunde läsa första axelns värden → "" överallt,
    // och spänningsvärdena dubbleras (popupen visade "/ 60LPM 45W-6m" två gånger).
    const r = sanitizeVariantOptions([
      v({ Plug: "", Voltage: "60LPM 45W-6m" }, true, "1"),
      v({ Plug: "", Voltage: "60LPM 45W-6m" }, true, "2"),
      v({ Plug: "", Voltage: "50LPM 22W-4m" }, true, "3"),
      v({ Plug: "", Voltage: "67LPM 60W-8m" }, true, "4"),
      v({ Plug: "", Voltage: "67LPM 60W-8m" }, true, "5"),
      v({ Plug: "", Voltage: "67LPM 60W-8m" }, true, "6"),
    ]);
    expect(r.removedAxes).toEqual(["Plug"]);
    expect(r.mergedDuplicates).toBe(3);
    expect(r.variants.map((x) => x.options)).toEqual([
      { Voltage: "60LPM 45W-6m" },
      { Voltage: "50LPM 22W-4m" },
      { Voltage: "67LPM 60W-8m" },
    ]);
  });

  it("blandat tomt/ifyllt på samma axel → HELA axeln bort (Wix kräver alla options på alla varianter)", () => {
    const r = sanitizeVariantOptions([
      v({ Plug: "EU", Voltage: "45W" }),
      v({ Plug: "", Voltage: "60W" }),
    ]);
    expect(r.removedAxes).toEqual(["Plug"]);
    expect(r.variants.map((x) => x.options)).toEqual([{ Voltage: "45W" }, { Voltage: "60W" }]);
    expect(r.mergedDuplicates).toBe(0);
  });

  it("vald variant vinner över avbockad vid sammanslagning", () => {
    const r = sanitizeVariantOptions([
      v({ X: "", Färg: "Röd" }, false, "avbockad"),
      v({ X: "", Färg: "Röd" }, true, "vald"),
    ]);
    expect(r.variants).toHaveLength(1);
    expect(r.variants[0].supplierVariantId).toBe("vald");
    expect(r.variants[0].included).toBe(true);
  });

  it("axel med tomt NAMN tas också bort; whitespace räknas som tomt", () => {
    const r = sanitizeVariantOptions([v({ "": "x", "  ": "y", Färg: "Blå", Storlek: "  " })]);
    expect(new Set(r.removedAxes)).toEqual(new Set(["", "  ", "Storlek"]));
    expect(r.variants[0].options).toEqual({ Färg: "Blå" });
  });

  it("no-op på ren produkt (inget tas bort, inget muteras)", () => {
    const input = [v({ Färg: "Röd" }, true, "a"), v({ Färg: "Blå" }, true, "b")];
    const r = sanitizeVariantOptions(input);
    expect(r.removedAxes).toEqual([]);
    expect(r.mergedDuplicates).toBe(0);
    expect(r.variants.map((x) => x.supplierVariantId)).toEqual(["a", "b"]);
    expect(input[0].options).toEqual({ Färg: "Röd" }); // orört
  });

  it("signaturen kolliderar inte på listiga värden", () => {
    const r = sanitizeVariantOptions([
      v({ X: "", A: "b c", B: "d" }),
      v({ X: "", A: "b", B: "c d" }),
    ]);
    expect(r.variants).toHaveLength(2); // olika kombon — får ALDRIG slås ihop
  });

  it("batch-fyndet 2026-08-08: OSYNLIGA värden (ZWSP/LRM/kontrolltecken) räknas som tomma", () => {
    // Två produkter föll EFTER #378 med samma Wix-400: värdena passerade .trim()
    // (zero-width space m.fl. är inte whitespace i JS) men Wix ser längd 0.
    const r = sanitizeVariantOptions([
      v({ Färg: "\u200b", Voltage: "60LPM 45W-6m" }, true, "1"),
      v({ Färg: "\u200b", Voltage: "50LPM 22W-4m" }, true, "2"),
      v({ Färg: "\u200e\u200f", Voltage: "67LPM 60W-8m" }, true, "3"),
      v({ Färg: "\u0007", Voltage: "67LPM 60W-8m" }, true, "4"),
    ]);
    expect(r.removedAxes).toEqual(["Färg"]);
    expect(r.mergedDuplicates).toBe(1); // 67LPM-dubbletten kollapsar
    expect(r.variants.map((x) => x.options)).toEqual([
      { Voltage: "60LPM 45W-6m" },
      { Voltage: "50LPM 22W-4m" },
      { Voltage: "67LPM 60W-8m" },
    ]);
  });

  it("osynligt AXELNAMN tas också bort; synligt värde MED inbäddade osynliga tecken behålls", () => {
    const r = sanitizeVariantOptions([
      v({ "\u200b": "x", Kontakt: "EU\u200bplug" }),
      v({ "\u200b": "y", Kontakt: "US plug" }),
    ]);
    expect(r.removedAxes).toEqual(["\u200b"]);
    // "EU\u200bplug" har synligt innehåll → axeln Kontakt är giltig och rörs inte.
    expect(r.variants.map((x) => x.options)).toEqual([
      { Kontakt: "EU\u200bplug" },
      { Kontakt: "US plug" },
    ]);
  });
});

describe("isEffectivelyEmpty", () => {
  it("tomt/whitespace/osynligt → true; synligt innehåll → false", () => {
    expect(isEffectivelyEmpty("")).toBe(true);
    expect(isEffectivelyEmpty("   ")).toBe(true);
    expect(isEffectivelyEmpty("\u00a0")).toBe(true); // NBSP
    expect(isEffectivelyEmpty("\u200b")).toBe(true); // zero-width space
    expect(isEffectivelyEmpty("\u200e")).toBe(true); // LTR-markör (vanlig i AE-data)
    expect(isEffectivelyEmpty("\ufeff")).toBe(true); // BOM
    expect(isEffectivelyEmpty("\u00ad")).toBe(true); // soft hyphen
    expect(isEffectivelyEmpty("\u0001\u0007")).toBe(true); // kontrolltecken
    expect(isEffectivelyEmpty("\u200b \u200e")).toBe(true); // blandning
    expect(isEffectivelyEmpty("A")).toBe(false);
    expect(isEffectivelyEmpty("60LPM 45W-6m")).toBe(false);
    expect(isEffectivelyEmpty("\u200bEU")).toBe(false); // synlig kärna → inte tomt
    expect(isEffectivelyEmpty("Röd")).toBe(false);
  });
});
