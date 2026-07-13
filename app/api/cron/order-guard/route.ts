// GET /api/cron/order-guard
//
// Ordervakten ("morgonkollen"). Körs dagligen 04:45 UTC via Vercel Cron
// (06:45 Stockholm sommartid) — efter nattens sync-körningar, före Leonards
// morgon. Samlar allt i orderkedjan som fastnat tyst till ETT mejl:
//
//   - Betalda Wix-ordrar utan fulfillment-task (webhooken tappade dem)
//   - Tasks som väntar på orderläggning (>24 h) eller betalning (>6 h —
//     AliExpress annullerar obetalda ordrar efter ~24 h)
//   - Beställda men oskickade i 5+ dagar (sen säljare)
//   - Tasks flaggade för manuell granskning (annullering/återbetalning/osäker)
//   - poll-tracking-fel senaste dygnet (syntes tidigare BARA i FyndplatsAudit)
//   - Status: synk-rollup, öppna sync-larm, auktionens live/kö
//
// Mejlet skickas ÄVEN när allt är grönt — uteblivet morgonmejl är i sig
// larmet om att vakten/cronen dött. Datakällorna läses var för sig
// (best-effort): en trasig källa blir en egen rad i mejlet i stället för
// att tysta hela vakten.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { fetchOrders, isoDaysAgo } from "@/lib/wix/orders";
import { getSyncStore } from "@/lib/sync/sync-log";
import { queryAuctions } from "@/lib/auction/store";
import {
  buildGuardEmail,
  buildGuardFindings,
  rollupSyncRuns,
  type GuardExtras,
  type GuardOrderInput,
} from "@/lib/orders/guard";
import { sendEmail } from "@/lib/email/resend";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Hur långt bak betalda ordrar jämförs mot tasks. Äldre ordrar än så är
 *  antingen levererade eller redan kända problem — inte morgonens nyheter. */
const ORDER_LOOKBACK_DAYS = 14;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  try {
    const backend = process.env.STORE_BACKEND ?? "memory";
    if (backend === "memory") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "STORE_BACKEND=memory — ordervakten kräver persistent store",
      });
    }

    const store = getStore();
    const now = Date.now();
    const sectionErrors: string[] = [];

    // Tasks + audit är vaktens kärna — failar de är hela körningen ett fel
    // (fångas av yttre catch → 500 → syns i Vercel-loggar och GitHub-workflow).
    const tasks = await store.listTasks();
    const auditEntries = await store.listAudit(500);

    // Övriga källor best-effort: en död källa får inte tysta resten.
    let orders: GuardOrderInput[] = [];
    try {
      const raw = await fetchOrders(isoDaysAgo(ORDER_LOOKBACK_DAYS), { maxPages: 5 });
      orders = raw.map((o) => ({
        id: o.id,
        number: o.number,
        createdAt: o._createdDate ?? o.createdDate,
        paymentStatus: o.paymentStatus,
      }));
    } catch (err) {
      sectionErrors.push(`Wix-ordrar gick inte att hämta: ${(err as Error).message.slice(0, 150)}`);
    }

    const extras: GuardExtras = {
      sectionErrors,
      baseUrl: (
        process.env.NEXT_PUBLIC_APP_URL ?? "https://fyndplats-cache-warmer.vercel.app"
      ).replace(/\/$/, ""),
    };
    try {
      extras.syncRollup = rollupSyncRuns(auditEntries, now);
    } catch {
      /* rollup är ren — kan inte kasta; behålls för symmetri */
    }
    try {
      extras.openAlerts = (await getSyncStore().listAlerts("open")).length;
    } catch (err) {
      sectionErrors.push(`Sync-larmen gick inte att räkna: ${(err as Error).message.slice(0, 150)}`);
    }
    try {
      const auctions = await queryAuctions(["live", "queued"]);
      extras.auction = {
        live: auctions.filter((a) => a.status === "live").length,
        queued: auctions.filter((a) => a.status === "queued").length,
      };
    } catch (err) {
      sectionErrors.push(`Auktionsstatus gick inte att läsa: ${(err as Error).message.slice(0, 150)}`);
    }

    const findings = buildGuardFindings({ orders, tasks, auditEntries, nowMs: now });
    const email = buildGuardEmail(findings, extras, now);

    const to =
      process.env.OPS_ALERT_EMAIL
      ?? process.env.HEALTH_ALERT_EMAIL
      ?? "info@fyndplats.com";
    let emailResult: { id?: string; skipped?: string } = {};
    try {
      emailResult = await sendEmail({
        to,
        subject: email.subject,
        bodyHtml: email.html,
        bodyText: email.text,
      });
    } catch (err) {
      emailResult = { skipped: `send-fel: ${(err as Error).message.slice(0, 150)}` };
    }

    const counts = {
      missingTasks: findings.missingTasks.length,
      placeOrderReminders: findings.placeOrderReminders.length,
      payReminders: findings.payReminders.length,
      awaitingShipment: findings.awaitingShipment.length,
      heldForReview: findings.heldForReview.length,
      pollErrorTasks: findings.pollErrors.length,
      sectionErrors: sectionErrors.length,
      email: emailResult.id ? "sent" : emailResult.skipped ?? "unknown",
    };
    await audit("order-guard", "cron", JSON.stringify(counts));

    return NextResponse.json({ ok: true, subject: email.subject, ...counts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
