// GET /api/cron/poll-tracking
//
// Körs av Vercel Cron var 3:e timme (se vercel.json). Loopar igenom alla
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

  const store = getStore();
  const ordered = await store.listTasks("ordered");

  const results: Record<string, unknown> = {
    checked: 0,
    shipped: 0,
    stillWaiting: 0,
    errors: [] as string[],
  };

  for (const task of ordered) {
    if (!task.aliexpressOrderId) continue;
    results.checked = (results.checked as number) + 1;

    try {
      const tracking = await getTracking(task.aliexpressOrderId);
      if (!tracking.trackingNumber) {
        results.stillWaiting = (results.stillWaiting as number) + 1;
        continue;
      }

      // Skicka trackingnumret till Wix Stores → fyrar Velo-eventet →
      // "På väg!"-mejlet + 17TRACK-registrering sker automatiskt.
      await createFulfillment({
        orderId: task.orderId,
        lineItems: [{ id: task.lineItemId, quantity: task.quantity }],
        trackingNumber: tracking.trackingNumber,
        shippingProvider: tracking.shippingProvider,
      });

      await store.updateTask(task.taskId, { status: "shipped" });
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
}
