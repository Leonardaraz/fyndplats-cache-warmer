import type { Store } from "@/lib/store";
import type { FulfillmentTask } from "./types";
import { isTerminal } from "./status";

/**
 * F19 — delad cancel/flag-logik för EN order. EN sanning, återanvänd av både
 * /api/orders/cancel (admin per-task) och /api/wix-order (Wix cancel/refund-event).
 *
 * Designprinciper (verifierade i design- + implementations-auditen, "inget får bli fel"
 * = riktiga pengar):
 *  • Terminal (shipped/cancelled) → idempotent no-op innan någon skrivning (terminal är
 *    monotont; dubbel-event tål det). OBS: setTaskStatus asserterar INTE — terminal-grinden
 *    finns för idempotens, inte för att undvika ett kast.
 *  • TOCTOU mot orderläggningen: vi beslutar ALDRIG på den (potentiellt stale) snapshot:en.
 *    cancelTaskIfFree är en CAS med SAMMA villkor som claimTask → cancel och orderläggning
 *    utesluter varandra. "blocked" → läs om FÄRSKT och avgör (avbeställ + AE-larm om order
 *    finns; annars flagga cancelMidOrder — place-order äger tasken tills den skriver utfall).
 *  • AE-manuellt-larm baseras på Boolean(aliexpressOrderId) — INTE status==="ordered"
 *    (en pending_payment-task kan redan ha ett aliexpressOrderId).
 */

export type CancelOutcome = "cancelled" | "terminal-noop" | "mid-order-flagged";

export interface CancelOneResult {
  outcome: CancelOutcome;
  /** Kunden behöver återbetalas (en AE-order/kostnad fanns redan). */
  refundRequired: boolean;
  /** AE-ordern måste avbeställas MANUELLT på AliExpress (DS-API saknar pålitlig cancel). */
  manualAliexpressCancelRequired: boolean;
  /** AE trade-order-id när en sådan finns (för larm/UI). */
  aliexpressOrderId?: string;
}

async function safeAudit(store: Store, kind: string, ref: string, detail: string): Promise<void> {
  try {
    await store.appendAudit({ at: new Date().toISOString(), kind, ref, detail });
  } catch (e) {
    console.error(`[cancel-task] audit (${kind}) failade för ${ref}:`, e instanceof Error ? e.message : e);
  }
}

/**
 * Avbryter EN task (eller no-op:ar/flaggar enligt reglerna ovan). Kastar aldrig för
 * terminal/mid-order — bara ett oväntat store-fel propagerar (anroparen för bulk
 * fångar per-task).
 */
export async function cancelOneTask(store: Store, task: FulfillmentTask): Promise<CancelOneResult> {
  // 1. Snapshot-terminal → idempotent no-op (terminal är monotont → stale-säkert).
  if (isTerminal(task.status)) {
    return { outcome: "terminal-noop", refundRequired: false, manualAliexpressCancelRequired: false };
  }

  // 2. ATOMISK CAS: avbryt BARA om varken claimad eller redan beställd. Stänger TOCTOU:n
  //    mot en parallell orderläggning — vi kan inte klobbra en task place-order just hunnit
  //    claima (den gamla snapshot-baserade grenvalsmetoden gjorde det).
  const cas = await store.cancelTaskIfFree(task.taskId);
  if (cas === "applied") {
    await safeAudit(store, "cancel", task.taskId, "task avbruten");
    return { outcome: "cancelled", refundRequired: false, manualAliexpressCancelRequired: false };
  }
  if (cas === "not-found") {
    return { outcome: "terminal-noop", refundRequired: false, manualAliexpressCancelRequired: false };
  }

  // 3. "blocked": claimad ELLER redan beställd. Läs om FÄRSKT (aldrig på snapshot:en) och avgör.
  const fresh = (await store.listTasks()).find((t) => t.taskId === task.taskId);
  if (!fresh || isTerminal(fresh.status)) {
    return { outcome: "terminal-noop", refundRequired: false, manualAliexpressCancelRequired: false };
  }
  if (fresh.aliexpressOrderId) {
    // Order redan lagd (aliexpressOrderId skrivs SIST av place-order → place-order är klar).
    // Avbryt + larma för MANUELL AE-avbeställning.
    await store.setTaskStatus(task.taskId, "cancelled");
    await safeAudit(
      store,
      "cancel-manual-ae-required",
      task.taskId,
      `MANUELL AVBESTÄLLNING KRÄVS på AliExpress (order ${fresh.aliexpressOrderId}) + återbetalning till kund — annars skickas/debiteras varan ändå.`,
    );
    return {
      outcome: "cancelled",
      refundRequired: true,
      manualAliexpressCancelRequired: true,
      aliexpressOrderId: fresh.aliexpressOrderId,
    };
  }
  // claimToken satt, ingen aliexpressOrderId → orderläggning pågår → avbryt INTE, flagga.
  // place-order:s post-order-koll fångar samma flagga och avbeställer manuellt vid behov.
  try {
    await store.updateTask(task.taskId, { cancelMidOrder: true, cancelMidOrderAt: new Date().toISOString() });
  } catch (e) {
    console.error(`[cancel-task] kunde inte flagga cancelMidOrder för ${task.taskId}:`, e instanceof Error ? e.message : e);
  }
  await safeAudit(
    store,
    "cancel-mid-order",
    task.taskId,
    "Annullering/återbetalning kom MEDAN orderläggning pågick — ej avbruten. Verifiera på AliExpress om ordern gick igenom och avbeställ vid behov.",
  );
  return { outcome: "mid-order-flagged", refundRequired: false, manualAliexpressCancelRequired: false };
}

export interface CancelOrderSummary {
  cancelled: number;
  terminalSkipped: number;
  midOrderFlagged: number;
  /** AE trade-order-id som kräver manuell avbeställning. */
  manualAeCancels: string[];
}

/**
 * Avbryter ALLA icke-terminala tasks för en order (Wix order.canceled — hel order död).
 * Per-task try/catch: en rads oväntade fel får aldrig tappa de andra. Idempotent
 * (redan cancelled → terminal-noop), tål Wix at-least-once-dubbletter.
 */
export async function cancelTasksForOrder(store: Store, orderId: string): Promise<CancelOrderSummary> {
  const tasks = await store.listTasksByOrderId(orderId);
  const summary: CancelOrderSummary = { cancelled: 0, terminalSkipped: 0, midOrderFlagged: 0, manualAeCancels: [] };
  for (const task of tasks) {
    try {
      const r = await cancelOneTask(store, task);
      if (r.outcome === "cancelled") {
        summary.cancelled++;
        if (r.manualAliexpressCancelRequired && r.aliexpressOrderId) summary.manualAeCancels.push(r.aliexpressOrderId);
      } else if (r.outcome === "terminal-noop") {
        summary.terminalSkipped++;
      } else {
        summary.midOrderFlagged++;
      }
    } catch (e) {
      console.error(`[cancel-task] cancelOneTask(${task.taskId}) failade — fortsätter med övriga:`, e instanceof Error ? e.message : e);
      await safeAudit(store, "cancel-error", task.taskId, e instanceof Error ? e.message : String(e));
    }
  }
  return summary;
}

export interface FlagOrderSummary {
  flagged: number;
  terminalSkipped: number;
}

/**
 * Flaggar ALLA icke-terminala tasks för en order som återbetalda (Wix
 * order_transactions.refund_completed). Avbryter INTE — en återbetalning kan vara
 * delvis och eventet bär inga radnummer, så vi över-avbryter aldrig en skeppningsbar
 * rad. Flaggan visar badge i /admin/queue OCH blockerar orderläggning (place-order
 * vägrar en refundFlagged task) tills Leonard granskat → död order kan aldrig
 * köpas/läggas, ingen giltig rad dödas av misstag. Idempotent.
 */
export async function flagTasksForOrderRefund(store: Store, orderId: string): Promise<FlagOrderSummary> {
  const tasks = await store.listTasksByOrderId(orderId);
  const summary: FlagOrderSummary = { flagged: 0, terminalSkipped: 0 };
  for (const task of tasks) {
    if (isTerminal(task.status)) {
      summary.terminalSkipped++;
      continue;
    }
    if (task.refundFlagged) continue; // idempotent
    try {
      await store.updateTask(task.taskId, { refundFlagged: true, refundFlaggedAt: new Date().toISOString() });
      await safeAudit(
        store,
        "refund-flagged",
        task.taskId,
        task.aliexpressOrderId
          ? `Återbetalning registrerad — AE-order ${task.aliexpressOrderId} finns redan: avbeställ MANUELLT på AliExpress vid behov.`
          : "Återbetalning registrerad — orderläggning blockerad tills manuell granskning.",
      );
      summary.flagged++;
    } catch (e) {
      console.error(`[cancel-task] kunde inte flagga refund för ${task.taskId} — fortsätter:`, e instanceof Error ? e.message : e);
      await safeAudit(store, "refund-flag-error", task.taskId, e instanceof Error ? e.message : String(e));
    }
  }
  return summary;
}
