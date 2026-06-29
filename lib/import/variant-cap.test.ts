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

// Delade invarianter som ALLTID måste hålla efter en kapning (Wix-kontraktet + butiks-UX).
function assertWixConsistent(r: ReturnType<typeof capOptionsAndVariants<CapOptT, V>>) {
  const keepByAxis = new Map(r.options.map((o) => [o.name, new Set(o.choices.map((c) => c.name))]));
  // (a) ingen option har 0 val
  for (const o of r.options) expect(o.choices.length).toBeGreaterThan(0);
  // (b) varje option ≤ MAXC val
  for (const o of r.options) expect(o.choices.length).toBeLessThanOrEqual(MAXC);
  // (c) ≤ MAXO options, ≤ MAXV varianter
  expect(r.options.length).toBeLessThanOrEqual(MAXO);
  expect(r.variants.length).toBeLessThanOrEqual(MAXV);
  // (d) variant→choice: ingen variant refererar ett bortkapat val (MISSING_VARIANT_OPTION_CHOICE)
  for (const x of r.variants) {
    for (const [ax, val] of Object.entries(x.options)) {
      expect(keepByAxis.has(ax)).toBe(true);
      expect(keepByAxis.get(ax)!.has(val)).toBe(true);
    }
  }
  // (e) choice→variant: varje kvarvarande val används av ≥1 variant (inga döda val)
  const usedByAxis = new Map<string, Set<string>>();
  for (const x of r.variants) for (const [ax, val] of Object.entries(x.options)) {
    if (!usedByAxis.has(ax)) usedByAxis.set(ax, new Set());
    usedByAxis.get(ax)!.add(val);
  }
  for (const o of r.options) for (const c of o.choices) {
    expect(usedByAxis.get(o.name)?.has(c.name)).toBe(true);
  }
}
type CapOptT = { name: string; choices: { name: string; colorCode?: string }[] };

describe("capOptionsAndVariants", () => {
  it("under gränserna → no-op (capped:false, oförändrat)", () => {
    const options = [{ name: "Färg", choices: [{ name: "Röd" }, { name: "Blå" }] }];
    const variants = [v("a", { Färg: "Röd" }, { included: true }), v("b", { Färg: "Blå" })];
    const r = capOptionsAndVariants(options, variants);
    expect(r.capped).toBe(false);
    expect(r.droppedIncluded).toBe(0);
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
    expect(r.droppedIncluded).toBe(0); // en included som ryms tappas aldrig
    expect(r.variants.every((x) => kept.has(x.options.Färg))).toBe(true);
    expect(r.variants).toHaveLength(MAXC);
    expect(r.variants.some((x) => x.supplierVariantId === "s200")).toBe(true);
    assertWixConsistent(r);
  });

  it("varianter som refererar bortkapade värden tas bort (ingen MISSING_VARIANT_OPTION_CHOICE)", () => {
    const N = MAXC + 5;
    const options = [{ name: "Färg", choices: Array.from({ length: N }, (_, i) => ({ name: `c${i}` })) }];
    const variants = Array.from({ length: N }, (_, i) => v(`s${i}`, { Färg: `c${i}` }, { included: i < 2, stock: N - i }));
    const r = capOptionsAndVariants(options, variants);
    const kept = new Set(r.options[0].choices.map((c) => c.name));
    expect(r.variants.filter((x) => !kept.has(x.options.Färg))).toHaveLength(0);
    expect(r.variants.filter((x) => x.included)).toHaveLength(2); // båda valda kvar
    assertWixConsistent(r);
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
    expect(r.droppedIncluded).toBe(0);
    assertWixConsistent(r);
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
    assertWixConsistent(r);
  });

  it("kastar aldrig (tom indata, inga valda)", () => {
    expect(() => capOptionsAndVariants([], [])).not.toThrow();
    const r = capOptionsAndVariants([], []);
    expect(r.capped).toBe(false);
    expect(r.droppedIncluded).toBe(0);
  });

  // ——— Regression: adversariell audit PR #218 ———

  it("BUG A: included ENSAMT > MAXV → resultat klampas ALLTID till MAXV (ingen 400 TOO_MANY_VARIANTS)", () => {
    // 40×30 = 1200 köpbara varianter, ALLA included (bulk-import utan trim). Får aldrig returnera >1000.
    const colors = Array.from({ length: 40 }, (_, i) => `f${i}`);
    const sizes = Array.from({ length: 30 }, (_, i) => `st${i}`);
    const options = [
      { name: "Färg", choices: colors.map((name) => ({ name })) },
      { name: "Storlek", choices: sizes.map((name) => ({ name })) },
    ];
    const variants: V[] = [];
    let i = 0;
    for (const f of colors) for (const s of sizes) variants.push(v(`v${i++}`, { Färg: f, Storlek: s }, { included: true, stock: i }));
    expect(variants.filter((x) => x.included).length).toBeGreaterThan(MAXV);
    const r = capOptionsAndVariants(options, variants);
    expect(r.variants.length).toBeLessThanOrEqual(MAXV); // kärnan: ingen hårdfall
    expect(r.variants).toHaveLength(MAXV);
    expect(r.capped).toBe(true);
    expect(r.droppedIncluded).toBe(1200 - MAXV); // utelämnade köpbara RÄKNAS
    // De behållna ska vara de högst rankade köpbara (störst stock vinner).
    const keptIds = new Set(r.variants.map((x) => x.supplierVariantId));
    expect(keptIds.has("v1199")).toBe(true); // högst stock (i=1200) behållen
    assertWixConsistent(r);
  });

  it("BUG B: > MAXC included på EN axel → kapas till MAXC, högst rankade köpbara behålls, droppedIncluded räknas, konsistent", () => {
    const N = MAXC + 30; // 130 distinkta färger, ALLA included
    const options = [{ name: "Färg", choices: Array.from({ length: N }, (_, i) => ({ name: `c${i}` })) }];
    const variants = Array.from({ length: N }, (_, i) => v(`s${i}`, { Färg: `c${i}` }, { included: true, stock: i + 1 }));
    const r = capOptionsAndVariants(options, variants);
    expect(r.options[0].choices).toHaveLength(MAXC);
    expect(r.variants).toHaveLength(MAXC);
    expect(r.droppedIncluded).toBe(N - MAXC); // 30 köpbara tappade men SYNLIGT räknade
    // De behållna ska vara de högst rankade (störst stock = störst index).
    const kept = new Set(r.options[0].choices.map((c) => c.name));
    expect(kept.has(`c${N - 1}`)).toBe(true); // högst stock behållen
    expect(kept.has("c0")).toBe(false); // lägst stock kapad
    assertWixConsistent(r); // inga döda val, ingen MISSING_VARIANT_OPTION_CHOICE
  });

  it("BUG C: föräldralöst val rensas — bortkapad färg var enda bäraren av en storlek", () => {
    // Överlastad Färg-axel (120 val) + liten Storlek-axel (S/L). De LÄGST rankade färgerna
    // (kapas bort) är exakt de enda som bär storlek "L". Efter kap: ingen variant har "L" →
    // "L" får INTE ligga kvar som dött val.
    const NC = MAXC + 20; // 120 färger
    const colorChoices = Array.from({ length: NC }, (_, i) => ({ name: `c${i}` }));
    const options = [
      { name: "Färg", choices: colorChoices },
      { name: "Storlek", choices: [{ name: "S" }, { name: "L" }] },
    ];
    const variants: V[] = [];
    for (let i = 0; i < NC; i++) {
      // hög rank (stora stock) på de första 100 färgerna, alla med S; de sista 20 (låg stock) bär L.
      const isTail = i >= MAXC;
      variants.push(v(`s${i}`, { Färg: `c${i}`, Storlek: isTail ? "L" : "S" }, { stock: isTail ? 1 : 1000 - i }));
    }
    const r = capOptionsAndVariants(options, variants);
    const sizeOpt = r.options.find((o) => o.name === "Storlek")!;
    expect(sizeOpt.choices.map((c) => c.name)).toEqual(["S"]); // "L" rensat (föräldralöst)
    assertWixConsistent(r);
  });

  it("BUG D: options>MAXO + två included skiljer sig BARA på bortkapad axel → mest värd överlever, förlust räknas", () => {
    const axes = Array.from({ length: MAXO + 1 }, (_, i) => `Axel${i}`); // 7 axlar
    const options = axes.map((name) => ({ name, choices: [{ name: "X" }, { name: "Y" }] }));
    const base = Object.fromEntries(axes.slice(0, MAXO).map((a) => [a, "X"]));
    const last = axes[MAXO]; // axeln som kapas bort (minst använd ⇒ sist)
    const variants = [
      v("low", { ...base, [last]: "X" }, { included: true, stock: 5 }),
      v("high", { ...base, [last]: "Y" }, { included: true, stock: 99 }),
    ];
    const r = capOptionsAndVariants(options, variants);
    expect(r.options).toHaveLength(MAXO);
    // De två kollapsar (skiljer bara på den bortkapade axeln) → en överlever, den MEST värda.
    expect(r.variants).toHaveLength(1);
    expect(r.variants[0].supplierVariantId).toBe("high"); // rank-tiebreak: stock 99 > 5
    expect(r.droppedIncluded).toBe(1); // tappad köpbar variant RÄKNAS (inte tyst)
    assertWixConsistent(r);
  });

  it("BUG E: NaN i stock kraschar inte och degraderar deterministiskt", () => {
    const N = MAXC + 3;
    const options = [{ name: "Färg", choices: Array.from({ length: N }, (_, i) => ({ name: `c${i}` })) }];
    const variants = Array.from({ length: N }, (_, i) =>
      v(`s${i}`, { Färg: `c${i}` }, { included: i === 0, stock: i === 5 ? NaN : N - i }),
    );
    expect(() => capOptionsAndVariants(options, variants)).not.toThrow();
    const r = capOptionsAndVariants(options, variants);
    expect(r.options[0].choices).toHaveLength(MAXC);
    expect(r.droppedIncluded).toBe(0); // c0 (included) behålls
    assertWixConsistent(r);
  });
});
