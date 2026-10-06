import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import { arAliExpress, planeraAeKoRensning } from "./ae-ko-rensning";

function rad(o: Partial<StoredReview>): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great product",
    textSwedish: "Great product",
    initials: "A.B.",
    hasImage: false,
    status: "pending",
    ...o,
  };
}

describe("arAliExpress", () => {
  it("rad utan källa är AliExpress (alla rader före 2026-08-17)", () => {
    expect(arAliExpress({})).toBe(true);
    expect(arAliExpress({ source: "" })).toBe(true);
    expect(arAliExpress({ source: "aliexpress" })).toBe(true);
  });
  it("Aosom och butikens egna kunder är inte AliExpress", () => {
    expect(arAliExpress({ source: "aosom" })).toBe(false);
    expect(arAliExpress({ source: "customer" })).toBe(false);
  });
});

describe("planeraAeKoRensning", () => {
  it("tar bara väntande AliExpress-rader", () => {
    const plan = planeraAeKoRensning([
      rad({ reviewIdAE: "a" }),
      rad({ reviewIdAE: "b", source: "aliexpress", productId: "p2" }),
      rad({ reviewIdAE: "c", status: "approved" }),
      rad({ reviewIdAE: "d", status: "edited" }),
      rad({ reviewIdAE: "e", status: "rejected" }),
      rad({ reviewIdAE: "f", source: "aosom" }),
      rad({ reviewIdAE: "g", source: "customer" }),
    ]);
    expect(plan.attDolja.map((r) => r.reviewIdAE)).toEqual(["a", "b"]);
    expect(plan.produkter).toBe(2);
    expect(plan.granskade).toBe(7);
    expect(plan.vantande).toBe(4);
    expect(plan.vantandePerKalla).toEqual({ aliexpress: 2, aosom: 1, customer: 1 });
  });

  it("☠️ publicerade AliExpress-recensioner rörs aldrig", () => {
    const plan = planeraAeKoRensning([rad({ status: "approved" }), rad({ status: "edited", source: "aliexpress" })]);
    expect(plan.attDolja).toEqual([]);
  });

  it("räknar väntande rader som redan fått svensk text", () => {
    const plan = planeraAeKoRensning([
      rad({ reviewIdAE: "a" }),
      rad({ reviewIdAE: "b", textSwedish: "Bra produkt" }),
    ]);
    expect(plan.attDolja).toHaveLength(2);
    expect(plan.medSvenskText).toBe(1);
  });
});
