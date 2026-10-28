import { describe, expect, it } from "vitest";
import {
  iSynkfonster,
  nastaFonsterSlut,
  nastaFonsterStart,
  sekunderTillSkrivning,
} from "./synkfonster";

const utc = (s: string) => new Date(`${s}Z`);

describe("iSynkfonster", () => {
  it("fönstret är :12:00 till och med :29:59 var tredje timme (00, 03 … 21 UTC)", () => {
    expect(iSynkfonster(utc("2026-10-28T03:11:59"))).toBe(false);
    expect(iSynkfonster(utc("2026-10-28T03:12:00"))).toBe(true);
    expect(iSynkfonster(utc("2026-10-28T03:20:00"))).toBe(true);
    expect(iSynkfonster(utc("2026-10-28T03:29:59"))).toBe(true);
    expect(iSynkfonster(utc("2026-10-28T03:30:00"))).toBe(false);
  });

  it("alla åtta synktimmar, och bara de", () => {
    for (const h of [0, 3, 6, 9, 12, 15, 18, 21]) {
      const hh = String(h).padStart(2, "0");
      expect(iSynkfonster(utc(`2026-10-28T${hh}:20:00`)), `${hh}:20`).toBe(true);
    }
    for (const h of [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23]) {
      const hh = String(h).padStart(2, "0");
      expect(iSynkfonster(utc(`2026-10-28T${hh}:20:00`)), `${hh}:20`).toBe(false);
    }
  });
});

describe("nastaFonsterStart och nastaFonsterSlut", () => {
  it("nästa start räknas från nu och hoppar inte över ett fönster som pågår", () => {
    expect(nastaFonsterStart(utc("2026-10-28T02:00:00")).toISOString()).toBe("2026-10-28T03:12:00.000Z");
    expect(nastaFonsterStart(utc("2026-10-28T03:11:00")).toISOString()).toBe("2026-10-28T03:12:00.000Z");
    // Inne i fönstret är nästa START nästa fönster, inte det som pågår.
    expect(nastaFonsterStart(utc("2026-10-28T03:15:00")).toISOString()).toBe("2026-10-28T06:12:00.000Z");
  });

  it("efter dagens sista fönster är nästa nästa dygns 00:12 (även över en månadsgräns)", () => {
    expect(nastaFonsterStart(utc("2026-10-28T21:30:00")).toISOString()).toBe("2026-10-29T00:12:00.000Z");
    expect(nastaFonsterStart(utc("2026-10-31T22:00:00")).toISOString()).toBe("2026-11-01T00:12:00.000Z");
  });

  it("slutet: det pågående fönstrets, annars det kommandes", () => {
    expect(nastaFonsterSlut(utc("2026-10-28T03:15:00")).toISOString()).toBe("2026-10-28T03:30:00.000Z");
    expect(nastaFonsterSlut(utc("2026-10-28T02:50:00")).toISOString()).toBe("2026-10-28T03:30:00.000Z");
    expect(nastaFonsterSlut(utc("2026-10-28T21:45:00")).toISOString()).toBe("2026-10-29T00:30:00.000Z");
  });
});

describe("sekunderTillSkrivning", () => {
  it("☠️ inne i fönstret finns inget att skriva i", () => {
    expect(sekunderTillSkrivning(utc("2026-10-28T03:12:00"), 30)).toBe(0);
    expect(sekunderTillSkrivning(utc("2026-10-28T03:29:59"), 0)).toBe(0);
  });

  it("☠️ så nära att marginalen inte ryms är det samma sak som inne i fönstret", () => {
    // 20 s till fönstret, marginal 30 s.
    expect(sekunderTillSkrivning(utc("2026-10-28T03:11:40"), 30)).toBe(0);
    expect(sekunderTillSkrivning(utc("2026-10-28T03:11:30"), 30)).toBe(0);
    expect(sekunderTillSkrivning(utc("2026-10-28T03:11:29"), 30)).toBe(1);
  });

  it("räknar fram till nästa fönsters start minus marginalen", () => {
    // 03:08:00 → 240 s till 03:12:00, minus 30 s.
    expect(sekunderTillSkrivning(utc("2026-10-28T03:08:00"), 30)).toBe(210);
    // 02:00 → 1 h 12 min = 4 320 s.
    expect(sekunderTillSkrivning(utc("2026-10-28T02:00:00"), 0)).toBe(4320);
    // Efter ett fönster är det nästa, tre timmar senare (06:12 − 03:30 = 2 h 42 min).
    expect(sekunderTillSkrivning(utc("2026-10-28T03:30:00"), 0)).toBe(9720);
  });
});
