// lib/kassans-leveranstid.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar jobbet som skriver leveransdatumet i Wix-kassans leveransval
// (lib/kassans-leveranstid.ts): rätt alternativ skrivs, ett främmande rörs inte,
// och ett alternativ som tappat sina priser får tillbaka dem.
import test from "node:test";
import assert from "node:assert/strict";
import {
  agsAvJobbet,
  kassansLeveranstext,
  uppdateraKassansLeveranstid,
  type Fraktalternativ,
  type KassansLeveranstidDeps,
} from "./kassans-leveranstid.ts";

const PRISER = [
  { amount: "19", conditions: [], multiplyByQuantity: false },
  { amount: "0", conditions: [{ type: "BY_TOTAL_PRICE", value: "500", operator: "GTE" }], multiplyByQuantity: false },
];
const TEXT = kassansLeveranstext("ons 14 – mån 19 oktober");

function standard(text = "3–6 arbetsdagar"): Fraktalternativ {
  return {
    id: "std",
    revision: "7",
    title: "Spårbar standardleverans",
    estimatedDeliveryTime: text,
    rates: structuredClone(PRISER),
    deliveryRegionIds: ["se"],
  };
}

/** Ett Wix i minnet. `efterSkrivning` låter ett test göra något med alternativet när texten skrivs. */
function falskWix(alternativ: Fraktalternativ[], efterSkrivning?: (a: Fraktalternativ) => void) {
  const lager = new Map(alternativ.map((a) => [a.id, structuredClone(a)]));
  const logg: string[] = [];
  const deps: KassansLeveranstidDeps = {
    async lasAlla() {
      return [...lager.values()].map((a) => structuredClone(a));
    },
    async las(id) {
      const a = lager.get(id);
      if (!a) throw new Error(`404 ${id}`);
      return structuredClone(a);
    },
    async skrivText(id, revision, text) {
      const a = lager.get(id)!;
      if (a.revision !== revision) throw new Error("409 revision");
      logg.push(`text ${id}`);
      a.estimatedDeliveryTime = text;
      a.revision = String(Number(a.revision) + 1);
      efterSkrivning?.(a);
    },
    async aterstallPriser(id, revision, rates) {
      const a = lager.get(id)!;
      if (a.revision !== revision) throw new Error("409 revision");
      logg.push(`priser ${id}`);
      a.rates = structuredClone(rates);
      a.revision = String(Number(a.revision) + 1);
    },
  };
  return { deps, lager, logg };
}

test("texten skrivs, och priserna står kvar", async () => {
  const wix = falskWix([standard()]);
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "skriven");
  assert.deepEqual(u.skrivna, [{ id: "std", fore: "3–6 arbetsdagar" }]);
  assert.equal(wix.lager.get("std")!.estimatedDeliveryTime, TEXT);
  assert.deepEqual(wix.lager.get("std")!.rates, PRISER);
});

test("står texten redan rätt skrivs ingenting", async () => {
  const wix = falskWix([standard(TEXT)]);
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "oforandrad");
  assert.deepEqual(wix.logg, []);
});

test("gårdagens datum byts mot dagens", async () => {
  const wix = falskWix([standard(kassansLeveranstext("tis 13 – fre 16 oktober"))]);
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "skriven");
  assert.equal(wix.lager.get("std")!.estimatedDeliveryTime, TEXT);
});

test("ett annat alternativ med egen tid rörs aldrig", async () => {
  const express: Fraktalternativ = { ...standard("1–2 arbetsdagar"), id: "express", title: "Express" };
  const wix = falskWix([standard(), express]);
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "skriven");
  assert.equal(wix.lager.get("express")!.estimatedDeliveryTime, "1–2 arbetsdagar");
  assert.deepEqual(wix.logg, ["text std"]);
});

test("en egen text i Wix skrivs inte över, och det blir ett fel", async () => {
  const wix = falskWix([standard("3–7 arbetsdagar")]);
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "fel");
  assert.deepEqual(wix.logg, []);
  assert.match(u.fel[0], /inget fraktalternativ/);
});

test("tappar skrivningen priserna läggs de tillbaka direkt", async () => {
  const wix = falskWix([standard()], (a) => {
    a.rates = [];
  });
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "fel");
  assert.deepEqual(wix.logg, ["text std", "priser std"]);
  assert.deepEqual(wix.lager.get("std")!.rates, PRISER);
  assert.ok(!u.fel.some((f) => f.includes("KRITISKT")));
});

test("en text som inte läses tillbaka är ett fel, inte en skrivning", async () => {
  const wix = falskWix([standard()], (a) => {
    a.estimatedDeliveryTime = "3–6 arbetsdagar";
  });
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "fel");
  assert.deepEqual(u.skrivna, []);
});

test("en avvisad skrivning blir ett fel och nästa timme försöker igen", async () => {
  const wix = falskWix([standard()]);
  wix.deps.skrivText = async () => {
    throw new Error("409 revision");
  };
  const u = await uppdateraKassansLeveranstid(TEXT, 3, 6, wix.deps);
  assert.equal(u.status, "fel");
  assert.match(u.fel[0], /409/);
});

test("jobbets egen text och den gamla, med eller utan tankstreck, ägs av jobbet", () => {
  assert.ok(agsAvJobbet("3–6 arbetsdagar", 3, 6));
  assert.ok(agsAvJobbet("3-6 arbetsdagar", 3, 6));
  assert.ok(agsAvJobbet(TEXT, 3, 6));
  assert.ok(!agsAvJobbet("1–2 arbetsdagar", 3, 6));
  assert.ok(!agsAvJobbet("Beräknad leveranstid 3 dagar", 3, 6));
  assert.ok(!agsAvJobbet(undefined, 3, 6));
});
