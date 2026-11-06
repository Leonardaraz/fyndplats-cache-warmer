// Medlemskorgen i vår kassa: kakan, korgens form, när den får användas och vilka
// rader som tas bort ur besökarens korg efter köpet.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LAST_KORG_BORT,
  LAST_KORG_KAKA,
  LAST_KORG_SEK,
  beslutetsRensning,
  innehall,
  korgensEpost,
  lastKorgAnvandbar,
  lastKorgId,
  lastKorgKaka,
  lastKorgStammer,
  medSdkId,
  orderBetald,
  radensNyckel,
  raderAttTaBort,
  rensningsplan,
} from "./lastkorg.ts";

const ID = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

test("kakan: bara ett GUID, httpOnly, ett dygn, och borttagningen med maxAge 0", () => {
  assert.equal(lastKorgId(ID), ID);
  assert.equal(lastKorgId("inte-ett-id"), null);
  assert.equal(lastKorgId(undefined), null);
  assert.equal(lastKorgId(`${ID}x`), null);
  assert.deepEqual(lastKorgKaka(ID), { name: LAST_KORG_KAKA, value: ID, httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: LAST_KORG_SEK });
  assert.equal(LAST_KORG_SEK, 86_400);
  assert.equal(LAST_KORG_BORT.maxAge, 0);
  assert.equal(LAST_KORG_BORT.httpOnly, true);
});

test("REST-korgen får _id på korgen och på raderna", () => {
  const ut = medSdkId({ id: ID, lineItems: [{ id: "r1", quantity: 1 }, { _id: "r2" }] }) as { _id: string; lineItems: { _id: string }[] };
  assert.equal(ut._id, ID);
  assert.deepEqual(
    ut.lineItems.map((r) => r._id),
    ["r1", "r2"],
  );
  assert.equal(medSdkId(null), null);
});

test("en låst korg som blivit en order, eller saknar rader, används inte", () => {
  assert.equal(lastKorgAnvandbar({ id: ID, lineItems: [{ id: "r1" }] }), true);
  assert.equal(lastKorgAnvandbar({ id: ID, lineItems: [{ id: "r1" }], orderPlaced: true }), false);
  assert.equal(lastKorgAnvandbar({ id: ID, lineItems: [{ id: "r1" }], orderId: "o1" }), false);
  assert.equal(lastKorgAnvandbar({ id: ID, lineItems: [] }), false);
  assert.equal(lastKorgAnvandbar(null), false);
});

test("korgens e-post: Cart V2 bär den i customerInfo, äldre former i buyerInfo", () => {
  // Uppmätt på förhandslänken 2026-11-06: korgen som skapas med customerInfo.email har ingen buyerInfo.
  assert.equal(korgensEpost({ id: ID, customerInfo: { openAccess: true, email: "medlem@exempel.se" } }), "medlem@exempel.se");
  assert.equal(korgensEpost({ id: ID, buyerInfo: { email: "kopare@exempel.se" } }), "kopare@exempel.se");
  assert.equal(korgensEpost({ id: ID, customerInfo: { email: "a@exempel.se" }, buyerInfo: { email: "b@exempel.se" } }), "a@exempel.se");
  assert.equal(korgensEpost({ id: ID, customerInfo: { openAccess: true } }), null);
  assert.equal(korgensEpost({ customerInfo: { email: "inte-en-adress" } }), null);
  assert.equal(korgensEpost(null), null);
});

test("radens vara: Cart V2 (source) och äldre form, med och utan variant", () => {
  assert.equal(radensNyckel({ source: { catalogReference: { catalogItemId: "p1", options: { variantId: "v1" } } } }), "p1|v1");
  assert.equal(radensNyckel({ catalogReference: { catalogItemId: "p2" } }), "p2|");
  assert.equal(radensNyckel({ source: {} }), null);
});

test("efter köpet: bara de köpta varorna bort ur besökarens korg, oavsett antal", () => {
  const besokare = [
    { id: "a", quantity: 2, source: { catalogReference: { catalogItemId: "p1", options: { variantId: "v1" } } } },
    { id: "b", quantity: 1, source: { catalogReference: { catalogItemId: "p1", options: { variantId: "v2" } } } },
    { id: "c", quantity: 1, source: { catalogReference: { catalogItemId: "p3" } } },
    { id: "d", quantity: 1, source: { catalogReference: { catalogItemId: "p4" } } },
  ];
  assert.deepEqual(
    raderAttTaBort(besokare, [
      { produktId: "p1", variantId: "v1" },
      { produktId: "p3", variantId: null },
    ]),
    ["a", "c"],
  );
  assert.deepEqual(raderAttTaBort(besokare, []), []);
});

const rad = (id: string, produkt: string, variant: string | null, antal: number) => ({
  _id: id,
  quantity: antal,
  catalogReference: { catalogItemId: produkt, ...(variant ? { options: { variantId: variant } } : {}) },
});

test("innehållet: vara och antal, oberoende av ordning och radernas id", () => {
  const a = [rad("r1", "p1", "v1", 2), rad("r2", "p2", null, 1)];
  const b = [rad("x9", "p2", null, 1), rad("x8", "p1", "v1", 2)];
  assert.equal(innehall(a), innehall(b));
  assert.notEqual(innehall(a), innehall([rad("r1", "p1", "v1", 3), rad("r2", "p2", null, 1)]));
  assert.notEqual(innehall(a), innehall([rad("r1", "p1", "v2", 2), rad("r2", "p2", null, 1)]));
  assert.notEqual(innehall(a), innehall([rad("r1", "p1", "v1", 2)]));
  // Cart V2 (source) och den normaliserade formen ger samma vara.
  assert.equal(innehall([{ quantity: 1, source: { catalogReference: { catalogItemId: "p1" } } }]), innehall([rad("r", "p1", null, 1)]));
});

test("den låsta korgen gäller bara så länge varukorgen är densamma", () => {
  const rader = [rad("r1", "p1", "v1", 2), rad("r2", "p2", null, 1)];
  const last = { rader, besokarensKorg: "korg-a" };
  assert.equal(lastKorgStammer(last, { id: "korg-a", rader: [rad("b1", "p2", null, 1), rad("b2", "p1", "v1", 2)] }), true);
  // Ändrat antal, en vara till eller en vara bort: medlemspriset räknas om.
  assert.equal(lastKorgStammer(last, { id: "korg-a", rader: [rad("b1", "p1", "v1", 3), rad("b2", "p2", null, 1)] }), false);
  assert.equal(lastKorgStammer(last, { id: "korg-a", rader: [...rader, rad("b3", "p3", null, 1)] }), false);
  assert.equal(lastKorgStammer(last, { id: "korg-a", rader: [rader[0]] }), false);
  // En annan varukorg (gammal kaka, annan webbläsare): släpps.
  assert.equal(lastKorgStammer(last, { id: "korg-b", rader }), false);
  // Varukorgens id okänt: innehållet avgör.
  assert.equal(lastKorgStammer(last, { id: null, rader }), true);
  // En offert har ingen besökarkorg: den gäller oavsett varukorgen.
  assert.equal(lastKorgStammer({ rader, besokarensKorg: null }, { id: "korg-b", rader: [] }), true);
});

const BESLUT = {
  cartId: ID,
  besokarensKorg: "korg-a",
  rader: [
    { produktId: "p1", variantId: "v1", antal: 2 },
    { produktId: "p3", antal: 1 },
  ],
};
const BETALD = { cartId: ID, paymentStatus: "PAID", status: "APPROVED" };

test("efter köpet: besökarens korg töms bara för en betald order ur just den låsta korgen", () => {
  assert.deepEqual(rensningsplan(ID, BESLUT, BETALD), {
    gor: "rensa",
    besokarensKorg: "korg-a",
    kopta: [
      { produktId: "p1", variantId: "v1" },
      { produktId: "p3", variantId: null },
    ],
  });
  // Wix kassa: ordern bär kassans id, som i Cart V2 är korgens.
  assert.equal(rensningsplan(ID, BESLUT, { checkoutId: ID, paymentStatus: "PAID" }).gor, "rensa");
  // Godkänd utan betalning (betala personligen) räknas som Wix räknar den.
  assert.equal(rensningsplan(ID, BESLUT, { cartId: ID, paymentStatus: "NOT_PAID", status: "APPROVED" }).gor, "rensa");
  assert.deepEqual(rensningsplan(ID, BESLUT, { cartId: ID, paymentStatus: "NOT_PAID", status: "INITIALIZED" }), { gor: "inget", varfor: "obetald" });
  assert.deepEqual(rensningsplan(ID, BESLUT, { ...BETALD, cartId: "en-annan-korg" }), { gor: "inget", varfor: "annan-korg" });
  assert.deepEqual(rensningsplan(ID, BESLUT, null), { gor: "inget", varfor: "annan-korg" });
});

test("efter köpet: offert, redan tömd eller inget beslut rör inte besökarens korg", () => {
  assert.deepEqual(beslutetsRensning(null), { gor: "inget", varfor: "inget-beslut" });
  assert.deepEqual(beslutetsRensning({ ...BESLUT, besokarensKorg: undefined, offertId: "o1" }), { gor: "inget", varfor: "offert" });
  assert.deepEqual(beslutetsRensning({ ...BESLUT, besokarensKorgRensad: "order-1" }), { gor: "inget", varfor: "redan" });
  assert.deepEqual(beslutetsRensning({ ...BESLUT, rader: [{ antal: 1 }] }), { gor: "inget", varfor: "inga-rader" });
  // Beslutet avgör före ordern: en betald order ändrar inte en offert.
  assert.deepEqual(rensningsplan(ID, { ...BESLUT, besokarensKorg: "" }, BETALD), { gor: "inget", varfor: "offert" });
});

test("betald som Wix räknar: betald, återbetald eller godkänd", () => {
  assert.equal(orderBetald({ paymentStatus: "PAID" }), true);
  assert.equal(orderBetald({ paymentStatus: "PARTIALLY_REFUNDED" }), true);
  assert.equal(orderBetald({ paymentStatus: "FULLY_REFUNDED" }), true);
  assert.equal(orderBetald({ paymentStatus: "NOT_PAID", status: "APPROVED" }), true);
  assert.equal(orderBetald({ paymentStatus: "NOT_PAID", status: "INITIALIZED" }), false);
  assert.equal(orderBetald({ paymentStatus: "PENDING" }), false);
  assert.equal(orderBetald(null), false);
});
