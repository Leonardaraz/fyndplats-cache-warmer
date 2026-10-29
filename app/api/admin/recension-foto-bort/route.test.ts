// Rutten som tar bort enskilda foton från recensioner: behörighet, torrkörning mot
// skarp körning, att en lista med fel aldrig skrivs, och att butiken får veta det
// som skrevs. Själva planeringen testas i lib/reviews/foto-bort.test.ts.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { StoredReview } from "@/lib/store/reviews";

let auktoriserad = true;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));
const audit = vi.fn(async (..._a: unknown[]) => {});
vi.mock("@/lib/audit", () => ({ audit: (...a: unknown[]) => audit(...a) }));

let rader: StoredReview[] = [];
const skrivna: StoredReview[] = [];
vi.mock("@/lib/store/reviews", async (original) => ({
  ...(await original<typeof import("@/lib/store/reviews")>()),
  getReviewStore: () => ({
    listByProduct: async (productId: string) => rader.filter((r) => r.productId === productId),
    upsert: async (r: StoredReview) => {
      skrivna.push(r);
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
const BILD = "https://static.wixstatic.com/media/test_0001~mv2.jpeg";

function dold(): StoredReview {
  return {
    productId: P,
    reviewIdAE: "gen-test01",
    rating: 5,
    textOriginal: "Hemlig originaltext",
    textSwedish: "Mycket fin, ger en skön värme",
    customerNameRaw: "Hemligt Namn",
    initials: "A.B.",
    date: "2025-01-02",
    hasImage: true,
    imageUrl: BILD,
    imageUrls: [BILD],
    status: "rejected",
  };
}

function anrop(body: unknown, q = "", headers: Record<string, string> = {}) {
  return POST(
    new NextRequest(`https://x.test/api/admin/recension-foto-bort${q}`, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", ...headers },
    }),
  );
}

const GILTIG = { rader: [{ productId: P, reviewIdAE: "gen-test01", bilder: [BILD], visaIgen: true }] };

beforeEach(() => {
  auktoriserad = true;
  rader = [dold()];
  skrivna.length = 0;
  butiksanrop.length = 0;
  audit.mockClear();
  delete process.env.CRON_SECRET;
});

describe("POST /api/admin/recension-foto-bort", () => {
  it("utan behörighet: 401 och inget görs", async () => {
    auktoriserad = false;
    const res = await anrop(GILTIG, "?skarp=ja");
    expect(res.status).toBe(401);
    expect(skrivna).toHaveLength(0);
    expect(butiksanrop).toHaveLength(0);
  });

  it("Bearer med CRON_SECRET släpps in (så workflowen kan köra den)", async () => {
    auktoriserad = false;
    process.env.CRON_SECRET = "hemlig";
    expect((await anrop(GILTIG, "", { authorization: "Bearer hemlig" })).status).toBe(200);
    expect((await anrop(GILTIG, "", { authorization: "Bearer fel" })).status).toBe(401);
  });

  it("ogiltig JSON och tom lista ger 400", async () => {
    expect((await anrop("{inte json")).status).toBe(400);
    const tom = await anrop({ rader: [] });
    expect(tom.status).toBe(400);
    const dalig = await anrop({ rader: [{ productId: "x", reviewIdAE: "y", bilder: [BILD] }] });
    expect(dalig.status).toBe(400);
    expect((await dalig.json()).fel[0]).toMatch(/produkt-id/);
  });

  it("torrkörning visar vad som skulle ändras men skriver inget, loggar inget och ropar inte på butiken", async () => {
    const res = await anrop(GILTIG);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.skarp).toBe(false);
    expect(json.rader[0]).toMatchObject({ utfall: "andras", bilderFore: 1, bilderEfter: 0, statusFore: "rejected", statusEfter: "edited" });
    expect(skrivna).toHaveLength(0);
    expect(audit).not.toHaveBeenCalled();
    expect(butiksanrop).toHaveLength(0);
  });

  it("skarp körning visar recensionen igen utan foto, loggar, och säger till butiken att förnya just den produkten", async () => {
    const res = await anrop(GILTIG, "?skarp=ja");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skrivna).toBe(1);
    expect(json.butiken).toEqual({ utfall: "uppdaterad", status: 200, produkter: 1 });
    expect(skrivna).toHaveLength(1);
    expect(skrivna[0]).toMatchObject({ status: "edited", hasImage: false, textSwedish: "Mycket fin, ger en skön värme", rating: 5 });
    expect(skrivna[0].imageUrl).toBeUndefined();
    expect(skrivna[0].imageUrls).toBeUndefined();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(butiksanrop).toEqual([{ produkter: [{ id: P, vad: "recensioner" }], orsak: "recension-foto-bort" }]);
  });

  it("☠️ skarp körning med ett fel i listan skriver ingenting alls, inte ens de rader som var rätt", async () => {
    const res = await anrop(
      { rader: [...GILTIG.rader, { productId: P, reviewIdAE: "gen-b", bilder: [] }] },
      "?skarp=ja",
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/ingenting skrevs/);
    expect(skrivna).toHaveLength(0);
    expect(butiksanrop).toHaveLength(0);
  });

  it("samma skarpa körning en gång till är redan klar: inget skrivs, butiken lämnas ifred", async () => {
    rader = [{ ...dold(), status: "edited", hasImage: false, imageUrl: undefined, imageUrls: undefined }];
    const json = await (await anrop(GILTIG, "?skarp=ja")).json();
    expect(json.rader[0].utfall).toBe("redan_klar");
    expect(json.skrivna).toBe(0);
    expect(skrivna).toHaveLength(0);
    expect(butiksanrop).toHaveLength(0);
  });

  it("svaret bär inga namn och ingen recensionstext", async () => {
    const text = JSON.stringify(await (await anrop(GILTIG, "?skarp=ja")).json());
    expect(text).not.toContain("Hemligt");
    expect(text).not.toContain("Hemlig originaltext");
    expect(text).not.toContain("Mycket fin");
    expect(text).toContain("A.B.");
  });
});
