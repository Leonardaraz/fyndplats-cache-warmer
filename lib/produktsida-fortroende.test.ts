// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Produktsidans rader vid köpknappen. "4,9 av 5 på Google" togs bort
// 2026-11-12 på Leonards begäran; betyget står kvar på startsidan, i sidfoten
// och på /omdomen. Raden hämtade dessutom butiksbetyget på varje produktsida.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const las = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const vy = las("components/productview.tsx");
const sida = las("app/produkt/[slug]/page.tsx");
const css = las("app/globals.css");

const start = vy.indexOf('<div className="pdp-trust">');
const block = vy.slice(start, vy.indexOf("<PaymentMarks", start));
const utanKommentarer = block.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

test("raden med Google-betyget finns inte vid köpknappen", () => {
  assert.ok(start > -1, "pdp-trust saknas");
  assert.doesNotMatch(utanKommentarer, /Google|googleBetyg|pdp-trust-betyg|\/omdomen/);
});

test("de tre andra raderna står kvar", () => {
  for (const rad of ["Fri frakt över 499 kr", "30 dagars öppet köp", "Trygg betalning med Klarna"]) {
    assert.ok(utanKommentarer.includes(rad), rad);
  }
});

test("produktsidan hämtar inte längre butiksbetyget", () => {
  assert.doesNotMatch(sida, /getSocialProof|googleBetyg/);
  assert.doesNotMatch(vy, /googleBetyg/);
});

test("stilen för raden är borta", () => {
  assert.doesNotMatch(css, /pdp-trust-betyg/);
});
