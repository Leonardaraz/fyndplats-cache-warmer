import { describe, expect, it } from "vitest";
import { KOLLEKTIONER } from "./wix-kollektioner";
import { neonKallor } from "../migration/neon-till-wix-kallor";

describe("motorns kollektioner i Wix", () => {
  it("☠️ varje kopierad tabell har sin kollektion i listan — annars förbereds den inte", () => {
    const kanda = new Set(KOLLEKTIONER.map((k) => k.id));
    for (const k of neonKallor()) expect(kanda.has(k.kollektion), k.kollektion).toBe(true);
    expect(kanda.has("FyndplatsAliExpressTokens")).toBe(true);
  });

  it("Wix tar högst 3 vanliga index per kollektion, med högst 3 fält var", () => {
    for (const k of KOLLEKTIONER) {
      expect(k.index.length, k.id).toBeLessThanOrEqual(3);
      for (const i of k.index) expect(i.falt.length, `${k.id}/${i.namn}`).toBeLessThanOrEqual(3);
    }
  });
});
