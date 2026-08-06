import { describe, expect, it } from "vitest";
import { assessDsPrice, normalizeAeOrderId, PRICE_GUARD_MIN_USD, PRICE_GUARD_PCT } from "./price-check";

// Prisvakten föddes ur garderobs-incidenten 2026-08-06 ($84.40 via API när
// konsumentkassan låg på ~$71) — trösklarna nedan är designvärden, inte magi.
describe("assessDsPrice", () => {
  it("ok när DS-priset är oförändrat eller billigare", () => {
    expect(assessDsPrice(80, 80).verdict).toBe("ok");
    expect(assessDsPrice(80, 71).verdict).toBe("ok");
  });

  it("expensive kräver BÅDE >10 % OCH >$2 (små diffar bråkar vi inte om)", () => {
    // 15 % och $12 dyrare → stopp.
    const a = assessDsPrice(80, 92);
    expect(a.verdict).toBe("expensive");
    expect(a.diffPct).toBe(15);
    // 20 % men bara $1.60 dyrare (billig pryl) → ok.
    expect(assessDsPrice(8, 9.6).verdict).toBe("ok");
    // $3 dyrare men bara 3 % (dyr pryl) → ok.
    expect(assessDsPrice(100, 103).verdict).toBe("ok");
  });

  it("exakt på tröskeln stoppar inte (> krävs, inte >=)", () => {
    expect(assessDsPrice(100, 100 + PRICE_GUARD_PCT).verdict).toBe("ok");
    expect(assessDsPrice(10, 10 + PRICE_GUARD_MIN_USD).verdict).toBe("ok");
  });

  it("unknown när baslinje eller dagspris saknas/är ogiltigt — vakten är fail-open", () => {
    expect(assessDsPrice(undefined, 80).verdict).toBe("unknown");
    expect(assessDsPrice(80, undefined).verdict).toBe("unknown");
    expect(assessDsPrice(0, 80).verdict).toBe("unknown");
    expect(assessDsPrice(80, Number.NaN).verdict).toBe("unknown");
  });
});

describe("normalizeAeOrderId", () => {
  it("accepterar riktiga ordernummer, även med kopierings-mellanslag", () => {
    expect(normalizeAeOrderId("3075422919233058")).toBe("3075422919233058");
    expect(normalizeAeOrderId(" 3075 4229 1923 3058 ")).toBe("3075422919233058");
  });

  it("vägrar allt som inte ser ut som ett ordernummer", () => {
    expect(normalizeAeOrderId("")).toBeNull();
    expect(normalizeAeOrderId("abc123")).toBeNull();
    expect(normalizeAeOrderId("1234567")).toBeNull(); // för kort
    expect(normalizeAeOrderId("1".repeat(25))).toBeNull(); // för långt
    expect(normalizeAeOrderId("https://aliexpress.com/order/123")).toBeNull();
  });
});
