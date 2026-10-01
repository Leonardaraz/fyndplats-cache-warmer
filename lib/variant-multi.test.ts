// Run with: `pnpm test` (node --test --experimental-strip-types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { findVariant, defaultSelection, isChoiceAvailable, reconcileSelection, andradeAxlar, choiceStatus, type ComboVariant } from "./variant-multi.ts";

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

test("choiceStatus skiljer slut från kombination som inte finns", () => {
  // Vald Storlek S: Röd finns i lager, Blå finns i lager.
  assert.equal(choiceStatus(table, "Färg", "Röd", { Färg: "Blå", Storlek: "S" }), "ok");
  // Vald Storlek M: Röd M finns men är slut; Blå M finns inte.
  assert.equal(choiceStatus(table, "Färg", "Röd", { Färg: "Röd", Storlek: "M" }), "slut");
  assert.equal(choiceStatus(table, "Färg", "Blå", { Färg: "Röd", Storlek: "M" }), "saknas");
  // Vald Blå: storlek M finns inte i blått.
  assert.equal(choiceStatus(table, "Storlek", "M", { Färg: "Blå", Storlek: "S" }), "saknas");
});

test("andradeAxlar säger vilka andra val som byttes (inga tysta byten)", () => {
  const prev = { Färg: "Röd", Storlek: "M" };
  const next = reconcileSelection(table, "Färg", "Blå", prev);
  assert.deepEqual(andradeAxlar(prev, next, "Färg"), [{ axel: "Storlek", fran: "M", till: "S" }]);
  assert.deepEqual(andradeAxlar(prev, { Färg: "Röd", Storlek: "S" }, "Storlek"), []);
});

test("reconcileSelection behåller så många andra val som möjligt (tre axlar)", () => {
  const t3: ComboVariant[] = [
    { choices: { Färg: "Svart", Storlek: "205", Tyg: "Bomull" }, variantId: "a", price: "", priceNum: 0, originalPrice: "", inStock: true, image: "" },
    { choices: { Färg: "Svart", Storlek: "177", Tyg: "Linne" }, variantId: "b", price: "", priceNum: 0, originalPrice: "", inStock: true, image: "" },
    { choices: { Färg: "Grön", Storlek: "177", Tyg: "Bomull" }, variantId: "c", price: "", priceNum: 0, originalPrice: "", inStock: true, image: "" },
  ];
  // Från {Grön,177,Bomull} klick Svart: {Svart,177,Bomull} saknas. Både a och b
  // behåller ett val; ingen av dem får byta båda i onödan.
  const next = reconcileSelection(t3, "Färg", "Svart", { Färg: "Grön", Storlek: "177", Tyg: "Bomull" });
  assert.equal(andradeAxlar({ Färg: "Grön", Storlek: "177", Tyg: "Bomull" }, next, "Färg").length, 1);
});
