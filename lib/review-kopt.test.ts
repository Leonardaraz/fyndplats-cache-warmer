// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// "Köpt: …" i recensionslistan: motorn skickar vilken variant recensenten
// köpte (fältet `kopt`), och butiken visar det under namnet.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KOPT_MAX, koptEtikett } from "./review-kopt.ts";

test("variantnamnet rensas och visas", () => {
  assert.equal(koptEtikett("Svart / 50 liter"), "Svart / 50 liter");
  assert.equal(koptEtikett("  Svart  /\n50 liter "), "Svart / 50 liter");
  assert.equal(koptEtikett("Grå\u0007 / 100 cm"), "Grå / 100 cm");
});

test("saknat, tomt eller orimligt långt namn visas inte", () => {
  assert.equal(koptEtikett(undefined), undefined);
  assert.equal(koptEtikett(null), undefined);
  assert.equal(koptEtikett(42), undefined);
  assert.equal(koptEtikett("   "), undefined);
  assert.equal(koptEtikett("x".repeat(KOPT_MAX)), "x".repeat(KOPT_MAX));
  assert.equal(koptEtikett("x".repeat(KOPT_MAX + 1)), undefined);
});

test("butiken läser fältet ur motorns svar och visar det i listan", () => {
  const reviews = readFileSync("lib/reviews.ts", "utf8");
  assert.match(reviews, /kopt: koptEtikett\(r\.kopt\)/, "lib/reviews.ts ska ta kopt ur motorns svar via koptEtikett");
  const lista = readFileSync("components/ProductReviews.tsx", "utf8");
  assert.match(lista, /r\.kopt \? <div className="rev-kopt">Köpt: \{r\.kopt\}<\/div> : null/, "ProductReviews ska visa Köpt: under namnet");
});
