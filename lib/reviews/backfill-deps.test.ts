import { describe, expect, it } from "vitest";
import { checkedRecently, REVIEW_RECHECK_DAYS } from "./backfill-deps";

const NOW = Date.parse("2026-08-16T12:00:00Z");
const days = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe("checkedRecently", () => {
  it("aldrig genomsökt → ska kollas", () => {
    expect(checkedRecently(undefined, NOW)).toBe(false);
    expect(checkedRecently("", NOW)).toBe(false);
  });

  it("nyss genomsökt → hoppas över", () => {
    expect(checkedRecently(days(0), NOW)).toBe(true);
    expect(checkedRecently(days(REVIEW_RECHECK_DAYS - 1), NOW)).toBe(true);
  });

  // Nya recensioner dyker upp hos AE över tid — noll omkontroll vore fel.
  it("äldre än intervallet → kollas igen", () => {
    expect(checkedRecently(days(REVIEW_RECHECK_DAYS + 1), NOW)).toBe(false);
    expect(checkedRecently(days(365), NOW)).toBe(false);
  });

  // Skräp i fältet får inte låsa ute produkten för alltid.
  it("oläsbar tidsstämpel behandlas som aldrig genomsökt", () => {
    expect(checkedRecently("i förrgår", NOW)).toBe(false);
  });
});
