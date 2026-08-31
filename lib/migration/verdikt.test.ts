import { describe, expect, it } from "vitest";
import { bedömTabell, MASSFEL_GOLV } from "./verdikt";

describe("bedömTabell — före växlingen", () => {
  const före = (w: number, p: number, a = 0) => bedömTabell(w, p, a, false);

  it("stämmer när kopian är komplett", () => {
    expect(före(5470, 5470).stämmer).toBe(true);
  });

  it("☠️ EN enda tappad rad fäller — det är dataförlust", () => {
    expect(före(5470, 5469).stämmer).toBe(false);
  });

  it("överskott fäller INTE: källan städas medan kopieringen pågår", () => {
    const v = före(3441, 3472);
    expect(v.stämmer).toBe(true);
    expect(v.överskott).toBe(31);
  });

  it("rapporterar aldrig drift före växlingen — allt är fel eller inget", () => {
    expect(före(1795, 1790).drift).toBe(0);
  });
});

describe("bedömTabell — efter växlingen", () => {
  const efter = (w: number, p: number, a = 0) => bedömTabell(w, p, a, true);

  // De tre verkliga fallen ur körningen 22:06, en halvtimme efter växlingen.
  it("sync_alerts 18 → 32: synken skriver larm igen", () => {
    const v = efter(18, 32);
    expect(v.stämmer).toBe(true);
    expect(v.överskott).toBe(14);
  });

  it("audit 1795 → 1790: synkens städning tog 7 rader >14 dygn", () => {
    const v = efter(1795, 1790);
    expect(v.stämmer).toBe(true);
    expect(v.drift).toBe(5);
  });

  it("sync_state: ett uppdaterat fält är drift, inte fel", () => {
    const v = efter(1088, 1088, 1);
    expect(v.stämmer).toBe(true);
    expect(v.drift).toBe(1);
  });

  it("☠️ MASSFEL fäller fortfarande — halva tabellen borta är inte drift", () => {
    expect(efter(5470, 2700).stämmer).toBe(false);
  });

  it("☠️ en tom tabell fäller — det är exakt utplåningen spärren finns för", () => {
    expect(efter(5470, 0).stämmer).toBe(false);
  });

  it("golvet skyddar små tabeller från att fälla på enstaka rader", () => {
    // 16 rader, 2 borta = 12,5 % — över andelen men under golvet.
    expect(efter(16, 14).stämmer).toBe(true);
    expect(bedömTabell(16, 14, 0, true).drift).toBe(2);
  });

  it("golvet ensamt räcker inte: en stor tabell fäller först över BÅDA", () => {
    // 5 470 rader, 26 borta = över golvet men bara 0,5 % — drift.
    expect(efter(5470, 5470 - (MASSFEL_GOLV + 1)).stämmer).toBe(true);
    // Samma absoluta brist i en tabell där den är 20 % — massfel.
    expect(efter(130, 130 - (MASSFEL_GOLV + 1)).stämmer).toBe(false);
  });
});
