import { describe, expect, it } from "vitest";
import { OFFERT_GILTIG_DAGAR, offertGiltigTill, oreAvKronor, provaOffertpriser } from "./offertpriser";

const RADER = [
  { namn: "Pallställ", antal: 12, aOre: 249_000, golvOre: 180_000 },
  { namn: "Presentkort", antal: 1, aOre: 50_000, golvOre: null },
];

describe("offertens priser i admin (E3-10)", () => {
  it("kronor skrivs som admin skriver dem", () => {
    expect(oreAvKronor("2 290")).toBe(229_000);
    expect(oreAvKronor("2290,50")).toBe(229_050);
    expect(oreAvKronor("2290.5")).toBe(229_050);
    expect(oreAvKronor("2 290 kr")).toBe(229_000);
    expect(oreAvKronor("")).toBeNull();
    expect(oreAvKronor("-5")).toBeNull();
    expect(oreAvKronor("12,345")).toBeNull();
  });

  it("ett pris mellan golvet och listpriset godtas; en vara utan golv får bara listpriset", () => {
    expect(provaOffertpriser({ pris_0: "2 290", pris_1: "500" }, RADER)).toEqual({ ok: true, priser: [229_000, 50_000] });
    expect(provaOffertpriser({ pris_0: "1800", pris_1: "500" }, RADER)).toEqual({ ok: true, priser: [180_000, 50_000] });
  });

  it("P6: aldrig under golvet, aldrig över listpriset, och aldrig rabatt utan känd kostnad", () => {
    expect(provaOffertpriser({ pris_0: "1799,99", pris_1: "500" }, RADER)).toEqual({ ok: false, fel: "Pallställ: offertpriset är under golvet." });
    expect(provaOffertpriser({ pris_0: "2490,01", pris_1: "500" }, RADER)).toEqual({ ok: false, fel: "Pallställ: offertpriset är högre än listpriset." });
    expect(provaOffertpriser({ pris_0: "2290", pris_1: "450" }, RADER)).toEqual({ ok: false, fel: "Presentkort saknar känd kostnad och kan bara få listpriset." });
    expect(provaOffertpriser({ pris_0: "", pris_1: "500" }, RADER)).toEqual({ ok: false, fel: "Skriv ett pris i kronor för Pallställ." });
  });

  it("offerten gäller i 14 dygn", () => {
    const nu = Date.parse("2026-11-04T19:00:00.000Z");
    expect(Date.parse(offertGiltigTill(nu)) - nu).toBe(OFFERT_GILTIG_DAGAR * 86_400_000);
  });
});
