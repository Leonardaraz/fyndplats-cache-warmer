// lib/order-raknas.test.ts — vilka Wix-ordrar som är köp (lib/order-raknas.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { arKop, liggarradArKop } from "./order-raknas.ts";

test("en order som väntar på betalning i vår kassa är inget köp", () => {
  assert.equal(arKop({ status: "INITIALIZED", paymentStatus: "PENDING" }), false);
  assert.equal(arKop({ status: "INITIALIZED", paymentStatus: "NOT_PAID" }), false);
  assert.equal(arKop({ status: "initialized" }), false, "gemener som popularitetens läsning");
});

test("en avbruten order som aldrig betalades är inget köp", () => {
  for (const p of ["NOT_PAID", "PENDING", "PENDING_MERCHANT", "CANCELED", "DECLINED", "UNSPECIFIED", "not_paid"]) {
    assert.equal(arKop({ status: "CANCELED", paymentStatus: p }), false, p);
  }
});

test("betalda ordrar är köp, också avbrutna och återbetalda", () => {
  assert.equal(arKop({ status: "APPROVED", paymentStatus: "PAID" }), true);
  assert.equal(arKop({ status: "APPROVED", paymentStatus: "NOT_PAID" }), true, "manuell betalning: godkänd men obetald");
  assert.equal(arKop({ status: "CANCELED", paymentStatus: "FULLY_REFUNDED" }), true);
  assert.equal(arKop({ status: "CANCELED", paymentStatus: "PARTIALLY_REFUNDED" }), true);
  assert.equal(arKop({ status: "CANCELED", paymentStatus: "PAID" }), true);
});

test("ett fält som saknas tappar aldrig en order", () => {
  assert.equal(arKop({}), true);
  assert.equal(arKop({ status: "CANCELED" }), true);
  assert.equal(arKop({ paymentStatus: "NOT_PAID" }), true);
  assert.equal(arKop({ status: 7 }), true);
  assert.equal(arKop(undefined), true);
  assert.equal(arKop(null), true);
});

test("medlemmarnas liggarrad prövas med samma regel (orderstatus och betalstatus)", () => {
  // Kassans provordrar natten mot 2026-11-06: avbrutna, betalningen PENDING, nummer 0.
  assert.equal(liggarradArKop({ orderstatus: "CANCELED", betalstatus: "PENDING" }), false);
  assert.equal(liggarradArKop({ orderstatus: "INITIALIZED", betalstatus: "PENDING" }), false);
  assert.equal(liggarradArKop({ orderstatus: "CANCELED", betalstatus: "NOT_PAID" }), false);
  assert.equal(liggarradArKop({ orderstatus: "APPROVED", betalstatus: "PAID" }), true);
  assert.equal(liggarradArKop({ orderstatus: "CANCELED", betalstatus: "FULLY_REFUNDED" }), true, "återbetald är ett köp som visas");
  assert.equal(liggarradArKop({ orderstatus: "APPROVED", betalstatus: "NOT_PAID" }), true, "faktura: godkänd men obetald");
  assert.equal(liggarradArKop({}), true, "en rad utan fälten tappas aldrig");
  assert.equal(liggarradArKop(undefined), true);
});

test("liggaren tar bara emot köp, och kontot läser bara köp", async () => {
  // Kopplingen prövas i källan: modulerna anropar Wix och går inte att köra här.
  const { readFile } = await import("node:fs/promises");
  const liggare = await readFile(new URL("./medlem/liggare.ts", import.meta.url), "utf8");
  const lager = await readFile(new URL("./medlem/lager.ts", import.meta.url), "utf8");
  const uppdatera = liggare.slice(liggare.indexOf("export async function uppdateraOrderliggare("), liggare.indexOf("export async function uppdateraOrderliggareTyst("));
  assert.match(uppdatera, /if \(!arKop\(order\)\) return \{ utfall: "inget-kop"/, "webhooken och inloggningen skriver aldrig ett försök");
  assert.ok(uppdatera.indexOf("arKop(order)") < uppdatera.indexOf("radFor(order)"), "provet före raden");
  const genomga = liggare.slice(liggare.indexOf("async function genomga("), liggare.indexOf("export function stamAv("));
  assert.match(genomga, /if \(!arKop\(order\)\) continue;/, "avstämningen och bakåtläsningen hoppar över försök");
  assert.ok(genomga.indexOf("arKop(order)") < genomga.indexOf("g.avvikelser++"), "ett försök blir aldrig en avvikelse");
  const forEpost = lager.slice(lager.indexOf("export async function liggarraderForEpost("), lager.indexOf("export async function liggarraderBetaldaSedan("));
  assert.match(forEpost, /\.filter\(liggarradArKop\)/, "Mina sidor och inloggningen ser bara köp");
});
