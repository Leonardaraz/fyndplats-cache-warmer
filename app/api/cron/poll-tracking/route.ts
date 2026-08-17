// GET /api/cron/poll-tracking
//
// Körs av Vercel Cron var 15:e minut (se vercel.json). Loopar igenom alla
// fulfillment-tasks som har fått en AliExpress-ordernummer men ännu inte
// ett spårningsnummer, frågar AliExpress DS API efter spårningsnumret, och
// — om det finns — skapar en fulfillment i Wix Stores med trackingnumret.
//
// När Wix-fulfillment skapas triggas wixStores_onFulfillmentCreated i Velo
// → "På väg!"-mejlet skickas + tracking registreras hos 17TRACK automatiskt.
//
// Säkerhet: Vercel sätter `Authorization: Bearer <CRON_SECRET>` om
// CRON_SECRET-env är satt. Vi accepterar den, ELLER en x-fyndplats-token-
// header för manuell körning.

import { NextResponse, type NextRequest } from "next/server";
import { getTracking } from "@/lib/aliexpress/client";
import { createFulfillment } from "@/lib/wix/client";
import { sparningsLank } from "@/lib/tracking-link";
import { getStore } from "@/lib/store/factory";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  // Manuell körning med x-fyndplats-token.
  if (isAuthorized(req)) return true;
  // Vercel Cron Job-secret.
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  // Yttre try/catch: tidigare returnerades tyst 500 utan body när getStore()
  // eller listTasks() throwade, vilket gjorde GitHub Actions-loggen omöjlig
  // att felsöka. Nu serialiseras felet alltid till responsen.
  try {
    // No-op-fallback: om STORE_BACKEND inte är konfigurerat (default = memory)
    // är cronen meningslös eftersom serverless inte har persistens mellan
    // anrop — det finns inga ordered tasks att kolla. Returnera 200 så
    // workflow:n inte alarmerar var 3:e timme i onödan.
    const backend = process.env.STORE_BACKEND ?? "memory";
    if (backend === "memory") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "STORE_BACKEND=memory (default) — cron är no-op utan persistent store",
        checked: 0,
        shipped: 0,
        stillWaiting: 0,
        errors: [],
      });
    }

    const store = getStore();
    const ordered = await store.listTasks("ordered");

    const results: Record<string, unknown> = {
      checked: 0,
      shipped: 0,
      stillWaiting: 0,
      heldForReview: 0,
      errors: [] as string[],
    };

    for (const task of ordered) {
      if (!task.aliexpressOrderId) continue;

      // F19-BACKSTOPP (kritiskt): en task flaggad för manuell granskning får ALDRIG
      // auto-skeppas. En annullering/återbetalning kan ha racat in efter att ordern lagts
      // (status kan då ha klottrats till "ordered" trots flaggan) — skeppning är den
      // oåterkalleliga handlingen, så vi grindar HÄR oavsett hur skriv-racet föll ut.
      // Hålls för manuell hantering i /admin (avbeställ på AliExpress + återbetala).
      if (task.cancelMidOrder || task.refundFlagged || task.orderUncertain) {
        results.heldForReview = (results.heldForReview as number) + 1;
        // Loggas (EJ persisterad audit-rad) — en oåtgärdad flagga skrevs annars varje
        // cron-cykel → obegränsad audit-tillväxt. Själva flaggan persisterades redan när
        // den sattes (cancel-mid-order / refund-flagged / order-uncertain) och syns
        // bestående i /admin "⚠️ Kräver manuell granskning".
        console.warn(
          `[poll-tracking] task ${task.taskId} hålls för granskning (${[
            task.cancelMidOrder ? "cancelMidOrder" : null,
            task.refundFlagged ? "refundFlagged" : null,
            task.orderUncertain ? "orderUncertain" : null,
          ].filter(Boolean).join(", ")}, AE-order ${task.aliexpressOrderId}) — auto-skeppas ej.`,
        );
        continue;
      }

      results.checked = (results.checked as number) + 1;

      try {
        const tracking = await getTracking(task.aliexpressOrderId);
        if (!tracking.trackingNumber) {
          results.stillWaiting = (results.stillWaiting as number) + 1;
          continue;
        }

        // Skicka trackingnumret till Wix Stores → fyrar Velo-eventet →
        // "På väg!"-mejlet + 17TRACK-registrering sker automatiskt.
        //
        // Spårlänken sätts ALLTID av oss. Wix genererar en egen bara för
        // fraktbolag den känner igen, och AE svarar ofta med något annat
        // ("Seller Shipping ES Local" för EU-lagren) — då blev det ingen länk
        // alls i leveransbekräftelsen. Se lib/tracking-link.
        await createFulfillment({
          orderId: task.orderId,
          lineItems: [{ id: task.lineItemId, quantity: task.quantity }],
          trackingNumber: tracking.trackingNumber,
          shippingProvider: tracking.shippingProvider,
          trackingLink: sparningsLank(tracking.trackingNumber),
        });

        await store.updateTask(task.taskId, { status: "shipped", trackingNumber: tracking.trackingNumber });
        await store.appendAudit({
          at: new Date().toISOString(),
          kind: "wix-fulfillment-created",
          ref: task.taskId,
          detail: JSON.stringify({
            orderId: task.orderId,
            trackingNumber: tracking.trackingNumber,
            tradeOrderId: task.aliexpressOrderId,
          }),
        });
        results.shipped = (results.shipped as number) + 1;
      } catch (err) {
        const msg = `${task.taskId}: ${err instanceof Error ? err.message : String(err)}`;
        (results.errors as string[]).push(msg);
        await store.appendAudit({
          at: new Date().toISOString(),
          kind: "poll-tracking-error",
          ref: task.taskId,
          detail: msg.slice(0, 300),
        });
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "Error";
    return NextResponse.json(
      { ok: false, error: `${name}: ${msg}` },
      { status: 500 },
    );
  }
}
