import { describe, expect, it } from "vitest";
import { attFramja, auktionerFor, DAGAR, ledigaSlots, MAX_ANTAL, STANDARD_ANTAL, svenskDag } from "./antal";
import { nextStartAt } from "./engine";

describe("antalet fynd per dag", () => {
  it("tio om dagen (Leonard 2026-11-04)", () => {
    expect(STANDARD_ANTAL).toBe(10);
    expect(auktionerFor("2026-11-05T06:00:00.000Z")).toBe(10);
  });

  it("läsgränsen räcker för den största dagen", () => {
    expect(MAX_ANTAL).toBeGreaterThanOrEqual(Math.max(STANDARD_ANTAL, ...Object.values(DAGAR)));
  });

  it("dagen räknas på svensk väggklocka, också över sommartidens slut", () => {
    expect(svenskDag("2026-11-05T06:00:00.000Z")).toBe("2026-11-05");
    // 07:00 svensk sommartid är 05:00 UTC.
    expect(svenskDag("2026-10-20T05:00:00.000Z")).toBe("2026-10-20");
    // Strax före midnatt UTC är det redan nästa dag i Sverige.
    expect(svenskDag("2026-11-04T23:30:00.000Z")).toBe("2026-11-05");
  });

  it("nästa start kl 19 är nästa morgon, och den dagens antal gäller", () => {
    const kl19 = Date.parse("2026-11-04T18:00:00.000Z");
    const start = nextStartAt(kl19);
    expect(svenskDag(start)).toBe("2026-11-05");
    expect(auktionerFor(start)).toBe(10);
  });
});

describe("attFramja", () => {
  it("fyller upp till nästa dags antal", () => {
    expect(attFramja(5, 10)).toBe(5);
    expect(attFramja(0, 10)).toBe(10);
  });

  it("en dag med fler: resten schemaläggs redan under dagen", () => {
    // Tio startade i dag, femtio i morgon: fyrtio schemaläggs nu.
    expect(attFramja(10, 50)).toBe(40);
  });

  it("en dag med färre: ingenting främjas förrän dagens tagit slut", () => {
    expect(attFramja(100, 50)).toBe(0);
    // Kl 19 är dagens hundra avslutade: femtio främjas.
    expect(attFramja(0, 50)).toBe(50);
  });
});

describe("ledigaSlots", () => {
  it("de lägsta lediga, luckor först", () => {
    expect(ledigaSlots(new Set([1, 2, 4]), 3)).toEqual([3, 5, 6]);
  });

  it("noll lediga ger en tom lista", () => {
    expect(ledigaSlots(new Set([1, 2]), 0)).toEqual([]);
  });

  it("aldrig ett upptaget nummer, också långt över fem", () => {
    const upptagna = new Set(Array.from({ length: 60 }, (_, i) => i + 1));
    expect(ledigaSlots(upptagna, 2)).toEqual([61, 62]);
  });
});
