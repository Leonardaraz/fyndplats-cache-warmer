import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "@/lib/orders/types";

// Delad store mellan route och test. getStore() mockas att returnera den.
let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn() }));
vi.mock("@/lib/sync/bestsellers", () => ({ enqueuePriorityCheck: vi.fn().mockResolvedValue(0) }));
vi.mock("@/lib/import/supplier-tracking", () => ({ recordOrder: vi.fn().mockResolvedValue(null) }));

import { POST } from "./route";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1", orderId: "o1", orderNumber: "100", lineItemId: "l1", productName: "X",
    wixCatalogItemId: "wix-1", variantChoices: {}, quantity: 1, status: "pending",
    createdAt: new Date().toISOString(),
    shippingAddress: { fullName: "A B", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", country: "SE" },
    ...patch,
  };
}
function req(body: unknown) {
  return new Request("http://localhost/api/wix-order", {
    method: "POST",
    headers: { "x-forwarded-from": "fyndplats-webhook", "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}
const get = async (id: string) => (await store.listTasks()).find((t) => t.taskId === id);

const cancelEvent = {
  id: "evt-c1", entityFqdn: "wix.ecom.v1.order", slug: "canceled", entityId: "o1",
  actionEvent: { body: { order: { id: "o1" } } },
};
const refundEvent = {
  id: "evt-r1", entityFqdn: "wix.ecom.v1.order_transactions", slug: "refund_completed", entityId: "txn1",
  updatedEvent: { currentEntity: { orderId: "o1", refund: { id: "r1" } } },
};
const createdEvent = {
  id: "evt-n1", entityFqdn: "wix.ecom.v1.order", slug: "created", entityId: "o9",
  createdEvent: {
    entity: {
      id: "o9", number: "900",
      lineItems: [{ id: "l1", productName: { original: "W" }, quantity: 1, catalogReference: { catalogItemId: "wp9" } }],
      recipientInfo: { address: { addressLine1: "V 2", city: "GBG", postalCode: "41100", country: "SE" }, contact: { firstName: "E", lastName: "E" } },
    },
  },
};

beforeEach(() => {
  store = new MemoryStore();
  delete process.env.WIX_WEBHOOK_PUBLIC_KEY;
  delete process.env.WEBHOOK_FORWARD_SECRET;
});

describe("/api/wix-order — F19 cancel/refund-gate", () => {
  it("cancel-event → avbryter orderns pending-tasks, INGA nya tasks, 200", async () => {
    await store.upsertTask(task());
    const res = await POST(req(cancelEvent));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, kind: "cancel", cancelled: 1 });
    expect((await get("o1:l1"))?.status).toBe("cancelled");
  });

  it("refund-event → flaggar (avbryter EJ) orderns tasks, 200", async () => {
    await store.upsertTask(task());
    const res = await POST(req(refundEvent));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, kind: "refund", flagged: 1 });
    const t = await get("o1:l1");
    expect(t?.refundFlagged).toBe(true);
    expect(t?.status).toBe("pending"); // EJ avbruten
  });

  it("dubbel cancel-event (samma eventId) → andra dedupas, inga kast", async () => {
    await store.upsertTask(task());
    await POST(req(cancelEvent));
    const res2 = await POST(req(cancelEvent));
    expect(res2.status).toBe(200);
    expect(await res2.json()).toMatchObject({ deduped: true });
  });

  it("created-event går fortfarande create-vägen (regression: skapar tasks)", async () => {
    const res = await POST(req(createdEvent));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, tasksCreated: 1 });
    expect(await get("o9:l1")).toBeTruthy();
  });

  it("cancel utan härledbart order-id → 200 ignored (ingen retry-loop)", async () => {
    const res = await POST(req({ id: "evt-x", entityFqdn: "wix.ecom.v1.order", slug: "canceled" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: true });
  });
});
