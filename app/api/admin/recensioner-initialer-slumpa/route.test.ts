// Admin-rutten för bytta bokstäver: auth, torrt som default, att skarpt kräver
// rätt bekräftelse, och att kundomdömen lämnas orörda.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";

const varld = vi.hoisted(() => ({ rader: [] as StoredReview[], skrivna: [] as StoredReview[] }));

vi.mock("@/lib/store/reviews", () => ({
  getReviewStore: () => ({
    listAll: async () => structuredClone(varld.rader),
    upsert: async (r: StoredReview) => {
      varld.skrivna.push(structuredClone(r));
      varld.rader = varld.rader.map((x) => (x.reviewIdAE === r.reviewIdAE ? structuredClone(r) : x));
    },
    listByProduct: async (p: string) => structuredClone(varld.rader.filter((r) => r.productId === p)),
  }),
}));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

import { POST } from "./route";

function begaran(query = "", auth = "Bearer hemligt"): NextRequest {
  return new NextRequest(`https://motor.test/api/admin/recensioner-initialer-slumpa${query}`, {
    method: "POST",
    headers: auth ? { authorization: auth } : {},
  });
}

function rad(p: Partial<StoredReview>): StoredReview {
  return {
    productId: "prod-1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Bra produkt",
    initials: "Z.K.",
    hasImage: false,
    status: "approved",
    customerNameRaw: "Hemligt Namn",
    ...p,
  };
}

beforeEach(() => {
  process.env.CRON_SECRET = "hemligt";
  varld.rader = [
    rad({ reviewIdAE: "a" }),
    rad({ reviewIdAE: "b", initials: "S.K." }),
    rad({ reviewIdAE: "c", initials: "W.Y.", status: "pending" }),
    rad({ reviewIdAE: "d", initials: "X.A.", source: "customer" }),
  ];
  varld.skrivna = [];
});

describe("recensioner-initialer-slumpa", () => {
  it("fel nyckel ger 401", async () => {
    expect((await POST(begaran("", "Bearer fel"))).status).toBe(401);
  });

  it("torrt som default: räknar, visar exempel och skriver ingenting", async () => {
    const json = await (await POST(begaran())).json();
    expect(json).toMatchObject({ ok: true, skarp: false, totalt: 2, kundomdomenHoppade: 1, skrivet: null });
    expect(json.exempel).toHaveLength(2);
    expect(varld.skrivna).toHaveLength(0);
  });

  it("skarpt utan rätt bekräftelse skriver ingenting", async () => {
    for (const q of ["?skarp=ja", "?skarp=ja&bekrafta=1", "?skarp=ja&bekrafta=3"]) {
      const json = await (await POST(begaran(q))).json();
      expect(json.stopp).toMatch(/bekrafta måste vara 2/);
    }
    expect(varld.skrivna).toHaveLength(0);
  });

  it("skarpt med rätt bekräftelse byter bokstäverna men inte kundomdömet", async () => {
    const json = await (await POST(begaran("?skarp=ja&bekrafta=2"))).json();
    expect(json.skrivet).toEqual({ andrade: 2, fel: 0, kvar: 0 });
    expect(varld.rader.find((r) => r.reviewIdAE === "a")!.initials).toMatch(/^[A-V]\.K\.$/);
    expect(varld.rader.find((r) => r.reviewIdAE === "c")).toMatchObject({ status: "pending", textSwedish: "Bra produkt" });
    expect(varld.rader.find((r) => r.reviewIdAE === "d")!.initials).toBe("X.A.");
    expect(varld.rader.find((r) => r.reviewIdAE === "b")!.initials).toBe("S.K.");
  });

  it("kundomdomen=ja tar med kundomdömet", async () => {
    const json = await (await POST(begaran("?kundomdomen=ja"))).json();
    expect(json.totalt).toBe(3);
  });

  it("svaret bär inga råa namn", async () => {
    expect(JSON.stringify(await (await POST(begaran())).json())).not.toContain("Hemligt Namn");
  });
});
