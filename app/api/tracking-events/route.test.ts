// Kundens spårningssida läser hit. Testerna låser de tre saker som gick fel
// när rutten frågade Wix Data direkt (se rutthuvudet).

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "@/lib/orders/types";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/aliexpress/client", () => ({ getTracking: vi.fn() }));

import { getTracking } from "@/lib/aliexpress/client";
import { GET } from "./route";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1",
    orderId: "o1",
    orderNumber: "10024",
    lineItemId: "l1",
    productName: "Bäddsoffa",
    variantChoices: {},
    quantity: 1,
    status: "shipped",
    aliexpressOrderId: "AE-1",
    createdAt: new Date().toISOString(),
    ...patch,
  };
}

function req(tn: string) {
  const url = new URL(`http://localhost/api/tracking-events?tn=${encodeURIComponent(tn)}`);
  return { nextUrl: url, url: url.toString() } as unknown as Parameters<typeof GET>[0];
}

/** Unikt nummer per test — rutten har en process-global 5 min-cache. */
let räknare = 0;
const nyttTn = () => `TRK${String(++räknare).padStart(11, "0")}`;

beforeEach(() => {
  store = new MemoryStore();
  vi.mocked(getTracking).mockReset();
});

describe("tracking-events — uppslaget går via storen", () => {
  it("☠️ hittar tasken och svarar med AE:s händelser", async () => {
    const tn = nyttTn();
    await store.upsertTask(task({ trackingNumber: tn, aliexpressOrderId: "AE-42" }));
    vi.mocked(getTracking).mockResolvedValue({
      trackingNumber: tn,
      shippingProvider: "PostNord",
      etaTimestamp: null,
      events: [{ time: "2026-09-01T19:40:00Z", description: "På väg" }],
    } as unknown as Awaited<ReturnType<typeof getTracking>>);

    const res = await GET(req(tn));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.carrier).toBe("PostNord");
    expect(body.events).toHaveLength(1);
    // Uppslaget ska ha skett på spårningsnumret, och AE frågas om ORDERN.
    expect(vi.mocked(getTracking)).toHaveBeenCalledWith("AE-42");
  });

  it("☠️ ett tomt lager ger 404 — det är symtomet migreringen gav i drift", async () => {
    const res = await GET(req(nyttTn()));
    expect(res.status).toBe(404);
    expect(vi.mocked(getTracking)).not.toHaveBeenCalled();
  });

  it("en task UTAN aliexpressOrderId är inte ett uppslag värt att göra", async () => {
    const tn = nyttTn();
    await store.upsertTask(task({ trackingNumber: tn, aliexpressOrderId: undefined }));
    expect((await GET(req(tn))).status).toBe(404);
    expect(vi.mocked(getTracking)).not.toHaveBeenCalled();
  });

  it("☠️ rutten versaliserar inmatningen — uppslaget måste tåla det", async () => {
    // Rutten gör toUpperCase() på kundens `tn`. En task som bär numret med
    // gemener hade annars gett samma tysta 404 som migreringen gav.
    const tn = nyttTn();
    await store.upsertTask(task({ trackingNumber: tn.toLowerCase(), aliexpressOrderId: "AE-7" }));
    vi.mocked(getTracking).mockResolvedValue({
      trackingNumber: tn, shippingProvider: null, etaTimestamp: null, events: [],
    } as unknown as Awaited<ReturnType<typeof getTracking>>);

    expect((await GET(req(tn.toLowerCase()))).status).toBe(200);
    expect(vi.mocked(getTracking)).toHaveBeenCalledWith("AE-7");
  });

  it("avvisar skräp innan något slås upp", async () => {
    for (const dåligt of ["", "kort", "har mellanslag", "a".repeat(41)]) {
      expect((await GET(req(dåligt))).status).toBe(400);
    }
  });

  it("☠️ svaret bär ENBART transportdata — aldrig kund eller order", async () => {
    const tn = nyttTn();
    await store.upsertTask(
      task({
        trackingNumber: tn,
        aliexpressOrderId: "AE-9",
        shippingAddress: { fullName: "Kund Kundsson", addressLine1: "Gatan 1" } as never,
      }),
    );
    vi.mocked(getTracking).mockResolvedValue({
      trackingNumber: tn, shippingProvider: "PostNord", etaTimestamp: null, events: [],
    } as unknown as Awaited<ReturnType<typeof getTracking>>);

    const rå = JSON.stringify(await (await GET(req(tn))).json());
    for (const läckage of ["Kundsson", "Gatan 1", "10024", "AE-9", "o1:l1"]) {
      expect(rå).not.toContain(läckage);
    }
  });

  it("ett fel nedströms blir 502, inte 404 — annars ser det ut som okänt nummer", async () => {
    const tn = nyttTn();
    await store.upsertTask(task({ trackingNumber: tn, aliexpressOrderId: "AE-1" }));
    vi.mocked(getTracking).mockRejectedValue(new Error("AE nere"));
    expect((await GET(req(tn))).status).toBe(502);
  });
});

describe("getTaskByTrackingNumber — storens egen del", () => {
  it("tomt nummer slår aldrig upp något", async () => {
    await store.upsertTask(task({ trackingNumber: "TRK1" }));
    expect(await store.getTaskByTrackingNumber("")).toBeNull();
  });

  it("en task utan spårningsnummer matchas inte av misstag", async () => {
    await store.upsertTask(task({ taskId: "x:1", trackingNumber: undefined }));
    expect(await store.getTaskByTrackingNumber("TRK1")).toBeNull();
  });
});
