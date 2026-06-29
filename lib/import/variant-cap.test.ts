import { describe, it, expect } from "vitest";
import { capOptionsAndVariants } from "./variant-cap";
import {
  WIX_MAX_CHOICES_PER_OPTION as MAXC,
  WIX_MAX_OPTIONS_PER_PRODUCT as MAXO,
  WIX_MAX_VARIANTS_PER_PRODUCT as MAXV,
} from "../wix/limits";

type V = { supplierVariantId: string; options: Record<string, string>; included?: boolean; stock?: number; salesCount?: number };
const v = (id: string, options: Record<string, string>, patch: Partial<V> = {}): V => ({
  supplierVariantId: id, options, included: false, stock: 1, ...patch,
});

describe("capOptionsAndVariants", () => {
  it("under gränserna → no-op (capped:false, oförändrat)", () => {
    const options = [{ name: "Färg", choices: [{ name: "Röd" }, { name: "Blå" }] }];
    const variants = [v("a", { Färg: "Röd" }, { included: true }), v("b", { Färg: "Blå" })];
    const r = capOptionsAndVariants(options, variants);
    expect(r.capped).toBe(false);
    expect(r.options[0].choices).toHaveLength(2);
    expect(r.variants).toHaveLength(2);
  });

  it("axel > MAXC → kapas till MAXC, vald variants värde behålls ALLTID, konsistent", () => {
    const N = MAXC + 150;
    const options = [{ name: "Färg", choices: Array.from({ length: N }, (_, i) => ({ name: `c${i}` })) }];
    // Vald variant = c200 (sent i listan + lägst lager → skulle annars rensas). Måste ändå behållas.
    const variants = Array.from({ length: N }, (_, i) => v(`s${i}`, { Färg: `c${i}` }, { included: i === 200, stock: N - i }));
    const r = capOptionsAndVariants(options, variants);
    expect(r.capped).toBe(true);
    expect(r.options[0].choices).toHaveLength(MAXC);
    const kept = new Set(r.options[0].choices.map((c) => c.name));
    expect(kept.has("c200")).toBe(true); // vald variant förblir köpbar
    // options↔varianter konsistenta: ingen variant refererar ett bortkapat värde
    expect(r.variants.every((x) => kept.has(x.options.Färg))).toBe(true);
    expect(r.variants).toHaveLength(MAXC);
    expect(r.variants.some((x) => x.supplierVariantId === "s200")).toBe(true);
  });

  it("varianter som refererar bortkapade värden tas bort (ingen MISSING_VARIANT_OPTION_CHOICE)", () => {
    const N = MAXC + 5;
    const options = [{ name: "Färg", choices: Array.from({ length: N }, (_, i) => ({ name: `c${i}` })) }];
    const variants = Array.from({ length: N }, (_, i) => v(`s${i}`, { Färg: `c${i}` }, { included: i < 2, stock: N - i }));
    const r = capOptionsAndVariants(options, variants);
    const kept = new Set(r.options[0].choices.map((c) => c.name));
    expect(r.variants.filter((x) => !kept.has(x.options.Färg))).toHaveLength(0);
    expect(r.variants.filter((x) => x.included)).toHaveLength(2); // båda valda kvar
  });

  it("total antal varianter > MAXV → kapas, alla included kvar", () => {
    const colors = Array.from({ length: 40 }, (_, i) => `f${i}`); // ≤MAXC → ingen choice-cap
    const sizes = Array.from({ length: 30 }, (_, i) => `st${i}`);
    const options = [
      { name: "Färg", choices: colors.map((name) => ({ name })) },
      { name: "Storlek", choices: sizes.map((name) => ({ name })) },
    ];
    const variants: V[] = [];
    let i = 0;
    for (const f of colors) for (const s of sizes) variants.push(v(`v${i}`, { Färg: f, Storlek: s }, { included: i++ < 3 }));
    expect(variants.length).toBeGreaterThan(MAXV);
    const r = capOptionsAndVariants(options, variants);
    expect(r.capped).toBe(true);
    expect(r.variants).toHaveLength(MAXV);
    expect(r.variants.filter((x) => x.included)).toHaveLength(3);
  });

  it("options > MAXO → kapas till MAXO axlar; varianter behåller bara kvar-axlarna", () => {
    const axes = Array.from({ length: MAXO + 1 }, (_, i) => `Axel${i}`);
    const options = axes.map((name) => ({ name, choices: [{ name: "X" }, { name: "Y" }] }));
    const variants = [
      v("a", Object.fromEntries(axes.map((a) => [a, "X"])), { included: true }),
      v("b", Object.fromEntries(axes.map((a) => [a, "Y"])), { included: true }),
    ];
    const r = capOptionsAndVariants(options, variants);
    expect(r.options).toHaveLength(MAXO);
    expect(r.capped).toBe(true);
    const keptAxes = new Set(r.options.map((o) => o.name));
    expect(r.variants.every((x) => Object.keys(x.options).every((k) => keptAxes.has(k)))).toBe(true);
  });

  it("kastar aldrig (tom indata, inga valda)", () => {
    expect(() => capOptionsAndVariants([], [])).not.toThrow();
    expect(capOptionsAndVariants([], []).capped).toBe(false);
  });
});
