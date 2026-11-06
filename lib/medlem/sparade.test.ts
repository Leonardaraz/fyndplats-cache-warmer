// Sparade varukorgar på Mina sidor (lib/medlem/sparade.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  arKorgId,
  korgnamn,
  MAX_ANTAL,
  MAX_KORGAR,
  MAX_RADER,
  raderAttSpara,
  sparadKorgUrRad,
  sparadKorgVy,
  sparadeSektion,
  sparaFelText,
  somOrderrader,
} from "./sparade.ts";
import { kopIgen, type Katalogvara } from "./kop-igen.ts";
import type { Varukorgsrad } from "./varukorg.ts";

const STORES = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const V1 = "33333333-3333-4333-8333-333333333333";
const rad = (produktId: string, antal: number, over: Partial<Varukorgsrad> = {}): Varukorgsrad => ({
  radId: `r-${produktId}-${antal}`,
  produktId,
  variantId: null,
  appId: STORES,
  antal,
  aOre: 19_900,
  namn: "Skohylla",
  ...over,
});

test("bara varor ur Wix Stores sparas, och samma vara blir en rad", () => {
  const ut = raderAttSpara(
    [
      rad(P1, 2),
      rad(P1, 1),
      rad(P2, 1, { variantId: V1, namn: "Bänk <b>ek</b>" }),
      rad(P2, 1, { appId: "annan-app" }), // presentkort eller tjänst
      rad("inte-ett-id", 1),
    ],
    STORES,
  );
  assert.deepEqual(ut, [
    { produktId: P1, antal: 3, namn: "Skohylla" },
    { produktId: P2, variantId: V1, antal: 1, namn: "Bänk b ek /b" },
  ]);
});

test("antalet hålls inom 1–99 och korgen inom gränsen för rader", () => {
  assert.equal(raderAttSpara([rad(P1, 500)], STORES)[0].antal, MAX_ANTAL);
  assert.equal(raderAttSpara([rad(P1, 0)], STORES)[0].antal, 1);
  assert.equal(raderAttSpara([rad(P1, 80), rad(P1, 80)], STORES)[0].antal, MAX_ANTAL);
  const manga = Array.from({ length: MAX_RADER + 5 }, (_, i) => rad(`${String(i).padStart(8, "0")}-1111-4111-8111-111111111111`, 1));
  assert.equal(raderAttSpara(manga, STORES).length, MAX_RADER);
});

test("namnet rensas och ett tomt namn får dagens datum", () => {
  assert.equal(korgnamn("  Kontoret\n<varje månad>  ", "5 nov"), "Kontoret varje månad");
  assert.equal(korgnamn("", "5 nov"), "Varukorg 5 nov");
  assert.equal(korgnamn(undefined, "5 nov"), "Varukorg 5 nov");
  assert.equal(korgnamn("x".repeat(80), "5 nov").length, 60);
});

test("id:n och rader ur Wix läses strikt, och en trasig rad ger null", () => {
  assert.equal(arKorgId("sk_0123456789abcdef"), true);
  for (const fel of ["sk_0123", "SK_0123456789abcdef", "sk_0123456789abcdeg", 7, null]) assert.equal(arKorgId(fel), false);
  const k = sparadKorgUrRad({
    _id: "sk_0123456789abcdef",
    medlemsId: "m1",
    namn: "Kontoret",
    skapad: "2026-11-05T22:00:00.000Z",
    rader: [{ produktId: P1, antal: 2, namn: "Skohylla" }, { produktId: "fel" }, { produktId: P2, variantId: V1, antal: 400 }],
  });
  assert.deepEqual(k?.rader, [
    { produktId: P1, antal: 2, namn: "Skohylla" },
    { produktId: P2, variantId: V1, antal: MAX_ANTAL, namn: "Vara" },
  ]);
  assert.equal(sparadKorgUrRad({ _id: "annat", medlemsId: "m1", rader: [] }), null);
  assert.equal(sparadKorgUrRad({ _id: "sk_0123456789abcdef", rader: [] }), null);
  assert.equal(sparadKorgUrRad({ _id: "sk_0123456789abcdef", medlemsId: "m1" }), null);
});

test("vyn räknar varorna, och korgen prövas mot katalogen som Köp igen", () => {
  const k = sparadKorgUrRad({
    _id: "sk_0123456789abcdef",
    medlemsId: "m1",
    namn: "Kontoret",
    skapad: "2026-11-05T22:00:00.000Z",
    rader: [
      { produktId: P1, antal: 2, namn: "Skohylla" },
      { produktId: P2, variantId: V1, antal: 1, namn: "Bänk" },
    ],
  })!;
  assert.deepEqual(sparadKorgVy(k), { id: k.id, namn: "Kontoret", antalVaror: 3, forsta: ["Skohylla", "Bänk"], skapad: k.skapad });
  const katalog = new Map<string, Katalogvara>([[P1, { id: P1, inStock: true, variants: [{ id: "x", label: "" }], options: null }]]);
  // P2 säljs inte längre: den räknas som borta, P1 läggs i.
  assert.deepEqual(kopIgen(somOrderrader(k), katalog), { rader: [{ produktId: P1, antal: 2 }], slut: 0, borta: 1 });
});

test("att spara följer växeln, men korgar som finns syns ändå", () => {
  assert.deepEqual(sparadeSektion(0, true), { visas: true, kanSpara: true });
  assert.deepEqual(sparadeSektion(2, true), { visas: true, kanSpara: true });
  // Växeln av: inget nytt sparas, men de två som finns går att använda och ta bort.
  assert.deepEqual(sparadeSektion(2, false), { visas: true, kanSpara: false });
  assert.deepEqual(sparadeSektion(0, false), { visas: false, kanSpara: false });
});

test("varje skäl när sparandet inte gick har en egen text", () => {
  const texter = ["tom", "for-manga", "utloggad", undefined].map(sparaFelText);
  assert.equal(new Set(texter).size, texter.length);
  assert.match(sparaFelText("for-manga"), new RegExp(String(MAX_KORGAR)));
});
