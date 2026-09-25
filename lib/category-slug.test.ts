// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asciiSlug } from "./category-slug.ts";

test("é blir e, inte bindestreck", () => {
  // Runda S13: sidan fick slug skarmtak-entr-tak, och texterna nådde den aldrig.
  assert.equal(asciiSlug("Skärmtak & entrétak"), "skarmtak-entretak");
  assert.equal(asciiSlug("Café & Crème"), "cafe-creme");
  assert.equal(asciiSlug("Müsli"), "musli");
});

test("å, ä och ö ger samma slug som förut", () => {
  // Befintliga kategorisidor får inte byta adress.
  assert.equal(asciiSlug("Trädgård & Utemöbler"), "tradgard-utemobler");
  assert.equal(asciiSlug("Kök & Husgeråd"), "kok-husgerad");
  assert.equal(asciiSlug("Öronlappsfåtöljer"), "oronlappsfatoljer");
  assert.equal(asciiSlug("Miniugnar & airfryers"), "miniugnar-airfryers");
  assert.equal(asciiSlug("TV-bänkar"), "tv-bankar");
  assert.equal(asciiSlug("Hudvård & Ansikte"), "hudvard-ansikte");
});

test("ett namn i NFD-form ger samma slug som i NFC-form", () => {
  const nfd = "Trädgård & Utemöbler".normalize("NFD");
  assert.notEqual(nfd, "Trädgård & Utemöbler");
  assert.equal(asciiSlug(nfd), "tradgard-utemobler");
});

test("tomt och bara skiljetecken ger tom slug", () => {
  assert.equal(asciiSlug(""), "");
  assert.equal(asciiSlug(" & – "), "");
});

test("butiken räknar kategorislugen på ETT ställe", () => {
  // En egen kopia i products.ts vore en tvilling som kan glida isär från den här.
  const t = readFileSync("lib/products.ts", "utf8");
  assert.doesNotMatch(t, /function asciiSlug\(/, "asciiSlug ska importeras från lib/category-slug.ts");
  assert.match(t, /from "\.\/category-slug"/);
});
