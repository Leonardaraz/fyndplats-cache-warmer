import { describe, expect, it, vi } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "@/lib/orders/types";
import { linkAliExpressOrder, väljTask } from "./link-ae-order";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1",
    orderId: "o1",
    orderNumber: "10025",
    lineItemId: "l1",
    productName: "Kattlåda",
    variantChoices: {},
    quantity: 1,
    status: "pending",
    createdAt: "2026-09-01T05:39:50.530Z",
    ...patch,
  };
}

const AE = "3075762642483058";

function deps(spårning?: string) {
  return {
    getTracking: vi.fn().mockResolvedValue({
      tradeOrderId: AE,
      trackingNumber: spårning,
      status: "SHIPPED",
      events: [],
    }),
  } as unknown as Parameters<typeof linkAliExpressOrder>[2];
}

describe("väljTask — orderNumber måste peka på EXAKT en rad", () => {
  it("en pending rad på ordern → den", () => {
    const v = väljTask([task()], { orderNumber: "10025" });
    expect("task" in v && v.task.taskId).toBe("o1:l1");
  });

  it("☠️ två kopplingsbara rader → vägrar och listar dem, gissar aldrig", () => {
    const v = väljTask(
      [task({ taskId: "o1:l1", productName: "A" }), task({ taskId: "o1:l2", productName: "B" })],
      { orderNumber: "10025" },
    );
    expect("error" in v).toBe(true);
    if (!("error" in v)) throw new Error("fel gren");
    expect(v.candidates?.map((c) => c.taskId)).toEqual(["o1:l1", "o1:l2"]);
  });

  it("redan kopplade och terminala rader räknas inte som kandidater", () => {
    const v = väljTask(
      [
        task({ taskId: "o1:l1", status: "shipped", aliexpressOrderId: "1" }),
        task({ taskId: "o1:l2", status: "cancelled" }),
        task({ taskId: "o1:l3" }),
      ],
      { orderNumber: "10025" },
    );
    expect("task" in v && v.task.taskId).toBe("o1:l3");
  });

  it("taskId vinner över orderNumber", () => {
    const v = väljTask([task({ taskId: "x:1", orderNumber: "99" }), task()], {
      taskId: "x:1",
      orderNumber: "10025",
    });
    expect("task" in v && v.task.taskId).toBe("x:1");
  });

  it("okänd order → tydligt fel", () => {
    expect(väljTask([task()], { orderNumber: "10099" })).toEqual({ error: "Ingen task för order 10099." });
  });
});

describe("linkAliExpressOrder", () => {
  it("☠️ kopplar: id + status i en skrivning, läser tillbaka, skriver audit", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task());

    const r = await linkAliExpressOrder(store, { orderNumber: "10025", aeOrderId: AE, source: "test" }, deps("13289200665172"));
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(r.error);
    expect(r.taskId).toBe("o1:l1");
    expect(r.probe).toContain("13289200665172");

    const efter = (await store.listTasks()).find((t) => t.taskId === "o1:l1")!;
    expect(efter.status).toBe("ordered");
    expect(efter.aliexpressOrderId).toBe(AE);

    const audit = await store.listAudit(5);
    expect(audit.some((a) => a.kind === "ae-order-linked" && a.ref === "o1:l1")).toBe(true);
  });

  it("tar ordernumret med mellanslag från kopiering", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task());
    const r = await linkAliExpressOrder(store, { orderNumber: "10025", aeOrderId: " 3075 7626 4248 3058 ", source: "t" }, deps());
    expect(r.ok).toBe(true);
    expect((await store.listTasks())[0].aliexpressOrderId).toBe(AE);
  });

  it("☠️ vägrar något som inte är ett ordernummer — hellre nej än fel id", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task());
    for (const dåligt of ["", "abc", "12345", "LP123456789SE"]) {
      const r = await linkAliExpressOrder(store, { orderNumber: "10025", aeOrderId: dåligt, source: "t" }, deps());
      expect(r.ok).toBe(false);
    }
    expect((await store.listTasks())[0].aliexpressOrderId).toBeUndefined();
  });

  it("☠️ en redan kopplad task skrivs INTE över", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task({ status: "ordered", aliexpressOrderId: "1111111111111111" }));
    const r = await linkAliExpressOrder(store, { taskId: "o1:l1", aeOrderId: AE, source: "t" }, deps());
    expect(r.ok).toBe(false);
    expect((await store.listTasks())[0].aliexpressOrderId).toBe("1111111111111111");
  });

  it("'ordered' utan id är ett giltigt kopplingsläge", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task({ status: "ordered" }));
    const r = await linkAliExpressOrder(store, { taskId: "o1:l1", aeOrderId: AE, source: "t" }, deps());
    expect(r.ok).toBe(true);
  });

  it("shipped/cancelled kan inte kopplas", async () => {
    for (const status of ["shipped", "cancelled"] as const) {
      const store = new MemoryStore();
      await store.upsertTask(task({ status }));
      const r = await linkAliExpressOrder(store, { taskId: "o1:l1", aeOrderId: AE, source: "t" }, deps());
      expect(r.ok).toBe(false);
      expect((await store.listTasks())[0].status).toBe(status);
    }
  });

  it("ett proben som kastar stoppar INTE kopplingen — bara beskedet ändras", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task());
    const d = { getTracking: vi.fn().mockRejectedValue(new Error("AE nere")) } as unknown as Parameters<typeof linkAliExpressOrder>[2];
    const r = await linkAliExpressOrder(store, { orderNumber: "10025", aeOrderId: AE, source: "t" }, d);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(r.error);
    expect(r.probe).toContain("svarade inte");
    expect((await store.listTasks())[0].status).toBe("ordered");
  });

  it("☠️ en skrivning som inte tar rapporteras som fel, inte som OK", async () => {
    const store = new MemoryStore();
    await store.upsertTask(task());
    // Simulera en backend vars updateTask tyst inte gör något.
    store.updateTask = async () => {};
    const r = await linkAliExpressOrder(store, { orderNumber: "10025", aeOrderId: AE, source: "t" }, deps());
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("fel gren");
    expect(r.error).toContain("läste inte tillbaka");
    expect((await store.listAudit(5)).some((a) => a.kind === "ae-order-linked")).toBe(false);
  });
});
