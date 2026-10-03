// Run: node --test --experimental-strip-types lib/kategori-i-mening.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { kategoriIMening } from "./kategori-i-mening.ts";

test("kategorinamn får liten bokstav i en mening", () => {
  assert.equal(kategoriIMening("Julgranar"), "julgranar");
  assert.equal(kategoriIMening("Trädgård & Utemöbler"), "trädgård & utemöbler");
  assert.equal(kategoriIMening("Övrigt"), "övrigt");
});

test("förkortningar behåller sina versaler", () => {
  assert.equal(kategoriIMening("TV-bänkar"), "TV-bänkar");
  assert.equal(kategoriIMening("LED-belysning & Lampor"), "LED-belysning & lampor");
});
