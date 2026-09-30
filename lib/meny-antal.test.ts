// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { menyAntal, utanAntal } from "./meny-antal.ts";

const trad = [
  { id: "a", name: "Möbler", slug: "mobler", count: 1170, subs: [
    { id: "a1", name: "Matbord", slug: "matbord", count: 141 },
    { id: "a2", name: "Soffor", slug: "soffor", count: 88 },
  ] },
  { id: "b", name: "Trädgård", slug: "tradgard", count: 351, subs: [] },
];

test("menyAntal: slug → antal för huvud- och underkategorier", () => {
  assert.deepEqual(menyAntal(trad), { mobler: 1170, matbord: 141, soffor: 88, tradgard: 351 });
});

test("utanAntal: samma träd, samma ordning och länkar, inga siffror", () => {
  const ut = utanAntal(trad);
  assert.deepEqual(ut.map((m) => m.slug), ["mobler", "tradgard"]);
  assert.deepEqual(ut[0].subs.map((s) => s.slug), ["matbord", "soffor"]);
  assert.ok(ut.every((m) => m.count === 0 && m.subs.every((s) => s.count === 0)));
  // Inga siffror i det som serialiseras med sidan.
  assert.doesNotMatch(JSON.stringify(ut), /1170|141|351|88/);
  // Originalet rörs inte.
  assert.equal(trad[0].count, 1170);
});

test("headern skickar trädet utan antal till båda menyerna", () => {
  const src = readFileSync("components/site.tsx", "utf8");
  assert.match(src, /<MegaNav tree=\{utanAntal\(tree\)\}/);
  assert.match(src, /<MobileNav tree=\{utanAntal\(tree\)\}/);
});

test("menyerna läser antalen ur /api/meny-antal, inte ur trädet", () => {
  for (const fil of ["components/meganav.tsx", "components/mobilenav.tsx"]) {
    const src = readFileSync(fil, "utf8");
    assert.match(src, /useMenyAntal\(\)/, `${fil} ska hämta antalen i webbläsaren`);
    assert.doesNotMatch(src, /\{s\.count\}|\(m\.count\)/, `${fil} läser fortfarande antal ur trädet`);
  }
});
