import { describe, it, expect } from "vitest";
import { splitConstantAxes, mergeConstantAxisSpecs } from "./constant-axes";

type V = { supplierVariantId: string; options: Record<string, string>; stock?: number };
const v = (id: string, options: Record<string, string>, stock = 1): V => ({ supplierVariantId: id, options, stock });

describe("splitConstantAxes", () => {
  it("plockar ut en 1-värdes-axel som spec, behåller äkta variant-axel", () => {
    const variants = [
      v("a", { Färg: "Röd", Storlek: "60X34X70 cm" }),
      v("b", { Färg: "Blå", Storlek: "60X34X70 cm" }),
    ];
    const r = splitConstantAxes(variants);
    expect(r.specs).toEqual([{ label: "Storlek", value: "60X34X70 cm" }]);
    expect([...r.constantAxisNames]).toEqual(["Storlek"]);
    // Färg behålls (differentierar), Storlek borta ur options.
    expect(r.prunedVariants.map((x) => x.options)).toEqual([{ Färg: "Röd" }, { Färg: "Blå" }]);
  });

  it("en-variant-produkt: ALLA axlar blir specs → option-lös produkt", () => {
    const variants = [v("only", { Färg: "Vit", Storlek: "M", Modell: "X" })];
    const r = splitConstantAxes(variants);
    expect(r.specs).toHaveLength(3);
    expect(r.prunedVariants[0].options).toEqual({});
  });

  it("rör inte indata + bevarar övriga variantfält + antal", () => {
    const variants = [v("a", { Färg: "Röd", Fast: "X" }, 7), v("b", { Färg: "Blå", Fast: "X" }, 3)];
    const r = splitConstantAxes(variants);
    expect(r.prunedVariants).toHaveLength(2);
    expect(r.prunedVariants[0].stock).toBe(7);
    expect(r.prunedVariants[1].stock).toBe(3);
    // indata orörd
    expect(variants[0].options).toEqual({ Färg: "Röd", Fast: "X" });
  });

  it("äkta multi-värdes-axel rörs inte (inga specs)", () => {
    const variants = [v("a", { Storlek: "S" }), v("b", { Storlek: "M" }), v("c", { Storlek: "L" })];
    const r = splitConstantAxes(variants);
    expect(r.specs).toHaveLength(0);
    expect(r.constantAxisNames.size).toBe(0);
    expect(r.prunedVariants).toBe(variants); // oförändrat
  });

  it("heterogen axel (saknas på vissa varianter) strippas INTE", () => {
    const variants = [v("a", { Färg: "Röd", Extra: "Y" }), v("b", { Färg: "Röd" })]; // Extra bara på a
    const r = splitConstantAxes(variants);
    // Färg är 1-värde men finns på alla → spec. Extra finns inte på alla → behålls.
    expect([...r.constantAxisNames]).toEqual(["Färg"]);
    expect(r.prunedVariants[0].options).toEqual({ Extra: "Y" });
  });

  it("tomt värde räknas som frånvarande", () => {
    const variants = [v("a", { Färg: "Röd", X: "" }), v("b", { Färg: "Blå", X: "" })];
    const r = splitConstantAxes(variants);
    // X är tomt på alla → ej 'present', ej konstant-spec; Färg differentierar.
    expect(r.specs).toHaveLength(0);
  });

  it("tom indata → no-op", () => {
    const r = splitConstantAxes([]);
    expect(r.specs).toHaveLength(0);
    expect(r.prunedVariants).toEqual([]);
  });
});

describe("mergeConstantAxisSpecs", () => {
  it("lägger till nya, hoppar dubbletter (skiftlägesokänsligt), befintliga vinner", () => {
    const existing = [{ label: "Material", value: "Bambu" }, { label: "storlek", value: "AE-mått" }];
    const constant = [{ label: "Storlek", value: "60 cm" }, { label: "Vikt", value: "5 kg" }];
    const merged = mergeConstantAxisSpecs(existing, constant);
    // "Storlek" finns redan (case-insensitive) → hoppas; "Vikt" läggs till.
    expect(merged).toEqual([
      { label: "Material", value: "Bambu" },
      { label: "storlek", value: "AE-mått" },
      { label: "Vikt", value: "5 kg" },
    ]);
  });

  it("inga tillägg → returnerar samma referens", () => {
    const existing = [{ label: "Storlek", value: "X" }];
    expect(mergeConstantAxisSpecs(existing, [])).toBe(existing);
  });
});
