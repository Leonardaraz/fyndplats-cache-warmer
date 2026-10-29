// Rutten som döljer EN recension. Planeringen testas i lib/reviews/dolj-enskild.test.ts;
// här: att en skarp körning säger till butiken att förnya produktens sida (butikens
// egen recensionsbevakning svarade inte 2026-10-29, och den dolda recensionen låg kvar
// på sidan i sex timmar), och att en torrkörning eller ett stopp aldrig gör det.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";

let auktoriserad = true;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

let rader: StoredReview[] = [];
const dolda: string[] = [];
vi.mock("@/lib/store/reviews", async (original) => ({
  ...(await original<typeof import("@/lib/store/reviews")>()),
  getReviewStore: () => ({
    listAll: async () => rader,
    setStatus: async (productId: string, reviewIdAE: string, status: string) => {
      dolda.push(`${productId}/${reviewIdAE}/${status}`);
    },
  }),
}));

const butiksanrop: unknown[] = [];
vi.mock("@/lib/headless/produktsidor", () => ({
  uppdateraProduktsidor: async (produkter: unknown, orsak: string) => {
    butiksanrop.push({ produkter, orsak });
    return { utfall: "uppdaterad", status: 200, produkter: 1 };
  },
}));

import { POST } from "./route";

const P = "11111111-1111-4111-8111-111111111111";

function rad(p: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: P,
    reviewIdAE: "gen-test01",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Mycket fin, ger en skön värme och vänner och bekanta har beundrat den mycket",
    initials: "A.B.",
    date: "2025-01-02",
    hasImage: false,
    status: "edited",
    ...p,
  };
}

function anrop(body: unknown, q = "") {
  return POST(
    new NextRequest(`https://x.test/api/admin/recension-dolj${q}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );
}

const SOK = { text: "Mycket fin, ger en skön värme", initialer: "A.B.", datum: "2025-01-02", produkt: P };

beforeEach(() => {
  auktoriserad = true;
  rader = [rad()];
  dolda.length = 0;
  butiksanrop.length = 0;
});

describe("POST /api/admin/recension-dolj", () => {
  it("utan behörighet: 401", async () => {
    auktoriserad = false;
    expect((await anrop(SOK, "?skarp=ja")).status).toBe(401);
    expect(dolda).toHaveLength(0);
  });

  it("torrkörning döljer inget och ropar inte på butiken", async () => {
    const json = await (await anrop(SOK)).json();
    expect(json.traffar).toHaveLength(1);
    expect(dolda).toHaveLength(0);
    expect(butiksanrop).toHaveLength(0);
    expect(json.butiken).toBeUndefined();
  });

  it("skarp körning döljer recensionen och säger till butiken att förnya produktens sida (vad = recensioner)", async () => {
    const json = await (await anrop(SOK, "?skarp=ja")).json();
    expect(dolda).toEqual([`${P}/gen-test01/rejected`]);
    expect(json.dolda).toEqual([`${P}/gen-test01`]);
    expect(butiksanrop).toEqual([{ produkter: [{ id: P, vad: "recensioner" }], orsak: "recension-dolj" }]);
    expect(json.butiken).toEqual({ utfall: "uppdaterad", status: 200, produkter: 1 });
  });

  it("☠️ ett stopp (två träffar, max 1) döljer ingenting och ropar inte på butiken", async () => {
    rader = [rad(), rad({ reviewIdAE: "gen-annan" })];
    const json = await (await anrop(SOK, "?skarp=ja")).json();
    expect(json.stopp).toMatch(/2 träffar/);
    expect(dolda).toHaveLength(0);
    expect(butiksanrop).toHaveLength(0);
  });

  it("en redan dold recension skrivs inte igen och butiken lämnas ifred", async () => {
    rader = [rad({ status: "rejected" })];
    const json = await (await anrop(SOK, "?skarp=ja")).json();
    expect(json.stopp).toBe("redan dold");
    expect(dolda).toHaveLength(0);
    expect(butiksanrop).toHaveLength(0);
  });
});
