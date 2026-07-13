// Ordervakten ("morgonkollen") — ren beslutslogik för /api/cron/order-guard.
//
// Problemet vakten löser: varje steg i orderkedjan kan fastna TYST. Webhooken
// kan missa en order (ingen task skapas), Leonard kan missa att lägga/betala
// en AliExpress-order, säljaren kan strunta i att skicka, och poll-tracking-
// fel syns bara i FyndplatsAudit som ingen läser. Vakten samlar allt sådant
// till ETT morgonmejl — och skickar även när allt är grönt, så att uteblivet
// mejl i sig är en signal om att cronen dött.
//
// Ren modul utan I/O: routen matar in ordrar/tasks/audit-rader och får
// tillbaka fynd + färdigt mejl. Trösklarna är exporterade så testerna kan
// låsa dem.

import type { FulfillmentTask } from "@/lib/orders/types";
import { isTerminal } from "@/lib/orders/status";

const HOUR = 60 * 60 * 1000;

/** Webhooken får 2 h på sig att skapa tasks innan en order räknas som tappad
 *  (Wix gör retries i upp till någon timme vid 5xx från mottagaren). */
export const TASK_GRACE_MS = 2 * HOUR;
/** En obeställd task äldre än ett dygn ⇒ påminn Leonard att lägga ordern. */
export const PENDING_REMINDER_MS = 24 * HOUR;
/** En olagd betalning äldre än 6 h ⇒ påminn — AliExpress annullerar obetalda
 *  ordrar efter ~24 h, så här får inte gå dagar. */
export const PENDING_PAYMENT_REMINDER_MS = 6 * HOUR;
/** Beställd hos AliExpress men inget spårningsnummer på 5 dagar ⇒ säljaren
 *  är sen (normalt åtagande är 3–7 dagar) — värt att titta på. */
export const AWAITING_SHIPMENT_MS = 5 * 24 * HOUR;
/** Poll-tracking-fel räknas inom det senaste dygnet (vakten kör dagligen). */
export const POLL_ERROR_WINDOW_MS = 24 * HOUR;

/** Betalstatusar där kunden faktiskt betalat och en leverans förväntas.
 *  FULLY_REFUNDED/NOT_PAID/PENDING ger ingen fulfillment-plikt. */
const ACTIONABLE_PAYMENT = new Set(["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED"]);

/** Minimal orderbild — mappas från lib/wix/orders.fetchOrders i routen. */
export interface GuardOrderInput {
  id: string;
  number?: string;
  createdAt?: string;
  paymentStatus?: string;
}

/** Minimal audit-rad (matchar lib/store AuditEntry). */
export interface GuardAuditInput {
  at: string;
  kind: string;
  ref?: string;
  detail?: string;
}

export interface PollErrorGroup {
  ref: string;
  count: number;
  lastAt: string;
  lastDetail: string;
}

export interface GuardFindings {
  /** Betalda ordrar helt utan fulfillment-task — webhooken har tappat dem. */
  missingTasks: GuardOrderInput[];
  /** pending äldre än PENDING_REMINDER_MS — dags att lägga AliExpress-ordern. */
  placeOrderReminders: FulfillmentTask[];
  /** pending_payment äldre än PENDING_PAYMENT_REMINDER_MS — dags att betala. */
  payReminders: FulfillmentTask[];
  /** ordered utan spårningsnummer äldre än AWAITING_SHIPMENT_MS. */
  awaitingShipment: FulfillmentTask[];
  /** Flaggade för manuell granskning (cancelMidOrder/refundFlagged/orderUncertain). */
  heldForReview: FulfillmentTask[];
  /** poll-tracking-error-rader senaste dygnet, grupperade per task. */
  pollErrors: PollErrorGroup[];
  /** Antal saker som kräver Leonards handling (styr ✅/⚠️ i mejlet). */
  actionCount: number;
}

export function buildGuardFindings(input: {
  orders: GuardOrderInput[];
  tasks: FulfillmentTask[];
  auditEntries: GuardAuditInput[];
  nowMs: number;
}): GuardFindings {
  const { orders, tasks, auditEntries, nowMs } = input;

  const orderIdsWithTasks = new Set(tasks.map((t) => t.orderId));
  const missingTasks = orders.filter((o) => {
    if (!ACTIONABLE_PAYMENT.has(o.paymentStatus ?? "")) return false;
    const created = o.createdAt ? Date.parse(o.createdAt) : NaN;
    if (!Number.isFinite(created) || nowMs - created < TASK_GRACE_MS) return false;
    return !orderIdsWithTasks.has(o.id);
  });

  const isFlagged = (t: FulfillmentTask) =>
    Boolean(t.cancelMidOrder || t.refundFlagged || t.orderUncertain);
  const olderThan = (t: FulfillmentTask, ms: number) => {
    const created = Date.parse(t.createdAt);
    return Number.isFinite(created) && nowMs - created >= ms;
  };

  // Flaggade tasks listas BARA under "kräver granskning" (inte dubbelt som
  // beställnings-/betalpåminnelse — granskningen ska ske först).
  const heldForReview = tasks.filter((t) => isFlagged(t) && !isTerminal(t.status));
  const unflagged = tasks.filter((t) => !isFlagged(t));

  const placeOrderReminders = unflagged.filter(
    (t) => t.status === "pending" && olderThan(t, PENDING_REMINDER_MS),
  );
  const payReminders = unflagged.filter(
    (t) => t.status === "pending_payment" && olderThan(t, PENDING_PAYMENT_REMINDER_MS),
  );
  const awaitingShipment = unflagged.filter(
    (t) => t.status === "ordered" && !t.trackingNumber && olderThan(t, AWAITING_SHIPMENT_MS),
  );

  const groups = new Map<string, PollErrorGroup>();
  for (const entry of auditEntries) {
    if (entry.kind !== "poll-tracking-error") continue;
    const at = Date.parse(entry.at);
    if (!Number.isFinite(at) || nowMs - at > POLL_ERROR_WINDOW_MS) continue;
    const ref = entry.ref || "okänd task";
    const cur = groups.get(ref);
    if (!cur) {
      groups.set(ref, { ref, count: 1, lastAt: entry.at, lastDetail: entry.detail ?? "" });
    } else {
      cur.count++;
      if (entry.at > cur.lastAt) {
        cur.lastAt = entry.at;
        cur.lastDetail = entry.detail ?? "";
      }
    }
  }
  const pollErrors = [...groups.values()].sort((a, b) => b.count - a.count);

  const actionCount =
    missingTasks.length +
    placeOrderReminders.length +
    payReminders.length +
    awaitingShipment.length +
    heldForReview.length +
    pollErrors.length;

  return {
    missingTasks,
    placeOrderReminders,
    payReminders,
    awaitingShipment,
    heldForReview,
    pollErrors,
    actionCount,
  };
}

/** Hopsummering av dygnets aliexpress-sync-run-audit-rader (detail är JSON). */
export interface SyncRollup {
  runs: number;
  checked: number;
  flaggedPrice: number;
  flaggedContent: number;
  hidden: number;
  markedOos: number;
  restored: number;
  errors: number;
}

export function rollupSyncRuns(auditEntries: GuardAuditInput[], nowMs: number): SyncRollup {
  const rollup: SyncRollup = {
    runs: 0, checked: 0, flaggedPrice: 0, flaggedContent: 0,
    hidden: 0, markedOos: 0, restored: 0, errors: 0,
  };
  for (const entry of auditEntries) {
    if (entry.kind !== "aliexpress-sync-run") continue;
    const at = Date.parse(entry.at);
    if (!Number.isFinite(at) || nowMs - at > 24 * HOUR) continue;
    rollup.runs++;
    try {
      const d = JSON.parse(entry.detail ?? "{}") as Partial<Record<keyof SyncRollup, number>>;
      rollup.checked += d.checked ?? 0;
      rollup.flaggedPrice += d.flaggedPrice ?? 0;
      rollup.flaggedContent += d.flaggedContent ?? 0;
      rollup.hidden += d.hidden ?? 0;
      rollup.markedOos += d.markedOos ?? 0;
      rollup.restored += d.restored ?? 0;
      rollup.errors += d.errors ?? 0;
    } catch {
      // trasig detail-JSON — räkna körningen men hoppa siffrorna
    }
  }
  return rollup;
}

export interface GuardExtras {
  syncRollup?: SyncRollup;
  openAlerts?: number;
  auction?: { live: number; queued: number };
  /** Datakällor som inte gick att läsa (vakten larmar hellre än döljer). */
  sectionErrors: string[];
  baseUrl: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtAge(nowMs: number, iso?: string): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return "okänd ålder";
  const h = Math.floor((nowMs - t) / HOUR);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} dagar`;
}

function taskLine(t: FulfillmentTask, nowMs: number): string {
  return `${t.productName || t.taskId} — order ${t.orderNumber || t.orderId} (${fmtAge(nowMs, t.createdAt)})`;
}

/** Bygger morgonmejlet. Skickas ALLTID — grönt mejl är kvittot på att vakten
 *  lever; uteblivet mejl betyder att cronen själv har problem. */
export function buildGuardEmail(
  findings: GuardFindings,
  extras: GuardExtras,
  nowMs: number,
): { subject: string; html: string; text: string } {
  const issues = findings.actionCount + (extras.sectionErrors.length > 0 ? 1 : 0);
  const subject = issues === 0
    ? "✅ Fyndplats morgonkoll: allt rullar"
    : `⚠️ Fyndplats morgonkoll: ${issues} ${issues === 1 ? "sak" : "saker"} behöver dig`;

  const html: string[] = [];
  const text: string[] = [];
  const section = (titleHtml: string, itemsHtml: string[], titleText: string, itemsText: string[]) => {
    html.push(`<h3 style="margin:18px 0 6px;font-size:15px;">${titleHtml}</h3>`);
    html.push(`<ul style="margin:0;padding-left:20px;font-size:13px;">${itemsHtml.join("")}</ul>`);
    text.push("", titleText, ...itemsText.map((l) => `  - ${l}`));
  };
  const li = (s: string) => `<li>${esc(s)}</li>`;

  if (findings.missingTasks.length > 0) {
    section(
      `🚨 Betalda ordrar UTAN leverans-task (${findings.missingTasks.length})`,
      findings.missingTasks.map((o) =>
        li(`Order ${o.number || o.id} (${fmtAge(nowMs, o.createdAt)}) — ingen task skapades. Kolla ordern i Wix och lägg AliExpress-ordern manuellt.`),
      ),
      `BETALDA ORDRAR UTAN TASK (${findings.missingTasks.length}):`,
      findings.missingTasks.map((o) => `Order ${o.number || o.id} (${fmtAge(nowMs, o.createdAt)})`),
    );
  }
  if (findings.heldForReview.length > 0) {
    section(
      `⚠️ Kräver manuell granskning (${findings.heldForReview.length})`,
      findings.heldForReview.map((t) => {
        const why = [
          t.cancelMidOrder ? "annullering mitt i orderläggning" : null,
          t.refundFlagged ? "återbetalning registrerad" : null,
          t.orderUncertain ? "osäkert orderutfall" : null,
        ].filter(Boolean).join(", ");
        return li(`${taskLine(t, nowMs)} — ${why}. Hanteras i /admin.`);
      }),
      `KRÄVER GRANSKNING (${findings.heldForReview.length}):`,
      findings.heldForReview.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.payReminders.length > 0) {
    section(
      `💳 AliExpress-ordrar som väntar på BETALNING (${findings.payReminders.length})`,
      findings.payReminders.map((t) =>
        li(`${taskLine(t, nowMs)} — obetald AliExpress-order annulleras av dem efter ~24 h!`),
      ),
      `VÄNTAR PÅ BETALNING (${findings.payReminders.length}):`,
      findings.payReminders.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.placeOrderReminders.length > 0) {
    section(
      `🛒 Ordrar som väntar på att läggas hos AliExpress (${findings.placeOrderReminders.length})`,
      findings.placeOrderReminders.map((t) => li(taskLine(t, nowMs))),
      `VÄNTAR PÅ ORDERLÄGGNING (${findings.placeOrderReminders.length}):`,
      findings.placeOrderReminders.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.awaitingShipment.length > 0) {
    section(
      `📦 Beställda men inte skickade på 5+ dagar (${findings.awaitingShipment.length})`,
      findings.awaitingShipment.map((t) =>
        li(`${taskLine(t, nowMs)} — säljaren är sen, kolla ordern på AliExpress.`),
      ),
      `EJ SKICKADE 5+ DAGAR (${findings.awaitingShipment.length}):`,
      findings.awaitingShipment.map((t) => taskLine(t, nowMs)),
    );
  }
  if (findings.pollErrors.length > 0) {
    section(
      `🔁 Spårningsfel senaste dygnet (${findings.pollErrors.length} tasks)`,
      findings.pollErrors.map((g) =>
        li(`${g.ref}: ${g.count} fel, senaste: ${g.lastDetail.slice(0, 160)}`),
      ),
      `SPÅRNINGSFEL SENASTE DYGNET (${findings.pollErrors.length}):`,
      findings.pollErrors.map((g) => `${g.ref}: ${g.count} fel`),
    );
  }
  if (extras.sectionErrors.length > 0) {
    section(
      `🛑 Vakten kunde inte läsa alla källor (${extras.sectionErrors.length})`,
      extras.sectionErrors.map((e) => li(e)),
      `VAKTEN KUNDE INTE LÄSA (${extras.sectionErrors.length}):`,
      extras.sectionErrors,
    );
  }

  if (issues === 0) {
    html.push(
      `<p style="margin:0 0 12px;font-size:14px;">Inga fastnade ordrar, inga obetalda AliExpress-ordrar, inga spårningsfel. Ingen åtgärd behövs.</p>`,
    );
    text.push("Inga fastnade ordrar, inga obetalda AliExpress-ordrar, inga spårningsfel.");
  }

  // Statusrad — alltid med, som kvitto på att alla system rapporterar.
  const statusBits: string[] = [];
  if (extras.syncRollup) {
    const s = extras.syncRollup;
    statusBits.push(
      `Synken: ${s.runs} körningar, ${s.checked} produkter kollade` +
        (s.markedOos ? `, ${s.markedOos} satta slut-i-lager` : "") +
        (s.hidden ? `, ${s.hidden} dolda` : "") +
        (s.errors ? `, ${s.errors} fel` : ""),
    );
  }
  if (extras.openAlerts !== undefined && extras.openAlerts > 0) {
    statusBits.push(`${extras.openAlerts} öppna sync-larm väntar på beslut`);
  }
  if (extras.auction) {
    statusBits.push(`Fyndauktionen: ${extras.auction.live} live, ${extras.auction.queued} i kö`);
  }
  if (statusBits.length > 0) {
    html.push(
      `<p style="margin:18px 0 0;padding:10px 12px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#374151;">${statusBits.map(esc).join(" · ")}</p>`,
    );
    text.push("", ...statusBits);
  }

  html.push(
    `<p style="margin:18px 0 0;"><a href="${extras.baseUrl}/admin" style="display:inline-block;background:#F47A35;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;">Öppna admin</a></p>`,
  );
  text.push("", `Admin: ${extras.baseUrl}/admin`);

  return { subject, html: html.join("\n"), text: text.join("\n").trim() };
}
