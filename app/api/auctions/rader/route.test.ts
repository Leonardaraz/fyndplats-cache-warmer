import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AuctionDoc } from "@/lib/auction/engine";

const anrop: string[] = [];

function dok(productId: string, status: AuctionDoc["status"], extra: Partial<AuctionDoc> = {}): AuctionDoc {
  return {
    _id: `auction-${productId}`,
    productId,
    slug: `slug-${productId}`,
    name: productId,
    listPrice: 999,
    floorPrice: 719,
    ladder: [999, 719],
    variantPrices: [{ wixVariantId: "v", listPrice: 999, floorPrice: 719, ladder: [999, 719] }],
    stepMinutes: 60,
    slot: 1,
    status,
    queueOrder: 3,
    ...extra,
  };
}

vi.mock("@/lib/auction/store", () => ({
  auktionslager: () => "wix-data",
  queryAuctions: async (statuses: string[]) => {
    anrop.push(`query:${statuses.join(",")}`);
    return [dok("p1", "live"), dok("p2", "live")];
  },
  senastSalda: async (limit: number) => {
    anrop.push(`sold:${limit}`);
    return [dok("p3", "sold", { soldPrice: 800, endedAt: "2026-09-29T10:00:00.000Z" })];
  },
}));

import { GET } from "./route";

function begäran(q: string, auth: string | null = "Bearer s3kr3t"): NextRequest {
  return new NextRequest(`https://motor.test/api/auctions/rader${q}`, {
    headers: auth ? { authorization: auth } : {},
  });
}

beforeEach(() => {
  anrop.length = 0;
  process.env.REVIEW_INGEST_SECRET = "s3kr3t";
  delete process.env.CRON_SECRET;
});

describe("rader", () => {
  it("live: allowlist, och `lager` säger vilket lager som svarade", async () => {
    const res = await GET(begäran("?status=live"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.lager).toBe("wix-data");
    expect(body.rader).toHaveLength(2);
    expect(JSON.stringify(body)).not.toMatch(/floorPrice|variantPrices|queueOrder/);
    expect(anrop).toEqual(["query:live"]);
  });

  it("sold: limit skickas vidare och takas på 50", async () => {
    await GET(begäran("?status=sold&limit=6"));
    await GET(begäran("?status=sold&limit=5000"));
    await GET(begäran("?status=sold"));
    expect(anrop).toEqual(["sold:6", "sold:50", "sold:50"]);
  });

  it("okänd status → 400, inget läst", async () => {
    expect((await GET(begäran("?status=queued"))).status).toBe(400);
    expect((await GET(begäran(""))).status).toBe(400);
    expect(anrop).toEqual([]);
  });

  it("☠️ utan rätt hemlighet läses ingenting — stegen avslöjar golvet", async () => {
    expect((await GET(begäran("?status=live", "Bearer fel"))).status).toBe(401);
    expect((await GET(begäran("?status=live", null))).status).toBe(401);
    delete process.env.REVIEW_INGEST_SECRET;
    expect((await GET(begäran("?status=live"))).status).toBe(503);
    expect(anrop).toEqual([]);
  });
});
