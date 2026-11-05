// "Köp igen" på Mina sidor (lib/medlem/kop-igen.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { kopIgen, kopIgenBesked, MAX_ANTAL, type Katalogvara, type Orderrad } from "./kop-igen.ts";

const enkel = (id: string, inStock = true): Katalogvara => ({ id, inStock, variants: [{ id: "00000000-0000-0000-0000-000000000000", label: "" }], options: null });
const farger = (id: string, val: { variantId: string; inStock?: boolean }[], inStock = true): Katalogvara => ({
  id,
  inStock,
  variants: val.map((v) => ({ id: v.variantId, label: v.variantId })),
  options: {
    name: "Färg",
    choices: val.map((v) => ({ label: v.variantId, image: "", color: "", variantId: v.variantId, price: "", priceNum: 0, originalPrice: "", inStock: v.inStock })),
  },
});
const tabell = (id: string, rader: { variantId: string; inStock: boolean }[]): Katalogvara => ({
  id,
  inStock: true,
  variants: rader.map((r) => ({ id: r.variantId, label: r.variantId })),
  options: null,
  variantTable: rader.map((r) => ({ choices: {}, variantId: r.variantId, price: "", priceNum: 0, originalPrice: "", inStock: r.inStock, image: "" })),
});
const katalog = (...v: Katalogvara[]) => new Map(v.map((p) => [p.id, p]));
const rad = (produktId: string | undefined, antal = 1, variantId?: string, raknas = true): Orderrad => ({ produktId, variantId, antal, raknas });

test("varor som går att köpa läggs i med orderns antal, och en vara utan varianter får inget variant-id", () => {
  const k = katalog(enkel("p1"), farger("p2", [{ variantId: "v-gron" }, { variantId: "v-gra" }]));
  assert.deepEqual(kopIgen([rad("p1", 2, "00000000-0000-0000-0000-000000000000"), rad("p2", 1, "v-gra")], k), {
    rader: [
      { produktId: "p1", antal: 2 },
      { produktId: "p2", variantId: "v-gra", antal: 1 },
    ],
    slut: 0,
    borta: 0,
  });
});

test("slut och borta räknas var för sig, per rad i ordern", () => {
  const k = katalog(
    enkel("slut", false),
    farger("farg", [{ variantId: "v1", inStock: false }, { variantId: "v2" }]),
    tabell("tva", [{ variantId: "t1", inStock: true }, { variantId: "t2", inStock: false }]),
  );
  const r = kopIgen(
    [
      rad("slut"),
      rad("saknas"), // produkten säljs inte längre
      rad("farg", 1, "v1"), // varianten är slut
      rad("farg", 1, "v-borta"), // varianten finns inte längre
      rad("farg", 1), // flera varianter men ingen i ordern: går inte att veta vilken
      rad("tva", 3, "t1"),
      rad("tva", 1, "t2"),
    ],
    k,
  );
  assert.deepEqual(r.rader, [{ produktId: "tva", variantId: "t1", antal: 3 }]);
  assert.equal(r.slut, 3);
  assert.equal(r.borta, 3);
});

test("en produkt som är slut som helhet är slut, även när varianten säger annat", () => {
  const r = kopIgen([rad("farg", 1, "v2")], katalog(farger("farg", [{ variantId: "v2" }], false)));
  assert.deepEqual(r, { rader: [], slut: 1, borta: 0 });
});

test("presentkort, tjänster och rader utan produkt hoppas över tyst", () => {
  const r = kopIgen([rad("p1", 1, undefined, false), rad(undefined), rad("p1")], katalog(enkel("p1")));
  assert.deepEqual(r, { rader: [{ produktId: "p1", antal: 1 }], slut: 0, borta: 0 });
});

test("samma vara två gånger blir en rad, och antalet hålls inom gränsen", () => {
  const k = katalog(enkel("p1"));
  assert.deepEqual(kopIgen([rad("p1", 2), rad("p1", 3)], k).rader, [{ produktId: "p1", antal: 5 }]);
  assert.deepEqual(kopIgen([rad("p1", 80), rad("p1", 80)], k).rader, [{ produktId: "p1", antal: MAX_ANTAL }]);
  assert.deepEqual(kopIgen([rad("p1", 0.4), rad("p1", Number.NaN)], k).rader, [{ produktId: "p1", antal: 2 }]);
  assert.deepEqual(kopIgen([rad("p1", 500)], k).rader, [{ produktId: "p1", antal: MAX_ANTAL }]);
});

test("beskedet säger vad som inte kom med, i ental och flertal", () => {
  assert.equal(kopIgenBesked(2, 0, 0), null);
  assert.equal(kopIgenBesked(2, 1, 0), "1 vara är slut just nu. Resten ligger i varukorgen.");
  assert.equal(kopIgenBesked(1, 0, 2), "2 varor säljs inte längre. Resten ligger i varukorgen.");
  assert.equal(kopIgenBesked(1, 2, 1), "2 varor är slut just nu och 1 vara säljs inte längre. Resten ligger i varukorgen.");
  assert.equal(kopIgenBesked(0, 2, 0), "Varorna i ordern är slut just nu.");
  assert.equal(kopIgenBesked(0, 0, 1), "Varorna i ordern säljs inte längre.");
  assert.equal(kopIgenBesked(0, 1, 1), "Varorna i ordern är slut eller säljs inte längre.");
  assert.equal(kopIgenBesked(0, 0, 0), "Ordern har inga varor som går att köpa igen här.");
});
