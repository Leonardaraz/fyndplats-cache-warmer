// Fången: 789 kr blir 78900 öre. Klassisk fel-input till Klarna OSM. Testet
// finns för att catcha vid pris-refaktoreringar — får aldrig gå sönder.
import { describe, it, expect } from "vitest";
import { toMinorUnits } from "./klarna-price";

describe("toMinorUnits", () => {
  it("konverterar hela SEK till öre", () => {
    expect(toMinorUnits(789)).toBe(78900);
    expect(toMinorUnits(1)).toBe(100);
    expect(toMinorUnits(1000)).toBe(100000);
  });

  it("hanterar decimaler exakt", () => {
    expect(toMinorUnits(789.5)).toBe(78950);
    expect(toMinorUnits(0.01)).toBe(1);
    expect(toMinorUnits(0.99)).toBe(99);
  });

  it("rundar half-away-from-zero (inte bankers)", () => {
    // 0.005 → 0.5 öre → 1 öre (Math.round runt uppåt vid halv)
    expect(toMinorUnits(0.005)).toBe(1);
    // 0.015 → 1.5 öre → 2 öre (INTE 1 som bankers skulle ge)
    expect(toMinorUnits(0.015)).toBe(2);
  });

  it("returnerar 0 för icke-numeriska värden", () => {
    expect(toMinorUnits(null)).toBe(0);
    expect(toMinorUnits(undefined)).toBe(0);
    expect(toMinorUnits(NaN)).toBe(0);
    expect(toMinorUnits(Infinity)).toBe(0);
    expect(toMinorUnits(-Infinity)).toBe(0);
  });

  it("klipper negativa belopp till 0", () => {
    expect(toMinorUnits(-100)).toBe(0);
    expect(toMinorUnits(-0.01)).toBe(0);
  });

  it("hanterar 0 utan att krascha", () => {
    expect(toMinorUnits(0)).toBe(0);
  });
});
