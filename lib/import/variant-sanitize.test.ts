import { describe, expect, it } from "vitest";
import { sanitizeVariantOptions } from "./variant-sanitize";

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
});
