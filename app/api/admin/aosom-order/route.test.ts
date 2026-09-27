// Auth-grinden på bulkorder-rutten.
//
// ☠️ VARFÖR DET HÄR TESTET FINNS. Rutten gatades av `isAuthorized` ensamt,
// alltså EXTENSION_API_TOKEN i x-fyndplats-token. Workflowen `aosom-order.yml`
// skickar `Authorization: Bearer $CRON_SECRET` som varenda annan
// workflow-vänd admin-rutt i huset (prislas, mapping, aosom-remap). De två
// kördes aldrig ihop, så rutten svarade 401 "Otillåten" varje gång och
// workflowen har aldrig kunnat lägga en enda Aosom-order.
//
// Det är samma klass som en grind som inte kan fälla: den fanns, den var
// dokumenterad, och den kunde inte göra sitt jobb. Skälet den byggdes för —
// att CRON_SECRET är märkt Sensitive i Vercel och inte går att läsa tillbaka
// ens för ägaren — gällde alltså oförändrat hela tiden.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));

// Tillägget presenterar sig ALDRIG i de här testerna — vi mäter uteslutande
// CRON_SECRET-vägen, som är den workflowen faktiskt går.
vi.mock("@/lib/auth", () => ({ isAuthorized: () => false }));

import { GET } from "./route";

function req(headers: Record<string, string>, query = "") {
  return {
    headers: new Headers(headers),
    nextUrl: { searchParams: new URLSearchParams(query) },
  } as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
  store = new MemoryStore();
  process.env.CRON_SECRET = "hemlig";
});

describe("aosom-order auth", () => {
  it("släpper in en workflow som bär Bearer CRON_SECRET", async () => {
    const res = await GET(req({ authorization: "Bearer hemlig" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("avvisar fel hemlighet", async () => {
    const res = await GET(req({ authorization: "Bearer fel" }));
    expect(res.status).toBe(401);
  });

  it("avvisar ett anrop utan någon header alls", async () => {
    const res = await GET(req({}));
    expect(res.status).toBe(401);
  });

  it("avvisar allt när CRON_SECRET saknas i miljön — aldrig fail-open", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req({ authorization: "Bearer hemlig" }));
    expect(res.status).toBe(401);
  });
});

// ── FÄRGSAMMANSLAGNA SIDOR ────────────────────────────────────────────────
// En sammanslagen sida bär en Aosom-artikel per färg. Beställningsfilen måste
// välja artikel efter ORDERRADENS variant — radens egen artikel är bara den
// första färgens. Syntetiska artikelnummer: riktiga får aldrig stå här.

const ADRESS = {
  fullName: "Anna Andersson",
  addressLine1: "Storgatan 1",
  postalCode: "11122",
  city: "Stockholm",
  province: "Stockholm",
  country: "SE",
  phone: "+46701234567",
};

function variant(artikel: string, farg: string) {
  return {
    supplierVariantId: artikel,
    sku: `FP-stol-${farg.toLowerCase()}`,
    wixVariantId: `wixvar-${farg.toLowerCase()}`,
    choices: { Färg: farg },
    costUsd: 10,
    landedCostSek: 105,
    grossSek: 129,
  };
}

async function sammanslagenSida() {
  await store.saveMapping({
    supplierProductId: "aosom:A-1",
    supplier: "aosom",
    wixProductId: "wix-stol",
    variants: [variant("A-1", "Svart"), variant("B-2", "Grå")],
  });
}

function orderrad(orderNumber: string, line: string, over: Record<string, unknown> = {}) {
  return {
    taskId: `o${orderNumber}:${line}`,
    orderId: `o${orderNumber}`,
    orderNumber,
    lineItemId: line,
    productName: "Stol",
    wixCatalogItemId: "wix-stol",
    variantChoices: {},
    quantity: 1,
    status: "pending" as const,
    shippingAddress: ADRESS,
    createdAt: "2026-09-27T06:00:00Z",
    ...over,
  };
}

async function csv(): Promise<string[][]> {
  const res = await GET(req({ authorization: "Bearer hemlig" }, "format=csv&batch=1"));
  expect(res.status).toBe(200);
  return (await res.text()).trim().split("\n").slice(1).map((r) => r.split(","));
}

describe("aosom-order — färgsammanslagna sidor", () => {
  it("☠️ beställer den färg kunden valde, inte sidans första", async () => {
    await sammanslagenSida();
    await store.upsertTask(orderrad("10001", "l1", { wixVariantId: "wixvar-grå", sku: "FP-stol-grå" }));
    await store.upsertTask(orderrad("10002", "l1", { wixVariantId: "wixvar-svart", sku: "FP-stol-svart" }));
    const rader = await csv();
    const perOrder = Object.fromEntries(rader.map((r) => [r[r.length - 1], r[0]]));
    expect(perOrder).toEqual({ "10001": "B-2", "10002": "A-1" });
  });

  it("en order lagd före sammanslagningen (nollan som variant-id) beställs på sin SKU", async () => {
    await sammanslagenSida();
    await store.upsertTask(orderrad("10003", "l1", {
      wixVariantId: "00000000-0000-0000-0000-000000000000",
      sku: "FP-stol-svart",
    }));
    const rader = await csv();
    expect(rader.map((r) => r[0])).toEqual(["A-1"]);
  });

  it("☠️ en rad vars färg inte går att avgöra hålls — och hela dess order med den", async () => {
    await sammanslagenSida();
    await store.upsertTask(orderrad("10004", "l1", { wixVariantId: "wixvar-okand" }));
    await store.upsertTask(orderrad("10004", "l2", { wixVariantId: "wixvar-svart" }));
    const res = await GET(req({ authorization: "Bearer hemlig" }));
    const plan = await res.json();
    expect(plan.batchar).toEqual([]);
    expect(plan.hoppadeOver.map((h: { taskId: string }) => h.taskId).sort()).toEqual(["o10004:l1", "o10004:l2"]);
  });

  it("en vanlig enkelvariantssida beställs precis som förut", async () => {
    await store.saveMapping({
      supplierProductId: "aosom:C-3",
      supplier: "aosom",
      wixProductId: "wix-bord",
      variants: [{ ...variant("C-3", "Vit"), wixVariantId: "wixvar-bord" }],
    });
    await store.upsertTask(orderrad("10005", "l1", {
      wixCatalogItemId: "wix-bord",
      wixVariantId: "00000000-0000-0000-0000-000000000000",
    }));
    const rader = await csv();
    expect(rader.map((r) => r[0])).toEqual(["C-3"]);
  });
});
