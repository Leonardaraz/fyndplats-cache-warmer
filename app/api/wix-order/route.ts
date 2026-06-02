import { NextResponse } from "next/server";
import { parseWebhookBody } from "@/lib/orders/webhook";
import { deriveTasks, normalizeOrderEvent } from "@/lib/orders/tasks";
import { getStore } from "@/lib/store/factory";
import { audit } from "@/lib/audit";
import { enqueuePriorityCheck } from "@/lib/sync/bestsellers";
import { recordOrder } from "@/lib/import/supplier-tracking";

// Wix eCom Order-webhook. Verifierar signatur (om publik nyckel finns),
// avduplicerar på event-id (idempotens) och skapar en fulfillment-task per
// orderrad. Returnerar alltid 200 vid giltig men redan sedd händelse så att
// Wix inte fortsätter göra retries.
export async function POST(req: Request) {
  const raw = await req.text();
  const publicKey = process.env.WIX_WEBHOOK_PUBLIC_KEY;

  // Forward från fyndplats-headless: signaturen är redan verifierad upstream
  // (Wix tillåter bara EN webhook-subscription per event-type, så headless tar
  // emot Wix:s direktanrop och fan-out:ar hit). När X-Forwarded-From-headern
  // sätts kan vi lita på payloaden utan att kräva WIX_WEBHOOK_PUBLIC_KEY här.
  const forwardedFrom = req.headers.get("x-forwarded-from");
  const trustedForwarded = forwardedFrom === "fyndplats-webhook";
  if (trustedForwarded) {
    console.log(
      `[wix-order] accepting forwarded event from ${forwardedFrom} ` +
        `(event-type=${req.headers.get("x-original-event-type") ?? "?"})`,
    );
  }

  const parsed = parseWebhookBody(raw, publicKey, { trustedForwarded });
  if (!parsed) {
    return NextResponse.json({ error: "Ogiltig eller osignerad webhook" }, { status: 401 });
  }

  const event = normalizeOrderEvent(parsed);
  if (!event) {
    return NextResponse.json({ error: "Kunde inte tolka orderhändelse" }, { status: 422 });
  }

  const store = getStore();

  // Idempotens: samma event-id kan levereras flera gånger.
  if (await store.hasSeenEvent(event.eventId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }
  await store.markEventSeen(event.eventId);

  const tasks = deriveTasks(event);
  let created = 0;
  for (const task of tasks) {
    if (await store.createTaskIfAbsent(task)) created++;
  }

  // Feature 4: bumpa köpta produkter till high-priority sync nästa cron-cykel
  // så lagret kollas direkt efter försäljning. Best-effort — order-flödet får
  // aldrig faila pga detta.
  let enqueued = 0;
  try {
    const productIds = tasks
      .map((t) => t.wixCatalogItemId)
      .filter((id): id is string => Boolean(id));
    enqueued = await enqueuePriorityCheck(store, productIds);
  } catch {
    // ignorerat — prioritering är bäst-möjligt, inte kritiskt
  }

  // Feature 6: registrera sålda enheter per säljare (för säljar-score). supplierId
  // resolvas från produktens mappning inne i recordOrder. Aggregera units per
  // produkt så en orderrad med kvantitet 3 räknas som 3 sålda. Best-effort —
  // säljar-spårningen får aldrig fälla order-flödet.
  try {
    const unitsByProduct = new Map<string, number>();
    for (const t of tasks) {
      if (!t.wixCatalogItemId) continue;
      unitsByProduct.set(
        t.wixCatalogItemId,
        (unitsByProduct.get(t.wixCatalogItemId) ?? 0) + (t.quantity > 0 ? t.quantity : 1),
      );
    }
    for (const [productId, units] of unitsByProduct) {
      await recordOrder(productId, { units }).catch(() => null);
    }
  } catch {
    // ignorerat — säljar-score är bäst-möjligt
  }

  await audit("order", event.orderId, `${created} tasks skapade, ${enqueued} prioriterade`);
  return NextResponse.json({ ok: true, orderId: event.orderId, tasksCreated: created, prioritized: enqueued });
}
