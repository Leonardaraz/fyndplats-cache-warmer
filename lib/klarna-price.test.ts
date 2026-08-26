// Fången: 789 kr blir 78900 öre. Klassisk fel-input till Klarna OSM. Testet
// finns för att catcha vid pris-refaktoreringar — får aldrig gå sönder.
// Repot kör node --test (se package.json), inte vitest — och en testfil måste
// importera sin syskonmodul MED .ts-ändelse för att köraren ska hitta den.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toMinorUnits } from "./klarna-price.ts";

describe("toMinorUnits", () => {
  it("konverterar hela SEK till öre", () => {
    assert.equal(toMinorUnits(789), 78900);
    assert.equal(toMinorUnits(1), 100);
    assert.equal(toMinorUnits(1000), 100000);
  });

  it("hanterar decimaler exakt", () => {
    assert.equal(toMinorUnits(789.5), 78950);
    assert.equal(toMinorUnits(0.01), 1);
    assert.equal(toMinorUnits(0.99), 99);
  });

  it("rundar half-away-from-zero (inte bankers)", () => {
    // 0.005 → 0.5 öre → 1 öre (Math.round runt uppåt vid halv)
    assert.equal(toMinorUnits(0.005), 1);
    // 0.015 → 1.5 öre → 2 öre (INTE 1 som bankers skulle ge)
    assert.equal(toMinorUnits(0.015), 2);
  });

  it("returnerar 0 för icke-numeriska värden", () => {
    assert.equal(toMinorUnits(null), 0);
    assert.equal(toMinorUnits(undefined), 0);
    assert.equal(toMinorUnits(NaN), 0);
    assert.equal(toMinorUnits(Infinity), 0);
    assert.equal(toMinorUnits(-Infinity), 0);
  });

  it("klipper negativa belopp till 0", () => {
    assert.equal(toMinorUnits(-100), 0);
    assert.equal(toMinorUnits(-0.01), 0);
  });

  it("hanterar 0 utan att krascha", () => {
    assert.equal(toMinorUnits(0), 0);
  });
});
