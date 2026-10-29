// Sortimentsrutten: auth, landet, och att svaret aldrig bär artikelnummer,
// inköpspris eller feedens adress. Feeden, mappningarna och katalogen är
// låtsade och påhittade; mätningen är den riktiga.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AosomRow } from "@/lib/aosom/feed";

const lage = vi.hoisted(() => ({ feedFel: null as Error | null, raderFeed: 2000 }));

function rad(sku: string): AosomRow {
  return {
    sku,
    name: "Gartenbank aus Holz",
    url: "",
    imageUrls: [],
    category: "Garten",
    color: "",
    material: "",
    size: "",
    packageSize: "",
    weightKg: null,
    // Ett brett ord ger ett utdrag, och utdraget står bredvid ett artikelnummer.
    descriptionHtml: "<p>Platz für eine Lampe, wie bei 845-030CG.</p>",
    bulletsHtml: "",
    qty: 3,
    normalPriceEur: null,
    wholesaleEur: 123.45,
    seFreightEur: 21.37,
    rowIndex: 1,
    fraktPerLand: { SE: 21.37, DK: 17.89 },
  };
}

vi.mock("@/lib/aosom/feed", async (orig) => ({
  ...(await orig<typeof import("@/lib/aosom/feed")>()),
  fetchAosomFeed: async () => {
    if (lage.feedFel) throw lage.feedFel;
    return Array.from({ length: lage.raderFeed }, (_, i) => rad(`TEST-${String(i + 1).padStart(4, "0")}`));
  },
}));

vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    listMappings: async () => [
      { supplier: "aosom", supplierProductId: "aosom:TEST-0001", wixProductId: "wix-1", variants: [] },
      { supplierProductId: "1005000000000001", wixProductId: "wix-2", variants: [] },
    ],
  }),
}));

vi.mock("@/lib/wix/v3-products", async (orig) => ({
  ...(await orig<typeof import("@/lib/wix/v3-products")>()),
  listV3ProductInfo: async () => {
    const ut = new Map([
      ["wix-1", { namn: "Trädgårdsbänk", slug: "tradgardsbank", visible: true }],
      ["wix-2", { namn: "Lampa", slug: "lampa", visible: true }],
    ]);
    for (let i = 0; i < 600; i++) ut.set(`fyll-${i}`, { namn: "Annan", slug: `fyll-${i}`, visible: true });
    return ut;
  },
}));

vi.mock("@/lib/store/pricing-config", () => ({
  getPricingRules: async () => ({
    usdToSek: 10.5,
    vatRatePercent: 25,
    defaultMultiplier: 1.2,
    fixedSurchargeSek: 0,
    categoryMultipliers: {},
    tiersEnabled: false,
    tiers: [],
    rounding: "charm99",
  }),
}));

import { GET } from "./route";

const anrop = (land: string | null, auth?: string) =>
  new NextRequest(`https://motor.example/api/admin/landsortiment${land === null ? "" : `?land=${land}`}`, {
    headers: auth ? { authorization: auth } : {},
  });

describe("GET /api/admin/landsortiment", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "testhemlighet";
    lage.feedFel = null;
    lage.raderFeed = 2000;
  });

  it("401 utan nyckel och med fel nyckel", async () => {
    expect((await GET(anrop("DK"))).status).toBe(401);
    expect((await GET(anrop("DK", "Bearer fel"))).status).toBe(401);
  });

  it("400 för ett land utan egen avrundning, och utan land", async () => {
    expect((await GET(anrop("FI", "Bearer testhemlighet"))).status).toBe(400);
    expect((await GET(anrop(null, "Bearer testhemlighet"))).status).toBe(400);
  });

  it("svarar med sammanfattningen och listan för Danmark", async () => {
    const res = await GET(anrop("DK", "Bearer testhemlighet"));
    expect(res.status).toBe(200);
    const kropp = await res.json();
    expect(kropp).toMatchObject({ ok: true, land: "DK", valuta: "DKK" });
    expect(kropp.sidor).toMatchObject({ publicerade: 2, aosom: 1, ok: 1 });
    expect(kropp.sidor.perLeverantor).toEqual({ aliexpress: 1, aosom: 1, vevor: 0, okand: 0 });
    expect(kropp.lista.map((r: { wixProductId: string }) => r.wixProductId)).toEqual(["wix-1"]);
  });

  it("☠️ svaret bär varken artikelnummer eller inköpsled, inte ens i ett utdrag", async () => {
    const text = JSON.stringify(await (await GET(anrop("DK", "Bearer testhemlighet"))).json());
    expect(text).toContain("Platz für eine Lampe");
    for (const h of ["TEST-0001", "aosom:", "1005000000000001", "123.45", "21.37", "17.89", "845-030CG"]) {
      expect(text).not.toContain(h);
    }
  });

  it("en halvläst feed ger 503 med spärrens egen text", async () => {
    lage.raderFeed = 10;
    const res = await GET(anrop("DK", "Bearer testhemlighet"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("minst");
  });

  it("☠️ ett annat fel svarar utan sin text, som kan bära feedens adress", async () => {
    lage.feedFel = new Error("fetch failed: https://hemlig.example/feed.csv");
    const res = await GET(anrop("DK", "Bearer testhemlighet"));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("hemlig.example");
  });
});
