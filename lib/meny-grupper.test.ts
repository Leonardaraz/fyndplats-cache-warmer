// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { MENY_GRUPPER, grupperaUnderkategorier, avdelningIHuvudmenyn, manadISverige } from "./meny-grupper.ts";

const sub = (slug: string) => ({ id: slug, slug });

test("varje underkategori kommer med exakt en gång, okända sist under Mer", () => {
  const subs = ["kontorsstolar", "soffor-baddsoffor", "ny-kategori", "gamingstolar", "byraer"].map(sub);
  const g = grupperaUnderkategorier("mobler", subs);
  assert.deepEqual(g.map((x) => x.rubrik), ["Vardagsrum", "Sovrum", "Kontor & gaming", "Mer"]);
  assert.deepEqual(g.flatMap((x) => x.subs.map((s) => s.slug)).sort(), subs.map((s) => s.slug).sort());
  assert.deepEqual(g.at(-1)?.subs.map((s) => s.slug), ["ny-kategori"]);
});

test("tomma grupper visas inte", () => {
  const g = grupperaUnderkategorier("husdjur", [sub("klostrad")]);
  assert.deepEqual(g, [{ rubrik: "Katt", subs: [sub("klostrad")] }]);
});

test("avdelning utan grupper får en rubriklös lista i Wix ordning", () => {
  const subs = [sub("massagebankar"), sub("hudvard-ansikte")];
  assert.deepEqual(grupperaUnderkategorier("skonhet-halsa", subs), [{ rubrik: null, subs }]);
  assert.deepEqual(grupperaUnderkategorier("skonhet-halsa", []), []);
});

test("ingen slug står i två grupper, och alla är butikens ASCII-slugar", () => {
  for (const [avd, grupper] of Object.entries(MENY_GRUPPER)) {
    const alla = grupper.flatMap((g) => g.slugs);
    assert.equal(new Set(alla).size, alla.length, avd);
    for (const s of [avd, ...alla]) assert.match(s, /^[a-z0-9-]+$/, s);
  }
});

test("Jul & Högtider står i menyn september–januari, i svensk tid", () => {
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2026-09-01T00:30:00+02:00")), true);
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2027-01-31T12:00:00+01:00")), true);
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2027-02-01T00:30:00+01:00")), false);
  // 31 augusti 23:30 UTC är redan 1 september i Sverige.
  assert.equal(manadISverige(new Date("2026-08-31T23:30:00Z")), 9);
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2026-07-15T12:00:00Z")), false);
  assert.equal(avdelningIHuvudmenyn("Möbler", new Date("2026-07-15T12:00:00Z")), true);
});
