// lib/sparning-lage.test.ts
//
// Run with: `npm test` (node --test --experimental-strip-types).
//
// Märket och raden under spårningsnumret. "Spårningen är pausad" gäller bara
// Expired; ett paket på väg tillbaka och en avvikelse får egna ord.

import test from "node:test";
import assert from "node:assert/strict";
import { LAGE_TEXT, lageMarke, sparningsLage } from "./sparning-lage.ts";

test("levererat vinner över allt annat", () => {
  assert.equal(sparningsLage("Delivered", true), "levererad");
  assert.equal(sparningsLage("Exception", true, { status: "Returneras" }), "levererad");
  assert.deepEqual(lageMarke("levererad"), { text: "Levererad", klass: "done" });
});

test("ett paket på väg tillbaka känns igen på den senaste händelsen", () => {
  // 17TRACK ger returen status Exception, så den syns bara i händelsen.
  assert.equal(sparningsLage("Exception", false, { status: "Returneras", desc: "Paketet är på väg tillbaka till avsändaren." }), "retur");
  assert.equal(sparningsLage("Exception", false, { status: "Avvikelse", desc: "Paketet skickas tillbaka till avsändaren." }), "retur");
  assert.equal(sparningsLage("InTransit", false, { status: "Returnerad", desc: "Paketet har returnerats." }), "retur");
  assert.deepEqual(lageMarke("retur"), { text: "På väg tillbaka", klass: "warn" });
  assert.match(LAGE_TEXT.retur.fore, /på väg tillbaka till avsändaren/);
});

test("varje avvikande status får sin egen text", () => {
  assert.equal(sparningsLage("Expired", false, { status: "På väg", desc: "Paketet är på väg." }), "pausad");
  assert.equal(sparningsLage("DeliveryFailure", false), "misslyckad");
  assert.equal(sparningsLage("Undelivered", false), "misslyckad");
  assert.equal(sparningsLage("Exception", false, { status: "Avvikelse", desc: "Det har uppstått en avvikelse i leveransen." }), "avvikelse");
  assert.match(LAGE_TEXT.pausad.fore, /^Spårningen är pausad/);
  assert.doesNotMatch(LAGE_TEXT.avvikelse.fore, /pausad/);
  assert.doesNotMatch(LAGE_TEXT.misslyckad.fore, /pausad/);
  for (const lage of ["pausad", "misslyckad", "avvikelse"] as const) {
    assert.deepEqual(lageMarke(lage), { text: "Behöver kollas", klass: "warn" }, lage);
  }
});

test("ett paket på väg är på väg, även utan händelser", () => {
  assert.equal(sparningsLage("InTransit", false, { status: "På väg", desc: "Paketet är på väg." }), "pa-vag");
  assert.equal(sparningsLage("", false), "pa-vag");
  assert.equal(sparningsLage("InfoReceived", false, undefined), "pa-vag");
  assert.deepEqual(lageMarke("pa-vag"), { text: "På väg till dig", klass: "transit" });
});
