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

  // Audit-loggen glömdes när synk-loggen fick retention i #332 och hade vuxit
  // till 4 723 rader. Gränsfallen här är de som faktiskt kan förlora data.
  describe("pruneAuditOlderThan", () => {
    const NOW = Date.parse("2026-07-31T12:00:00Z");
    const daysAgo = (d: number) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

    it("raderar bara rader äldre än fönstret", async () => {
      const s = new MemoryStore();
      await s.appendAudit({ at: daysAgo(120), kind: "gammal" });
      await s.appendAudit({ at: daysAgo(91), kind: "precis-for-gammal" });
      await s.appendAudit({ at: daysAgo(89), kind: "behalls" });
      await s.appendAudit({ at: daysAgo(1), kind: "farsk" });

      await s.pruneAuditOlderThan(90, NOW);

      const kvar = (await s.listAudit()).map((e) => e.kind).sort();
      expect(kvar).toEqual(["behalls", "farsk"]);
    });

    it("behåller rader med oparsbart datum hellre än att gissa", async () => {
      const s = new MemoryStore();
      await s.appendAudit({ at: "inte-ett-datum", kind: "trasig" });
      await s.appendAudit({ at: daysAgo(200), kind: "gammal" });

      await s.pruneAuditOlderThan(90, NOW);

      expect((await s.listAudit()).map((e) => e.kind)).toEqual(["trasig"]);
    });

    it("rapporterar antal raderade och är idempotent", async () => {
      const s = new MemoryStore();
      await s.appendAudit({ at: daysAgo(200), kind: "gammal" });
      await s.appendAudit({ at: daysAgo(2), kind: "farsk" });

      expect(await s.pruneAuditOlderThan(90, NOW)).toBe("1 rader");
      expect(await s.pruneAuditOlderThan(90, NOW)).toBe("0 rader");
      expect(await s.listAudit()).toHaveLength(1);
    });

    it("rör ingenting när allt ryms i fönstret", async () => {
      const s = new MemoryStore();
      await s.appendAudit({ at: daysAgo(3), kind: "a" });
      await s.appendAudit({ at: daysAgo(4), kind: "b" });

      expect(await s.pruneAuditOlderThan(90, NOW)).toBe("0 rader");
      expect(await s.listAudit()).toHaveLength(2);
    });
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
