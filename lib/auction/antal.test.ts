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

describe("Black Week 2026 (Leonards datum 2026-11-04)", () => {
  // 07:00 svensk vintertid = 06:00 UTC.
  const start = (dag: string) => `${dag}T06:00:00.000Z`;

  it("☠️ varje dag låst: 50 den 23–29 november, 100 fredag 27, tio före och efter", () => {
    const vantat: Record<string, number> = {
      "2026-11-21": 10,
      "2026-11-22": 10,
      "2026-11-23": 50,
      "2026-11-24": 50,
      "2026-11-25": 50,
      "2026-11-26": 50,
      "2026-11-27": 100,
      "2026-11-28": 50,
      "2026-11-29": 50,
      "2026-11-30": 10,
      "2026-12-01": 10,
    };
    for (const [dag, n] of Object.entries(vantat)) expect(auktionerFor(start(dag)), dag).toBe(n);
  });

  it("fredagen 27 november är en fredag, och de andra dagarna är måndag till söndag", () => {
    const veckodag = (dag: string) => new Date(start(dag)).getUTCDay();
    expect(veckodag("2026-11-27")).toBe(5);
    expect(veckodag("2026-11-23")).toBe(1);
    expect(veckodag("2026-11-29")).toBe(0);
  });

  it("☠️ övergången 22 → 23: söndag kl 08 och kl 19 gäller måndagens 50", () => {
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-22T07:00:30Z")))).toBe(50);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-22T18:00:30Z")))).toBe(50);
    // Söndag 07:00 exakt är söndagens egen start: tio.
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-22T06:00:00Z")))).toBe(10);
  });

  it("☠️ övergången 26 → 27 → 28: torsdagen fyller till 100, fredagen till 50", () => {
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-26T07:00:30Z")))).toBe(100);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-26T18:00:30Z")))).toBe(100);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-27T07:00:30Z")))).toBe(50);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-27T18:00:30Z")))).toBe(50);
  });

  it("☠️ övergången 29 → 30: söndagens kväll fyller bara till tio", () => {
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-29T18:00:30Z")))).toBe(10);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-30T07:00:30Z")))).toBe(10);
  });

  it("läsgränsen och kön räcker för fredagen", () => {
    expect(MAX_ANTAL).toBe(100);
  });
});

describe("generalrepetitionen 18 november (Leonards ja 2026-11-14)", () => {
  // 07:00 svensk vintertid = 06:00 UTC.
  const start = (dag: string) => `${dag}T06:00:00.000Z`;

  it("☠️ 50 onsdag 18 november, tio dagarna runt om", () => {
    const vantat: Record<string, number> = {
      "2026-11-16": 10,
      "2026-11-17": 10,
      "2026-11-18": 50,
      "2026-11-19": 10,
      "2026-11-20": 10,
    };
    for (const [dag, n] of Object.entries(vantat)) expect(auktionerFor(start(dag)), dag).toBe(n);
  });

  it("18 november är en onsdag, alltså en vanlig vardag före Black Week", () => {
    expect(new Date(start("2026-11-18")).getUTCDay()).toBe(3);
  });

  it("☠️ övergången 17 → 18: tisdag kl 08 och kl 19 gäller onsdagens 50", () => {
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-17T07:00:30Z")))).toBe(50);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-17T18:00:30Z")))).toBe(50);
    // Tisdag 07:00 exakt är tisdagens egen start: tio.
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-17T06:00:00Z")))).toBe(10);
  });

  it("☠️ övergången 18 → 19: onsdagens kväll fyller bara till tio", () => {
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-18T07:00:30Z")))).toBe(10);
    expect(auktionerFor(nextStartAt(Date.parse("2026-11-18T18:00:30Z")))).toBe(10);
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
