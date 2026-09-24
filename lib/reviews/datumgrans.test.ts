import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import {
  TIDIGASTE_RECENSIONSDATUM,
  arForeDatumgransen,
  datumdel,
  planeraDatumrensning,
} from "./datumgrans";

function rad(p: Partial<StoredReview>): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Text",
    textSwedish: "Text",
    initials: "A.B.",
    hasImage: false,
    status: "edited",
    ...p,
  };
}

describe("datumdel", () => {
  it("läser ISO-datum och datum med klockslag", () => {
    expect(datumdel("2020-12-31")).toBe("2020-12-31");
    expect(datumdel("2021-03-04T22:10:00.000Z")).toBe("2021-03-04");
  });
  it("läser andra format som Date.parse förstår", () => {
    expect(datumdel("March 5, 2019")).toBe("2019-03-05");
  });
  it("ger null för saknat eller oläsbart datum", () => {
    expect(datumdel(undefined)).toBeNull();
    expect(datumdel("")).toBeNull();
    expect(datumdel("inget datum")).toBeNull();
  });
});

describe("arForeDatumgransen", () => {
  it("gränsen är 2021-01-01", () => {
    expect(TIDIGASTE_RECENSIONSDATUM).toBe("2021-01-01");
  });
  it("sista dagen 2020 är före, första dagen 2021 är inte", () => {
    expect(arForeDatumgransen("2020-12-31")).toBe(true);
    expect(arForeDatumgransen("2021-01-01")).toBe(false);
    expect(arForeDatumgransen("2026-09-23")).toBe(false);
  });
  it("okänt datum behålls", () => {
    expect(arForeDatumgransen(undefined)).toBe(false);
    expect(arForeDatumgransen("inget datum")).toBe(false);
  });
  it("ett felskrivet årtal (0202) är före gränsen", () => {
    expect(arForeDatumgransen("0202-05-12")).toBe(true);
  });
  it("gränsen kan anges", () => {
    expect(arForeDatumgransen("2021-06-01", "2022-01-01")).toBe(true);
  });
});

describe("planeraDatumrensning", () => {
  it("döljer synliga och väntande rader före gränsen, rör inte redan dolda", () => {
    const plan = planeraDatumrensning([
      rad({ productId: "a", reviewIdAE: "1", date: "2019-05-01", status: "edited", source: "aosom" }),
      rad({ productId: "a", reviewIdAE: "2", date: "2020-12-31", status: "pending", source: "aosom" }),
      rad({ productId: "b", reviewIdAE: "3", date: "2018-01-01", status: "approved" }),
      rad({ productId: "b", reviewIdAE: "4", date: "2017-01-01", status: "rejected" }),
      rad({ productId: "c", reviewIdAE: "5", date: "2021-01-01", status: "edited" }),
      rad({ productId: "c", reviewIdAE: "6", status: "edited" }),
    ]);
    expect(plan.granskade).toBe(6);
    expect(plan.föreGränsen).toBe(4);
    expect(plan.redanDolda).toBe(1);
    expect(plan.utanDatum).toBe(1);
    expect(plan.attDölja).toEqual([
      { productId: "a", reviewIdAE: "1" },
      { productId: "a", reviewIdAE: "2" },
      { productId: "b", reviewIdAE: "3" },
    ]);
    expect(plan.produkter).toBe(2);
    expect(plan.perStatus).toEqual({ edited: 1, pending: 1, approved: 1 });
    expect(plan.perKälla).toEqual({ aosom: 2, okänd: 1 });
    expect(plan.perÅr).toEqual({ "2019": 1, "2020": 1, "2018": 1 });
  });

  it("samma rad två gånger döljs en gång", () => {
    const r = rad({ productId: "a", reviewIdAE: "1", date: "2019-05-01" });
    expect(planeraDatumrensning([r, r]).attDölja).toHaveLength(1);
  });

  it("rad utan status räknas som väntande", () => {
    const plan = planeraDatumrensning([
      rad({ date: "2019-05-01", status: undefined as unknown as StoredReview["status"] }),
    ]);
    expect(plan.perStatus).toEqual({ pending: 1 });
  });

  it("vägrar en ogiltig gräns", () => {
    expect(() => planeraDatumrensning([], "2021")).toThrow(/Ogiltig datumgräns/);
  });

  it("tom lista ger tom plan", () => {
    const plan = planeraDatumrensning([]);
    expect(plan.attDölja).toEqual([]);
    expect(plan.produkter).toBe(0);
  });
});
