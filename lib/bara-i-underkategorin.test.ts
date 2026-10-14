// lib/bara-i-underkategorin.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BARA_I_UNDERKATEGORIN, produkterIKategorin } from "./bara-i-underkategorin.ts";

const CIGARETTMASKIN = "f31eb0a5-5267-40fd-b193-a5adbebfb5d0";

const HEM = { id: "hem", parentId: null };
const HUSHALL = { id: "hushall", parentId: "hem" };
const LAMPOR = { id: "lampor", parentId: "hem" };
const MOBLER = { id: "mobler", parentId: null };
const KATEGORIER = [HEM, HUSHALL, LAMPOR, MOBLER];

const PRODUKTER = [
  { id: CIGARETTMASKIN, collectionIds: ["hushall"] },
  { id: "dammsugare", collectionIds: ["hushall"] },
  { id: "golvlampa", collectionIds: ["hem", "lampor"] },
  { id: "soffa", collectionIds: ["mobler"] },
];

const idn = (lista: { id: string }[]) => lista.map((p) => p.id);

test("cigarettmaskinen står i listan", () => {
  assert.ok(BARA_I_UNDERKATEGORIN.has(CIGARETTMASKIN));
});

test("avdelningen visar inte cigarettmaskinen, varken via underkategorin eller direkt", () => {
  assert.deepEqual(idn(produkterIKategorin(PRODUKTER, HEM, KATEGORIER)), ["dammsugare", "golvlampa"]);
  const direkt = [{ id: CIGARETTMASKIN, collectionIds: ["hem", "hushall"] }];
  assert.deepEqual(produkterIKategorin(direkt, HEM, KATEGORIER), []);
});

test("underkategorin visar cigarettmaskinen som vanligt", () => {
  assert.deepEqual(idn(produkterIKategorin(PRODUKTER, HUSHALL, KATEGORIER)), [CIGARETTMASKIN, "dammsugare"]);
});

test("allt annat räknas som förut", () => {
  assert.deepEqual(idn(produkterIKategorin(PRODUKTER, LAMPOR, KATEGORIER)), ["golvlampa"]);
  assert.deepEqual(idn(produkterIKategorin(PRODUKTER, MOBLER, KATEGORIER)), ["soffa"]);
  // En produkt utan kategorier hamnar ingenstans.
  assert.deepEqual(produkterIKategorin([{ id: "x" }], HEM, KATEGORIER), []);
});

test("kategorisidan och prissidorna använder regeln", () => {
  for (const fil of ["lib/list-pages.ts", "lib/seo/programmatic.ts"]) {
    const kod = readFileSync(join(process.cwd(), fil), "utf8");
    assert.match(kod, /produkterIKategorin\(/, `${fil} ska välja produkter med produkterIKategorin`);
  }
});
