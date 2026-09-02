import { describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "@/lib/orders/types";
import type { Store } from "@/lib/store";
import { markOrderedManually, shipManually } from "./manual-fulfillment";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1",
    orderId: "o1",
    orderNumber: "10026",
    lineItemId: "l1",
    productName: "Kontorsstol som bär 220 kg",
    variantChoices: {},
    quantity: 1,
    status: "pending",
    createdAt: "2026-09-02T14:57:03.785Z",
    ...patch,
  };
}

const SPAR = "JJD000390009999999999";

function deps() {
  return { createFulfillment: vi.fn().mockResolvedValue({ fulfillmentId: "f1" }) };
}

async function medTasks(...t: FulfillmentTask[]): Promise<Store> {
  const store = new MemoryStore();
  for (const x of t) await store.upsertTask(x);
  return store;
}

// ---------------------------------------------------------------- beställd

describe("markOrderedManually", () => {
  it("pending → ordered och sparar leverantörsreferensen", async () => {
    const store = await medTasks(task());
    const r = await markOrderedManually(store, { orderNumber: "10026", supplierOrderRef: "921-471LG", source: "test" });
    expect(r.ok).toBe(true);
    const efter = (await store.listTasks())[0];
    expect(efter.status).toBe("ordered");
    expect(efter.supplierOrderRef).toBe("921-471LG");
  });

  it("☠️ referensen hamnar ALDRIG i aliexpressOrderId", async () => {
    const store = await medTasks(task());
    await markOrderedManually(store, { orderNumber: "10026", supplierOrderRef: "921-471LG", source: "test" });
    expect((await store.listTasks())[0].aliexpressOrderId).toBeUndefined();
  });

  it("referensen är frivillig — Aosoms bulkfil ger inget nummer direkt", async () => {
    const store = await medTasks(task());
    const r = await markOrderedManually(store, { orderNumber: "10026", source: "test" });
    expect(r.ok).toBe(true);
    expect((await store.listTasks())[0].status).toBe("ordered");
  });

  it("☠️ en flaggad task avanceras inte", async () => {
    const store = await medTasks(task({ refundFlagged: true }));
    const r = await markOrderedManually(store, { orderNumber: "10026", source: "test" });
    expect(r.ok).toBe(false);
    expect("error" in r && r.error).toContain("granskning");
    expect((await store.listTasks())[0].status).toBe("pending");
  });

  it("en claimad task rörs inte — motorn håller på att beställa", async () => {
    const store = await medTasks(task({ claimToken: "abc" }));
    const r = await markOrderedManually(store, { orderNumber: "10026", source: "test" });
    expect(r.ok).toBe(false);
    expect("error" in r && r.error).toContain("claim");
  });

  it("☠️ två rader på ordern → vägrar och listar dem", async () => {
    const store = await medTasks(task({ taskId: "o1:l1" }), task({ taskId: "o1:l2", lineItemId: "l2" }));
    const r = await markOrderedManually(store, { orderNumber: "10026", source: "test" });
    expect(r.ok).toBe(false);
    expect("candidates" in r && r.candidates?.length).toBe(2);
  });
});

// ----------------------------------------------------------------- skeppa

describe("shipManually", () => {
  it("ordered → shipped, Wix-fulfillment först och spårlänk satt av oss", async () => {
    const store = await medTasks(task({ status: "ordered" }));
    const d = deps();
    const r = await shipManually(store, { orderNumber: "10026", trackingNumber: SPAR, source: "test" }, d);
    expect(r.ok).toBe(true);
    expect(d.createFulfillment).toHaveBeenCalledTimes(1);
    const arg = d.createFulfillment.mock.calls[0][0];
    expect(arg.trackingNumber).toBe(SPAR);
    expect(arg.trackingLink).toBeTruthy();
    expect(arg.lineItems).toEqual([{ id: "l1", quantity: 1 }]);
    const efter = (await store.listTasks())[0];
    expect(efter.status).toBe("shipped");
    expect(efter.trackingNumber).toBe(SPAR);
  });

  it("pending → shipped går, för ett spårningsnummer bevisar att ordern lagts", async () => {
    const store = await medTasks(task({ status: "pending" }));
    const r = await shipManually(store, { orderNumber: "10026", trackingNumber: SPAR, source: "test" }, deps());
    expect(r.ok).toBe(true);
    expect((await store.listTasks())[0].status).toBe("shipped");
  });

  it("☠️ en redan skeppad task skeppas inte igen — det vore ett andra kundmejl", async () => {
    const store = await medTasks(task({ status: "shipped", trackingNumber: "GAMMALT" }));
    const d = deps();
    const r = await shipManually(store, { taskId: "o1:l1", trackingNumber: SPAR, source: "test" }, d);
    expect(r.ok).toBe(false);
    expect("error" in r && r.error).toContain("redan skeppad");
    expect(d.createFulfillment).not.toHaveBeenCalled();
    expect((await store.listTasks())[0].trackingNumber).toBe("GAMMALT");
  });

  it("☠️ F19-backstoppen gäller även manuellt — en flaggad task skeppas ALDRIG", async () => {
    for (const flagga of [{ cancelMidOrder: true }, { refundFlagged: true }, { orderUncertain: true }]) {
      const store = await medTasks(task({ status: "ordered", ...flagga }));
      const d = deps();
      const r = await shipManually(store, { taskId: "o1:l1", trackingNumber: SPAR, source: "test" }, d);
      expect(r.ok).toBe(false);
      expect(d.createFulfillment).not.toHaveBeenCalled();
      expect((await store.listTasks())[0].status).toBe("ordered");
    }
  });

  it("en avbruten task skeppas inte", async () => {
    const store = await medTasks(task({ status: "cancelled" }));
    const d = deps();
    const r = await shipManually(store, { taskId: "o1:l1", trackingNumber: SPAR, source: "test" }, d);
    expect(r.ok).toBe(false);
    expect(d.createFulfillment).not.toHaveBeenCalled();
  });

  it("för kort spårningsnummer avvisas innan något rörs", async () => {
    const store = await medTasks(task({ status: "ordered" }));
    const d = deps();
    const r = await shipManually(store, { orderNumber: "10026", trackingNumber: "abc", source: "test" }, d);
    expect(r.ok).toBe(false);
    expect(d.createFulfillment).not.toHaveBeenCalled();
  });

  it("☠️ misslyckad Wix-fulfillment lämnar tasken orörd", async () => {
    const store = await medTasks(task({ status: "ordered" }));
    const d = { createFulfillment: vi.fn().mockRejectedValue(new Error("Wix 500")) };
    await expect(
      shipManually(store, { orderNumber: "10026", trackingNumber: SPAR, source: "test" }, d),
    ).rejects.toThrow("Wix 500");
    expect((await store.listTasks())[0].status).toBe("ordered");
  });

  it("☠️ en tyst updateTask upptäcks — svaret får inte vara kvittot", async () => {
    const store = await medTasks(task({ status: "ordered" }));
    // Backend som svarar OK men inte skriver något (updateTask är en no-op på
    // en saknad rad i alla tre backends — det var så prissynken "uppdaterade"
    // priser i en månad utan att röra butiken).
    const tyst = Object.assign(Object.create(Object.getPrototypeOf(store)), store, {
      updateTask: async () => {},
    }) as Store;
    const r = await shipManually(tyst, { orderNumber: "10026", trackingNumber: SPAR, source: "test" }, deps());
    expect(r.ok).toBe(false);
    expect("error" in r && r.error).toContain("läste inte tillbaka");
  });

  it("☠️ två skeppningsbara rader → vägrar och listar dem", async () => {
    const store = await medTasks(
      task({ taskId: "o1:l1", status: "ordered" }),
      task({ taskId: "o1:l2", lineItemId: "l2", status: "ordered" }),
    );
    const d = deps();
    const r = await shipManually(store, { orderNumber: "10026", trackingNumber: SPAR, source: "test" }, d);
    expect(r.ok).toBe(false);
    expect("candidates" in r && r.candidates?.length).toBe(2);
    expect(d.createFulfillment).not.toHaveBeenCalled();
  });

  it("skriver en audit-rad med samma kind som poll-tracking", async () => {
    const store = await medTasks(task({ status: "ordered" }));
    await shipManually(store, { orderNumber: "10026", trackingNumber: SPAR, source: "test" }, deps());
    const rader = await store.listAudit();
    expect(rader.some((a) => a.kind === "wix-fulfillment-created")).toBe(true);
  });
});
