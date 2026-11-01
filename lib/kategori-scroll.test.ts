// lib/kategori-scroll.test.ts
//
// Run with: `npm test` (node --test --experimental-strip-types).
//
// Kategorilistan öppnas vid den aktiva kategorins grupp.

import test from "node:test";
import assert from "node:assert/strict";
import { MARGINAL, aktivGruppId, scrollTillAktiv } from "./kategori-scroll.ts";

// Listan börjar 100 px ner på skärmen och visar 500 px.
const lista = { scrollTop: 0, kroppTopp: 100, hojd: 500 };

test("gruppen läggs överst i listan", () => {
  // Gruppen står 900 px ner i listan, den aktiva raden strax under rubriken.
  const mal = scrollTillAktiv({ ...lista, gruppTopp: 1000, aktivTopp: 1040, aktivBotten: 1075 });
  assert.equal(mal, 900 - MARGINAL);
});

test("en aktiv rad långt ner i en stor grupp syns, en tredjedel ner", () => {
  // Gruppen börjar 900 px ner, raden 700 px längre ner: den ryms inte.
  const mal = scrollTillAktiv({ ...lista, gruppTopp: 1000, aktivTopp: 1700, aktivBotten: 1735 });
  assert.equal(mal, 1600 - Math.round(500 / 3));
  // Raden ligger då inom det synliga.
  const synligTopp = 1600 - mal;
  assert.ok(synligTopp >= 0 && synligTopp + 35 <= 500);
});

test("en rad som precis ryms flyttar inte gruppen", () => {
  const gruppIListan = 900;
  const botten = gruppIListan - MARGINAL + 500 - MARGINAL; // sista pixeln som ryms
  const mal = scrollTillAktiv({ ...lista, gruppTopp: 100 + gruppIListan, aktivTopp: 100 + botten - 35, aktivBotten: 100 + botten });
  assert.equal(mal, gruppIListan - MARGINAL);
});

test("listan har redan scrollats: måtten räknas om till listans egna", () => {
  // Samma grupp som i första testet, men listan står redan 300 px ner,
  // så gruppen syns 300 px högre upp på skärmen.
  const mal = scrollTillAktiv({ ...lista, scrollTop: 300, gruppTopp: 700, aktivTopp: 740, aktivBotten: 775 });
  assert.equal(mal, 900 - MARGINAL);
});

test("en grupp överst ger aldrig ett negativt läge", () => {
  assert.equal(scrollTillAktiv({ ...lista, gruppTopp: 102, aktivTopp: 102, aktivBotten: 140 }), 0);
});

test("panelens inglidning flyttar listan och gruppen lika mycket", () => {
  // Mitt i animationen står allt 300 px längre ner på skärmen.
  const vila = scrollTillAktiv({ ...lista, gruppTopp: 1000, aktivTopp: 1040, aktivBotten: 1075 });
  const glider = scrollTillAktiv({ ...lista, kroppTopp: 400, gruppTopp: 1300, aktivTopp: 1340, aktivBotten: 1375 });
  assert.equal(glider, vila);
});

const trad = [
  { id: "hem", slug: "hem-inredning", subs: [{ slug: "dekoration-prydnad" }, { slug: "belysning" }] },
  { id: "verktyg", slug: "verktyg-maskiner", subs: [] },
];

test("gruppen hittas för en avdelning och för en underkategori", () => {
  assert.equal(aktivGruppId(trad, "hem-inredning"), "hem");
  assert.equal(aktivGruppId(trad, "dekoration-prydnad"), "hem");
  assert.equal(aktivGruppId(trad, "verktyg-maskiner"), "verktyg");
});

test("utan aktiv kategori, eller med en okänd, scrollas ingenting", () => {
  assert.equal(aktivGruppId(trad, undefined), null);
  assert.equal(aktivGruppId(trad, ""), null);
  assert.equal(aktivGruppId(trad, "finns-inte"), null);
});
