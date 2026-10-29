import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import { normaliseraInitialer, planeraAndraInitialer } from "./andra-initialer";

function rad(p: Partial<StoredReview>): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Toppenprodukter, prisvärda och snabb leverans. Rekommenderar dem verkligen till alla",
    initials: "Q.R.",
    date: "2025-11-12T10:00:00.000Z",
    hasImage: false,
    status: "approved",
    ...p,
  };
}
const S = { text: "Toppenprodukter, prisvärda" };

describe("normaliseraInitialer", () => {
  it("rättar till butikens form", () => {
    expect(normaliseraInitialer("s.k.")).toBe("S.K.");
    expect(normaliseraInitialer("s k")).toBe("S.K.");
    expect(normaliseraInitialer("sk")).toBe("S.K.");
    expect(normaliseraInitialer(" å.ö ")).toBe("Å.Ö.");
    expect(normaliseraInitialer("m")).toBe("M.");
  });
  it("avvisar tomt, siffror och fler än två bokstäver", () => {
    expect(normaliseraInitialer("")).toBeNull();
    expect(normaliseraInitialer("12")).toBeNull();
    expect(normaliseraInitialer("A.B.C.")).toBeNull();
    expect(normaliseraInitialer("Verifierad köpare")).toBeNull();
  });
});

describe("planeraAndraInitialer", () => {
  it("en träff får ändras och får de normaliserade initialerna", () => {
    const p = planeraAndraInitialer([rad({})], S, "s.k");
    expect(p.stopp).toBeNull();
    expect(p.nya).toBe("S.K.");
    expect(p.attAndra).toHaveLength(1);
  });
  it("hittar på nuvarande initialer, så en annan rad med samma text lämnas", () => {
    const rader = [rad({}), rad({ reviewIdAE: "r2", initials: "A.B." })];
    const p = planeraAndraInitialer(rader, { ...S, initialer: "A.B." }, "C.D.");
    expect(p.attAndra.map((r) => r.reviewIdAE)).toEqual(["r2"]);
  });
  it("fler träffar än max stoppar", () => {
    const rader = [rad({}), rad({ reviewIdAE: "r2" })];
    expect(planeraAndraInitialer(rader, S, "S.K.").stopp).toMatch(/2 träffar, max 1/);
    expect(planeraAndraInitialer(rader, S, "S.K.", 2).stopp).toBeNull();
  });
  it("ingen träff, redan de initialerna och ogiltiga initialer stoppar", () => {
    expect(planeraAndraInitialer([rad({})], { text: "något helt annat" }, "S.K.").stopp).toBe("ingen träff");
    expect(planeraAndraInitialer([rad({ initials: "S.K." })], S, "s.k").stopp).toBe("har redan de initialerna");
    expect(planeraAndraInitialer([rad({})], S, "123").stopp).toMatch(/en eller två bokstäver/);
  });
  it("en för kort text stoppar", () => {
    expect(planeraAndraInitialer([rad({})], { text: "kort" }, "S.K.").stopp).toMatch(/minst 10 tecken/);
  });
  it("hittar även rader som är dolda eller väntande, och ändrar dem utan att röra statusen", () => {
    const p = planeraAndraInitialer([rad({ status: "pending" })], S, "S.K.");
    expect(p.attAndra).toHaveLength(1);
  });
});
