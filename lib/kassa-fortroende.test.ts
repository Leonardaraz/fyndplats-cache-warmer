// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Kassans förtroenderuta. Raden "4,9 av 5 på Google" togs bort 2026-11-15 på
// Leonards begäran: på mobil stod den sist i kassan och såg inte snygg ut.
// Betyget står kvar på startsidan, i sidfoten och på /omdomen. Raden hämtade
// dessutom butiksbetyget i varje kassasidas svarstid (samma sak som på
// produktsidan 2026-11-12, lib/produktsida-fortroende.test.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const las = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const kassa = las("app/kassa/kassa.tsx");
const sida = las("app/kassa/page.tsx");
const css = las("app/kassa/kassa.module.css");

const start = kassa.indexOf("const fortroende = (");
const block = kassa.slice(start, kassa.indexOf("const kupongDel", start));

test("raden med Google-betyget finns inte i kassan", () => {
  assert.ok(start > -1, "förtroenderutan saknas");
  // "Google Pay" i raden om betalningen ska stå kvar; betyget ska inte.
  assert.doesNotMatch(block, /av 5 på Google|betyg|GoogleG|★/);
  assert.doesNotMatch(kassa, /GoogleG|betyg\??:|\{betyg|betyg = null/);
});

test("de tre raderna i förtroenderutan står kvar", () => {
  for (const rad of ["30 dagars öppet köp", "Spårbar leverans", "Trygg betalning"]) {
    assert.ok(block.includes(rad), rad);
  }
});

test("kassan hämtar inte längre butiksbetyget", () => {
  assert.doesNotMatch(sida, /getSocialProof|social-proof|betyg=/);
});

test("stilen för raden är borta", () => {
  assert.doesNotMatch(css, /\.betyg/);
});
