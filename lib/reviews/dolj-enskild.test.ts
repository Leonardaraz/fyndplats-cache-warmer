import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import { hittaRecensioner, planeraDolj } from "./dolj-enskild";

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

describe("hittaRecensioner", () => {
  it("hittar på textbit, initialer och datum, oavsett skiftläge och mellanslag", () => {
    const r = [rad({}), rad({ reviewIdAE: "r2", initials: "A.B." }), rad({ reviewIdAE: "r3", date: "2025-11-13" })];
    const t = hittaRecensioner(r, { text: "toppenprodukter,  PRISVÄRDA", initialer: "q.r.", datum: "2025-11-12" });
    expect(t.map((x) => x.reviewIdAE)).toEqual(["r1"]);
  });
  it("läser även originaltexten", () => {
    expect(hittaRecensioner([rad({ textSwedish: "" , textOriginal: "Very good value for money" })], { text: "good value for" })).toHaveLength(1);
  });
  it("begränsar till produkten när den anges", () => {
    expect(hittaRecensioner([rad({ productId: "p2" })], { text: "Toppenprodukter", produkt: "p1" })).toHaveLength(0);
  });
});

describe("planeraDolj", () => {
  it("en träff får döljas", () => {
    const p = planeraDolj([rad({})], { text: "Toppenprodukter, prisvärda" });
    expect(p.stopp).toBeNull();
    expect(p.attDolja).toHaveLength(1);
  });
  it("fler träffar än max stoppar", () => {
    const p = planeraDolj([rad({}), rad({ productId: "p2" })], { text: "Toppenprodukter, prisvärda" });
    expect(p.stopp).toMatch(/2 träffar, max 1/);
    expect(planeraDolj([rad({}), rad({ productId: "p2" })], { text: "Toppenprodukter, prisvärda" }, 2).stopp).toBeNull();
  });
  it("en redan dold rad skrivs inte igen", () => {
    const p = planeraDolj([rad({ status: "rejected" })], { text: "Toppenprodukter, prisvärda" });
    expect(p.stopp).toBe("redan dold");
    expect(p.attDolja).toHaveLength(0);
  });
  it("för kort text stoppar, så ett tomt fält aldrig träffar allt", () => {
    expect(planeraDolj([rad({})], { text: "Topp" }).stopp).toMatch(/minst 10/);
    expect(planeraDolj([rad({})], { text: "          " }).stopp).toMatch(/minst 10/);
  });
  it("felaktigt datum stoppar", () => {
    expect(planeraDolj([rad({})], { text: "Toppenprodukter", datum: "12/11/2025" }).stopp).toMatch(/ÅÅÅÅ/);
  });
});
