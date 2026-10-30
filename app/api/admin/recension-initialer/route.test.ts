// Admin-rutten för ändrade initialer: auth, torrt som default, att skarpt
// skriver bara när planen tillåter det, att statusen och texten följer med, och att
// en skarp körning säger till butiken (som cachar recensionerna i sex timmar).

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";

const varld = vi.hoisted(() => ({
  rader: [] as StoredReview[],
  skrivna: [] as StoredReview[],
  tappaSkrivning: false,
  butik: [] as { produkter: { id: string; vad?: string }[]; orsak: string }[],
  butikensUtfall: "uppdaterad" as "uppdaterad" | "misslyckades" | "ingen_nyckel",
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
vi.mock("@/lib/headless/produktsidor", () => ({
  uppdateraProduktsidor: async (produkter: { id: string; vad?: string }[], orsak: string) => {
    varld.butik.push({ produkter, orsak });
    return { utfall: varld.butikensUtfall };
  },
}));

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
  varld.butik = [];
  varld.butikensUtfall = "uppdaterad";
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

  it("skarpt säger till butiken om produktens recensioner", async () => {
    const json = await (await POST(begaran(SOK, true))).json();
    expect(varld.butik).toEqual([
      { produkter: [{ id: "prod-1", vad: "recensioner" }], orsak: "recension-initialer" },
    ]);
    expect(json.butiken).toEqual({ produkter: 1, anrop: 1, uppdaterade: 1, misslyckade: 0, utanNyckel: false, hoppade: 0 });
  });

  it("torrt och stopp ringer inte butiken", async () => {
    expect((await (await POST(begaran(SOK))).json()).butiken).toBeNull();
    varld.rader = [rad(), rad({ reviewIdAE: "r2" })];
    await POST(begaran(SOK, true));
    await POST(begaran({ ...SOK, nya: "123" }, true));
    expect(varld.butik).toHaveLength(0);
  });

  it("en skrivning som inte sitter räknas som fel, men butiken sägs ändå till", async () => {
    varld.tappaSkrivning = true;
    const json = await (await POST(begaran(SOK, true))).json();
    expect(json.fel).toEqual(["prod-1/r1"]);
    expect(varld.butik).toHaveLength(1);
  });

  it("en butik som inte svarar syns i svaret men fäller inte körningen", async () => {
    varld.butikensUtfall = "ingen_nyckel";
    const json = await (await POST(begaran(SOK, true))).json();
    expect(json).toMatchObject({ ok: true, andrade: ["prod-1/r1"], fel: [] });
    expect(json.butiken).toMatchObject({ utanNyckel: true, hoppade: 1, uppdaterade: 0 });
  });

  it("svaret bär varken råa namn eller land", async () => {
    const text = JSON.stringify(await (await POST(begaran(SOK))).json());
    expect(text).not.toContain("Hemligt Namn");
  });
});
