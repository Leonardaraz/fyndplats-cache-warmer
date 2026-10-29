// Admin-rutten för ändrade initialer: auth, torrt som default, att skarpt
// skriver bara när planen tillåter det, och att statusen och texten följer med.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";

const varld = vi.hoisted(() => ({
  rader: [] as StoredReview[],
  skrivna: [] as StoredReview[],
  tappaSkrivning: false,
}));

vi.mock("@/lib/store/reviews", () => ({
  getReviewStore: () => ({
    listAll: async () => structuredClone(varld.rader),
    upsert: async (r: StoredReview) => {
      varld.skrivna.push(structuredClone(r));
      if (varld.tappaSkrivning) return;
      varld.rader = varld.rader.map((x) => (x.reviewIdAE === r.reviewIdAE ? structuredClone(r) : x));
    },
    listByProduct: async (p: string) => structuredClone(varld.rader.filter((r) => r.productId === p)),
  }),
}));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

import { POST } from "./route";

function begaran(body: object, skarp = false, auth = "Bearer hemligt"): NextRequest {
  const url = `https://motor.test/api/admin/recension-initialer${skarp ? "?skarp=ja" : ""}`;
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

function rad(p: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "prod-1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Toppenprodukter, prisvärda och snabb leverans.",
    initials: "Q.R.",
    date: "2025-11-12T10:00:00.000Z",
    hasImage: false,
    status: "approved",
    customerNameRaw: "Hemligt Namn",
    ...p,
  };
}
const SOK = { text: "Toppenprodukter, prisvärda", initialer: "Q.R.", nya: "s.k" };

beforeEach(() => {
  process.env.CRON_SECRET = "hemligt";
  varld.rader = [rad()];
  varld.skrivna = [];
  varld.tappaSkrivning = false;
});

describe("recension-initialer", () => {
  it("fel nyckel ger 401", async () => {
    expect((await POST(begaran(SOK, false, "Bearer fel"))).status).toBe(401);
  });

  it("torrt som default: visar träffen men skriver ingenting", async () => {
    const json = await (await POST(begaran(SOK))).json();
    expect(json).toMatchObject({ ok: true, skarp: false, stopp: null, nya: "S.K.", andrade: [] });
    expect(json.traffar).toHaveLength(1);
    expect(varld.skrivna).toHaveLength(0);
  });

  it("skarpt byter initialerna och behåller status, text och råa namn", async () => {
    const json = await (await POST(begaran(SOK, true))).json();
    expect(json).toMatchObject({ andrade: ["prod-1/r1"], fel: [] });
    expect(varld.skrivna[0]).toMatchObject({
      initials: "S.K.",
      status: "approved",
      textSwedish: "Toppenprodukter, prisvärda och snabb leverans.",
      customerNameRaw: "Hemligt Namn",
    });
  });

  it("skarpt med två träffar skriver ingenting", async () => {
    varld.rader = [rad(), rad({ reviewIdAE: "r2" })];
    const json = await (await POST(begaran(SOK, true))).json();
    expect(json.stopp).toMatch(/2 träffar, max 1/);
    expect(varld.skrivna).toHaveLength(0);
  });

  it("ogiltiga nya initialer skriver ingenting", async () => {
    const json = await (await POST(begaran({ ...SOK, nya: "123" }, true))).json();
    expect(json.stopp).toMatch(/en eller två bokstäver/);
    expect(varld.skrivna).toHaveLength(0);
  });

  it("en skrivning som inte sitter räknas som fel, inte som ändrad", async () => {
    varld.tappaSkrivning = true;
    const json = await (await POST(begaran(SOK, true))).json();
    expect(json).toMatchObject({ andrade: [], fel: ["prod-1/r1"] });
  });

  it("svaret bär varken råa namn eller land", async () => {
    const text = JSON.stringify(await (await POST(begaran(SOK))).json());
    expect(text).not.toContain("Hemligt Namn");
  });
});
