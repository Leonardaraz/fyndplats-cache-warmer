import { describe, expect, it } from "vitest";
import { MemoryStore } from "./memory";
import type { FulfillmentTask } from "../orders/types";

function task(id: string): FulfillmentTask {
  return {
    taskId: id,
    orderId: "o1",
    orderNumber: "100",
    lineItemId: id,
    productName: "X",
    variantChoices: {},
    quantity: 1,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

describe("MemoryStore", () => {
  it("dedupes webhook events", async () => {
    const s = new MemoryStore();
    expect(await s.hasSeenEvent("e1")).toBe(false);
    await s.markEventSeen("e1");
    expect(await s.hasSeenEvent("e1")).toBe(true);
  });

  it("creates a task only once (idempotent per order line)", async () => {
    const s = new MemoryStore();
    expect(await s.createTaskIfAbsent(task("t1"))).toBe(true);
    expect(await s.createTaskIfAbsent(task("t1"))).toBe(false);
    expect(await s.listTasks()).toHaveLength(1);
  });

  it("filters tasks by status", async () => {
    const s = new MemoryStore();
    await s.upsertTask(task("t1"));
    await s.setTaskStatus("t1", "shipped");
    expect(await s.listTasks("shipped")).toHaveLength(1);
    expect(await s.listTasks("pending")).toHaveLength(0);
  });

  it("returns audit entries newest-first", async () => {
    const s = new MemoryStore();
    await s.appendAudit({ at: "2026-01-01T00:00:00Z", kind: "import", ref: "p1" });
    await s.appendAudit({ at: "2026-01-02T00:00:00Z", kind: "order", ref: "o1" });
    const log = await s.listAudit();
    expect(log[0].kind).toBe("order");
    expect(log[1].kind).toBe("import");
  });
});
