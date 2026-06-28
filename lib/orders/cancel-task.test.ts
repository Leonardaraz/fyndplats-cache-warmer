import { describe, expect, it } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import type { FulfillmentTask } from "./types";
import { cancelOneTask, cancelTasksForOrder, flagTasksForOrderRefund } from "./cancel-task";

function task(patch: Partial<FulfillmentTask> = {}): FulfillmentTask {
  return {
    taskId: "o1:l1", orderId: "o1", orderNumber: "100", lineItemId: "l1", productName: "X",
    wixCatalogItemId: "wix-1", variantChoices: {}, quantity: 1, status: "pending",
    createdAt: new Date().toISOString(),
    shippingAddress: { fullName: "A B", addressLine1: "Gata 1", city: "Sthlm", postalCode: "11122", country: "SE" },
    ...patch,
  };
}
async function seed(...tasks: FulfillmentTask[]) {
  const store = new MemoryStore();
  for (const t of tasks) await store.upsertTask(t);
  return store;
}
const get = async (store: MemoryStore, id = "o1:l1") => (await store.listTasks()).find((t) => t.taskId === id);

describe("cancelOneTask", () => {
  it("pending → cancelled, ingen AE-order (ingen återbetalning/AE-larm)", async () => {
    const store = await seed(task());
    const r = await cancelOneTask(store, (await get(store))!);
    expect(r.outcome).toBe("cancelled");
    expect(r.refundRequired).toBe(false);
    expect(r.manualAliexpressCancelRequired).toBe(false);
    expect((await get(store))?.status).toBe("cancelled");
  });

  it("terminal (shipped/cancelled) → no-op FÖRE assert (kastar inte, ändrar inte status)", async () => {
    for (const status of ["shipped", "cancelled"] as const) {
      const store = await seed(task({ status }));
      const r = await cancelOneTask(store, (await get(store))!);
      expect(r.outcome).toBe("terminal-noop");
      expect((await get(store))?.status).toBe(status);
    }
  });

  it("AE-larm baseras på aliexpressOrderId — fångar pending_payment (B6)", async () => {
    // pending_payment MED aliexpressOrderId: gamla status==="ordered"-villkoret missade detta.
    const store = await seed(task({ status: "pending_payment", aliexpressOrderId: "AE-1" }));
    const r = await cancelOneTask(store, (await get(store))!);
    expect(r.outcome).toBe("cancelled");
    expect(r.manualAliexpressCancelRequired).toBe(true);
    expect(r.refundRequired).toBe(true);
    expect(r.aliexpressOrderId).toBe("AE-1");
    const audits = await store.listAudit();
    expect(audits.some((a) => a.kind === "cancel-manual-ae-required")).toBe(true);
  });

  it("orderläggning pågår (claimToken satt, ingen AE-order) → flaggas, avbryts INTE", async () => {
    const store = await seed(task({ claimToken: "tok" }));
    const r = await cancelOneTask(store, (await get(store))!);
    expect(r.outcome).toBe("mid-order-flagged");
    const t = await get(store);
    expect(t?.status).toBe("pending"); // EJ cancelled
    expect(t?.cancelMidOrder).toBe(true);
  });

  it("TOCTOU: snapshot ser oclaimad, men en claim landade efteråt → CAS blockerar, flaggas (klobbrar EJ)", async () => {
    // Stale snapshot (utan claimToken) speglar att cancelTasksForOrder läste tasken EN gång
    // innan place-order claimade. cancelTaskIfFree (CAS mot färskt store-state) ska då blockera
    // → re-read ser claimToken → mid-order-flagged, INTE en ovillkorlig cancelled-skrivning.
    const store = await seed(task()); // pending, oclaimad i store
    const staleSnapshot = (await get(store))!; // utan claimToken
    await store.claimTask("o1:l1", "tok"); // claim landar EFTER snapshot lästes
    const r = await cancelOneTask(store, staleSnapshot);
    expect(r.outcome).toBe("mid-order-flagged");
    expect((await get(store))?.status).toBe("pending"); // EJ klobbrad till cancelled
    expect((await get(store))?.cancelMidOrder).toBe(true);
  });
});

describe("cancelTasksForOrder", () => {
  it("avbryter alla icke-terminala rader, hoppar terminala, samlar AE-larm", async () => {
    const store = await seed(
      task({ taskId: "o1:a", lineItemId: "a", status: "pending" }),
      task({ taskId: "o1:b", lineItemId: "b", status: "ordered", aliexpressOrderId: "AE-B" }),
      task({ taskId: "o1:c", lineItemId: "c", status: "shipped" }),
      task({ taskId: "o2:x", orderId: "o2", lineItemId: "x", status: "pending" }), // annan order — orörd
    );
    const s = await cancelTasksForOrder(store, "o1");
    expect(s.cancelled).toBe(2);
    expect(s.terminalSkipped).toBe(1);
    expect(s.manualAeCancels).toEqual(["AE-B"]);
    expect((await get(store, "o1:a"))?.status).toBe("cancelled");
    expect((await get(store, "o1:c"))?.status).toBe("shipped");
    expect((await get(store, "o2:x"))?.status).toBe("pending"); // annan order intakt
  });

  it("idempotent vid dubbel-event (andra körningen: 0 avbrutna, inga kast)", async () => {
    const store = await seed(task());
    await cancelTasksForOrder(store, "o1");
    const second = await cancelTasksForOrder(store, "o1");
    expect(second.cancelled).toBe(0);
    expect(second.terminalSkipped).toBe(1);
  });
});

describe("flagTasksForOrderRefund", () => {
  it("flaggar icke-terminala rader, avbryter dem INTE, hoppar terminala", async () => {
    const store = await seed(
      task({ taskId: "o1:a", lineItemId: "a", status: "pending" }),
      task({ taskId: "o1:b", lineItemId: "b", status: "ordered", aliexpressOrderId: "AE-B" }),
      task({ taskId: "o1:c", lineItemId: "c", status: "shipped" }),
    );
    const s = await flagTasksForOrderRefund(store, "o1");
    expect(s.flagged).toBe(2);
    expect(s.terminalSkipped).toBe(1);
    const a = await get(store, "o1:a");
    expect(a?.refundFlagged).toBe(true);
    expect(a?.status).toBe("pending"); // EJ avbruten
    expect((await get(store, "o1:b"))?.refundFlagged).toBe(true);
    expect((await get(store, "o1:c"))?.refundFlagged).toBeUndefined();
  });

  it("idempotent (redan flaggad → andra körningen flaggar 0)", async () => {
    const store = await seed(task());
    await flagTasksForOrderRefund(store, "o1");
    const second = await flagTasksForOrderRefund(store, "o1");
    expect(second.flagged).toBe(0);
  });
});
