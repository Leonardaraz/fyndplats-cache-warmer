// Admin-rutten för kundomdömenas initialer: auth, torrt som default, att ett
// trunkerat lager aldrig skrivs, och att svaret inte bär några namn.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";

const varld = vi.hoisted(() => ({
  rader: [] as StoredReview[],
  skrivna: [] as StoredReview[],
}));

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
vi.mock("@/lib/wix/orders", () => ({ fetchOrderKundnamn: async () => "Sol Svensson" }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

import { POST } from "./route";

function begaran(skarp = false, auth = "Bearer hemligt"): NextRequest {
  const url = `https://motor.test/api/admin/kundomdome-initialer${skarp ? "?skarp=ja" : ""}`;
  return new NextRequest(url, { method: "POST", headers: auth ? { authorization: auth } : {} });
}

function kundomdome(): StoredReview & { orderId: string } {
  return {
    productId: "prod-1",
    reviewIdAE: "kund-order-1-prod-1",
    rating: 5,
    textOriginal: "Snabb leverans.",
    textSwedish: "Snabb leverans.",
    initials: "Verifierad köpare",
    hasImage: false,
    status: "approved",
    source: "customer",
    orderId: "order-1",
  };
}

beforeEach(() => {
  process.env.CRON_SECRET = "hemligt";
  varld.rader = [kundomdome()];
  varld.skrivna = [];
});

describe("kundomdome-initialer", () => {
  it("fel nyckel ger 401", async () => {
    const res = await POST(begaran(false, "Bearer fel"));
    expect(res.status).toBe(401);
  });

  it("torrt som default: räknar men skriver ingenting", async () => {
    const res = await POST(begaran());
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, skarp: false, attRatta: 1, kanRattas: 1, rattade: 0 });
    expect(varld.skrivna).toHaveLength(0);
  });

  it("skarpt skriver initialerna och behåller statusen", async () => {
    const res = await POST(begaran(true));
    expect(await res.json()).toMatchObject({ rattade: 1, fel: 0, produkter: ["prod-1"] });
    expect(varld.skrivna[0]).toMatchObject({ initials: "S.S.", status: "approved" });
  });

  it("☠️ svaret bär inga namn och inga initialer", async () => {
    const res = await POST(begaran(true));
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("Sol");
    expect(text).not.toContain("Svensson");
    expect(text).not.toContain("S.S.");
  });
});
