// Butikens direktavslut. Det som testas är riktningarna där ett fel når kunden:
// ett sålt fynd som fortsätter säljas till auktionspris, eller ett fel i en
// rad som tystar de andra.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AuctionDoc } from "@/lib/auction/engine";

const live: AuctionDoc[] = [];
const ordning: string[] = [];
const sparade: AuctionDoc[] = [];
let restoreFel: Error | null = null;

vi.mock("@/lib/auction/store", () => ({
  auktionslager: () => "postgres",
  queryAuctions: async (statuses: string[]) => {
    expect(statuses).toEqual(["live"]);
    return live.map((a) => ({ ...a }));
  },
  restoreListPrice: async (a: AuctionDoc) => {
    ordning.push(`restore:${a.productId}`);
    if (restoreFel) throw restoreFel;
  },
  saveAuction: async (a: AuctionDoc) => {
    ordning.push(`save:${a.productId}`);
    sparade.push(a);
  },
  isProductGone: (e: unknown) => /patch GET 404\b/.test(e instanceof Error ? e.message : String(e)),
}));

import { POST } from "./route";

const HEMLIGHET = "s3kr3t";

function begäran(body: unknown, auth: string | null = `Bearer ${HEMLIGHET}`): NextRequest {
  return new NextRequest("https://motor.test/api/auctions/avsluta", {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function dok(productId: string, extra: Partial<AuctionDoc> = {}): AuctionDoc {
  return {
    _id: `auction-${productId}`,
    productId,
    slug: `slug-${productId}`,
    name: productId,
    listPrice: 999,
    floorPrice: 719,
    ladder: [999, 719],
    stepMinutes: 60,
    slot: 1,
    status: "live",
    queueOrder: 3,
    lastPatchedPrice: 879,
    ...extra,
  };
}

beforeEach(() => {
  live.length = 0;
  ordning.length = 0;
  sparade.length = 0;
  restoreFel = null;
  process.env.REVIEW_INGEST_SECRET = HEMLIGHET;
  delete process.env.CRON_SECRET;
});

describe("☠️ hemligheten", () => {
  it("osatt → 503 och ingenting avslutas", async () => {
    delete process.env.REVIEW_INGEST_SECRET;
    live.push(dok("p1"));
    const res = await POST(begäran({ productIds: ["p1"] }));
    expect(res.status).toBe(503);
    expect(ordning).toEqual([]);
  });

  it("fel hemlighet → 401", async () => {
    live.push(dok("p1"));
    const res = await POST(begäran({ productIds: ["p1"] }, "Bearer fel"));
    expect(res.status).toBe(401);
    expect(ordning).toEqual([]);
  });
});

describe("avslutet", () => {
  it("☠️ priset återställs FÖRE sold, och soldPrice är senast satta pris", async () => {
    live.push(dok("p1"), dok("p2"));
    const res = await POST(begäran({ productIds: ["p1", "annan"] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, lager: "postgres", avslutade: ["slug-p1"], fel: [] });
    expect(ordning).toEqual(["restore:p1", "save:p1"]);
    expect(sparade[0]).toMatchObject({ status: "sold", soldPrice: 879, _id: "auction-p1" });
    expect(Date.parse(sparade[0].endedAt!)).not.toBeNaN();
  });

  it("utan senast satt pris är soldPrice listpriset", async () => {
    live.push(dok("p1", { lastPatchedPrice: undefined }));
    await POST(begäran({ productIds: ["p1"] }));
    expect(sparade[0].soldPrice).toBe(999);
  });

  it("en raderad produkt sparas ändå som såld — affären är verklig", async () => {
    live.push(dok("p1"));
    restoreFel = new Error('patchProductVariants patch GET 404: {"message":"Entity not found"}');
    const body = await (await POST(begäran({ productIds: ["p1"] }))).json();
    expect(body.avslutade).toEqual(["slug-p1"]);
    expect(sparade).toHaveLength(1);
  });

  it("☠️ ett övergående fel sparar INTE sold (priset kan stå kvar) — och syns i svaret", async () => {
    live.push(dok("p1"));
    restoreFel = new Error("patch PATCH 500: internal");
    const body = await (await POST(begäran({ productIds: ["p1"] }))).json();
    expect(body.ok).toBe(false);
    expect(body.avslutade).toEqual([]);
    expect(body.fel[0]).toMatch(/slug-p1: patch PATCH 500/);
    expect(sparade).toHaveLength(0);
  });

  it("ingen träff är det normala — tom lista, inget skrivet", async () => {
    live.push(dok("p1"));
    const body = await (await POST(begäran({ productIds: ["x"] }))).json();
    expect(body).toMatchObject({ ok: true, avslutade: [], fel: [] });
    expect(ordning).toEqual([]);
  });
});

describe("kroppen", () => {
  it.each([
    ["ingen lista", {}],
    ["fel typ", { productIds: "p1" }],
    ["tomma id", { productIds: [""] }],
    ["icke-strängar", { productIds: [1] }],
    ["för många", { productIds: Array.from({ length: 101 }, (_, i) => `p${i}`) }],
  ])("%s → 400", async (_namn, body) => {
    expect((await POST(begäran(body))).status).toBe(400);
  });

  it("inte JSON → 400", async () => {
    expect((await POST(begäran("{inte json"))).status).toBe(400);
  });
});
