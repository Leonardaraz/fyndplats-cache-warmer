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

  it("returns null AliExpress tokens before any save", async () => {
    const s = new MemoryStore();
    expect(await s.getAliExpressTokens()).toBeNull();
  });

  it("round-trips AliExpress tokens (last-write-wins)", async () => {
    const s = new MemoryStore();
    const expiresAt = new Date("2026-06-01T12:00:00Z");
    await s.saveAliExpressTokens({
      accessToken: "test-access-1",
      refreshToken: "test-refresh-1",
      expiresAt,
    });
    expect(await s.getAliExpressTokens()).toEqual({
      accessToken: "test-access-1",
      refreshToken: "test-refresh-1",
      expiresAt,
    });

    // Overwrite-semantik (Task B kommer skriva nya tokens efter refresh).
    const newExpiry = new Date("2026-06-02T12:00:00Z");
    await s.saveAliExpressTokens({
      accessToken: "test-access-2",
      refreshToken: "test-refresh-2",
      expiresAt: newExpiry,
    });
    const got = await s.getAliExpressTokens();
    expect(got?.accessToken).toBe("test-access-2");
    expect(got?.expiresAt).toEqual(newExpiry);
  });
});
