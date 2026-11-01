// Poleringens regel för VEVOR:s modellnummer, som importen och
// specifikationsverktyget också använder. Koderna är påhittade.

import { describe, expect, it } from "vitest";
import { MODELLNR, radHarModellnummer } from "./modellnummer";
import { MODELLNR as viaSkrivplan } from "./skrivplan";

describe("radHarModellnummer", () => {
  it("☠️ skrivplanen och grinden har samma regel som importen", () => {
    // Testet mot Python-originalet ligger i skrivplan.test.ts.
    expect(viaSkrivplan).toBe(MODELLNR);
  });

  it("fäller raderna som stod kvar på 21 sidor 2026-11-01", () => {
    for (const [etikett, varde] of [
      ["Modell", "TEST999A-9 Hydraulisk styrsats"],
      ["Modell", "TEST-25 Manuell"],
      ["Artikelmodell Artikelmodellnummer", "TE-ST-004"],
      ["Modell", "9999S V-huvud"],
      ["Modell", "999ZZ+ Numeriskt styrd skärare"],
      ["Modell", "850 mm: Modell"],
      ["Nettovikt", "11,45 kg Artikelmodellnummer"],
    ]) {
      expect(radHarModellnummer(etikett, varde), `${etikett}: ${varde}`).toBe(true);
    }
  });

  it("en etikett med kolon sist läses utan det", () => {
    expect(radHarModellnummer("Modell:", "TEST-2")).toBe(true);
    expect(radHarModellnummer(" Modellnummer. ", "x")).toBe(true);
  });

  it("släpper vårt FP-nummer, en modell med ord och raderna om vad varan passar till", () => {
    for (const [etikett, varde] of [
      ["Artikelnummer", "FP-test-1"],
      ["Modell", "Premium"],
      ["Modell", "Basmodell 2"],
      ["Kompatibel bilmodell", "Testbil 2015-2020"],
      ["Fordonsmodell", "Testbil 2018"],
      ["Nettovikt", "11,45 kg"],
    ]) {
      expect(radHarModellnummer(etikett, varde), `${etikett}: ${varde}`).toBe(false);
    }
  });
});
