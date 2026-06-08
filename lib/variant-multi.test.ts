// Run with: `pnpm test` (node --test --experimental-strip-types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { findVariant, defaultSelection, isChoiceAvailable, reconcileSelection, type ComboVariant } from "./variant-multi.ts";

const table: ComboVariant[] = [
  { choices: { Färg: "Röd", Storlek: "S" }, variantId: "rs", price: "199 kr", priceNum: 199, originalPrice: "", inStock: true, image: "red.jpg" },
  { choices: { Färg: "Röd", Storlek: "M" }, variantId: "rm", price: "209 kr", priceNum: 209, originalPrice: "", inStock: false, image: "red.jpg" },
  { choices: { Färg: "Blå", Storlek: "S" }, variantId: "bs", price: "219 kr", priceNum: 219, originalPrice: "", inStock: true, image: "blue.jpg" },
];

test("findVariant matchar hela kombinationen (inte bara en axel)", () => {
  assert.equal(findVariant(table, { Färg: "Röd", Storlek: "S" })?.variantId, "rs");
  assert.equal(findVariant(table, { Färg: "Blå", Storlek: "S" })?.variantId, "bs");
  assert.equal(findVariant(table, { Färg: "Blå", Storlek: "M" }), undefined); // kombination saknas
});

test("defaultSelection väljer första variant i lager", () => {
  assert.deepEqual(defaultSelection(table), { Färg: "Röd", Storlek: "S" });
  const allOos = table.map((v) => ({ ...v, inStock: false }));
  assert.deepEqual(defaultSelection(allOos), { Färg: "Röd", Storlek: "S" }); // ingen i lager → första
});

test("isChoiceAvailable speglar lager givet de ANDRA valda axlarna", () => {
  // Röd vald: S finns i lager (rs), M är slut (rm) → ej tillgänglig
  assert.equal(isChoiceAvailable(table, "Storlek", "S", { Färg: "Röd" }), true);
  assert.equal(isChoiceAvailable(table, "Storlek", "M", { Färg: "Röd" }), false);
  // Blå vald: bara S finns (i lager); M-kombinationen saknas helt → ej tillgänglig
  assert.equal(isChoiceAvailable(table, "Storlek", "M", { Färg: "Blå" }), false);
  // Färg-axeln: Blå tillgänglig (bs i lager), oavsett vald storlek S
  assert.equal(isChoiceAvailable(table, "Färg", "Blå", { Storlek: "S" }), true);
});

test("reconcileSelection snäpper övriga axlar till en giltig (helst i lager) kombination", () => {
  // Vald {Röd, M}. Klicka Färg=Blå → {Blå, M} saknas → snäpp till bs {Blå, S} (i lager).
  assert.deepEqual(reconcileSelection(table, "Färg", "Blå", { Färg: "Röd", Storlek: "M" }), { Färg: "Blå", Storlek: "S" });
  // Klicka Storlek=S med Röd → {Röd, S} finns (rs) → behåll oförändrat.
  assert.deepEqual(reconcileSelection(table, "Storlek", "S", { Färg: "Röd", Storlek: "M" }), { Färg: "Röd", Storlek: "S" });
});
