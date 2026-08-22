import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "@/lib/orders/types";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/auth", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/aliexpress/client", () => ({ getTracking: vi.fn() }));
vi.mock("@/lib/wix/client", () => ({ createFulfillment: vi.fn().mockResolvedValue({ fulfillmentId: "f1" }) }));

import { getTracking } from "@/lib/aliexpress/client";
import { createFulfillment } from "@/lib/wix/client";
import { GET } from "./route";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1", orderId: "o1", orderNumber: "100", lineItemId: "l1", productName: "X",
    wixCatalogItemId: "wix-1", variantChoices: {}, quantity: 1, status: "ordered",
    aliexpressOrderId: "AE-1", createdAt: new Date().toISOString(),
    ...patch,
  };
}
function req() {
  return new Request("http://localhost/api/cron/poll-tracking") as unknown as Parameters<typeof GET>[0];
}

let prevBackend: string | undefined;
beforeEach(() => {
  store = new MemoryStore();
  prevBackend = process.env.STORE_BACKEND;
  process.env.STORE_BACKEND = "wix-data"; // kringgå memory-no-op-grenen
  vi.mocked(getTracking).mockReset();
  vi.mocked(createFulfillment).mockReset().mockResolvedValue({ fulfillmentId: "f1" });
});
afterEach(() => {
  if (prevBackend === undefined) delete process.env.STORE_BACKEND;
  else process.env.STORE_BACKEND = prevBackend;
});

describe("poll-tracking F19-backstopp", () => {
  it("flaggad ordered-task auto-skeppas ALDRIG; oflaggad skeppas", async () => {
    // refundFlagged-task som ändå hamnat i status=ordered (skriv-race) får inte skeppas.
    await store.upsertTask(task({ taskId: "o1:l1", aliexpressOrderId: "AE-1", refundFlagged: true }));
    await store.upsertTask(task({ taskId: "o2:l1", orderId: "o2", aliexpressOrderId: "AE-2" }));
    vi.mocked(getTracking).mockResolvedValue({ trackingNumber: "TRK", shippingProvider: "PostNord" } as Awaited<ReturnType<typeof getTracking>>);

    const res = await GET(req());
    const body = (await res.json()) as { heldForReview: number; shipped: number; checked: number };

    expect(body.heldForReview).toBe(1);
    expect(body.shipped).toBe(1);
    // getTracking/createFulfillment kördes BARA för den oflaggade.
    expect(vi.mocked(getTracking)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createFulfillment)).toHaveBeenCalledTimes(1);
    // den flaggade tasken är fortfarande ordered (ej shipped).
    const flagged = (await store.listTasks()).find((t) => t.taskId === "o1:l1");
    expect(flagged?.status).toBe("ordered");
  });

  // Order 10018 (2026-08-17) skeppades med AE-fraktbolaget "Seller Shipping ES
  // Local". Wix kände inte igen namnet, genererade ingen länk, och kunden fick
  // en leveransbekräftelse utan något sätt att följa paketet. Vår egen länk ska
  // därför alltid med — oavsett vad AE kallar fraktbolaget.
  it("spårlänken till vår egen sida följer alltid med", async () => {
    await store.upsertTask(task({ taskId: "o1:l1", aliexpressOrderId: "AE-1" }));
    vi.mocked(getTracking).mockResolvedValue({
      trackingNumber: "07084028196936",
      shippingProvider: "Seller Shipping ES Local",
    } as Awaited<ReturnType<typeof getTracking>>);

    await GET(req());

    expect(vi.mocked(createFulfillment)).toHaveBeenCalledWith(
      expect.objectContaining({
        trackingNumber: "07084028196936",
        trackingLink: "https://www.fyndplats.se/sparning?tn=07084028196936",
      }),
    );
  });

  it("cancelMidOrder och orderUncertain hålls också tillbaka", async () => {
    await store.upsertTask(task({ taskId: "o1:l1", aliexpressOrderId: "AE-1", cancelMidOrder: true }));
    await store.upsertTask(task({ taskId: "o2:l1", orderId: "o2", aliexpressOrderId: "AE-2", orderUncertain: true }));
    const res = await GET(req());
    const body = (await res.json()) as { heldForReview: number; shipped: number };
    expect(body.heldForReview).toBe(2);
    expect(body.shipped).toBe(0);
    expect(vi.mocked(createFulfillment)).not.toHaveBeenCalled();
  });
});
