import { test } from "node:test";
import assert from "node:assert/strict";
import { bildNyckel, forvalIndex, forvalKombination } from "./pdp-forval.ts";

const W = (id: string) => `https://static.wixstatic.com/media/${id}/v1/fill/w_800,h_800/a.jpg`;

test("bildNyckel tar Wix fil-id oavsett transform", () => {
  assert.equal(bildNyckel(W("b379ce_a~mv2.jpg")), "b379ce_a~mv2.jpg");
  assert.equal(bildNyckel("https://static.wixstatic.com/media/b379ce_a~mv2.jpg"), "b379ce_a~mv2.jpg");
  assert.equal(bildNyckel(undefined), "");
});

test("förvalet är valet med huvudbilden (linnet: svart på kortet, inte brunt)", () => {
  const val = [
    { image: W("brun"), inStock: true },
    { image: W("svart"), inStock: true },
  ];
  assert.equal(forvalIndex(val, W("svart")), 1);
});

test("huvudbildens val slutsålt → första valet i lager", () => {
  const val = [
    { image: W("brun"), inStock: false },
    { image: W("gron"), inStock: true },
    { image: W("svart"), inStock: false },
  ];
  assert.equal(forvalIndex(val, W("svart")), 1);
  assert.equal(forvalIndex(val, undefined), 1);
});

test("allt slut → första valet", () => {
  assert.equal(forvalIndex([{ inStock: false }, { inStock: false }], W("x")), 0);
  assert.equal(forvalIndex([], W("x")), 0);
});

test("flera axlar: kombinationen med huvudbilden, annars första i lager", () => {
  const tabell = [
    { choices: { Färg: "Grön", Storlek: "177" }, inStock: true, image: W("gron") },
    { choices: { Färg: "Grå", Storlek: "177" }, inStock: true, image: W("gra") },
    { choices: { Färg: "Svart", Storlek: "205" }, inStock: false, image: W("svart") },
  ];
  assert.deepEqual(forvalKombination(tabell, W("gra")), { Färg: "Grå", Storlek: "177" });
  assert.deepEqual(forvalKombination(tabell, W("svart")), { Färg: "Grön", Storlek: "177" });
  assert.deepEqual(forvalKombination([], W("svart")), {});
});
