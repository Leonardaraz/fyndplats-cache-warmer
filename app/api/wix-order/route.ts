import { NextResponse } from "next/server";
import { parseWebhookBody, isTrustedForward } from "@/lib/orders/webhook";
import { classifyWixEvent, deriveTasks, extractCancelOrderId, normalizeOrderEvent } from "@/lib/orders/tasks";
import { cancelTasksForOrder, flagTasksForOrderRefund } from "@/lib/orders/cancel-task";
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
  // emot Wix:s direktanrop och fan-out:ar hit). Forwarden litas på BARA om
  // X-Forwarded-From stämmer OCH — när WEBHOOK_FORWARD_SECRET är satt — en
  // matchande X-Forward-Secret medföljer (annars faller vi tillbaka på
  // JWT-signaturverifiering nedan). Opt-in: utan satt hemlighet = oförändrat.
  const forwardedFrom = req.headers.get("x-forwarded-from");
  const trustedForwarded = isTrustedForward(
    forwardedFrom,
    req.headers.get("x-forward-secret"),
    process.env.WEBHOOK_FORWARD_SECRET,
  );
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

  const store = getStore();

  // F19: gata på (entityFqdn, slug)-PARET FÖRE create-vägen. Wix fyrar cancel som
  // `order.canceled` och refund som `order_transactions.refund_completed` (ALDRIG
  // `order.refunded`). Dessa får ALDRIG gå via normalizeOrderEvent→deriveTasks
  // (cancel-payloaden skulle annars ÅTERSKAPA orderns tasks; refund-payloaden saknar
  // order/lineItems → 422 → Wix retry-storm). Allt annat (created/approved/placed/paid/
  // fulfilled/okänt) faller igenom till den befintliga, oförändrade create-vägen.
  const kind = classifyWixEvent(parsed);
  if (kind === "cancel" || kind === "refund") {
    const eventId = typeof parsed.id === "string" ? parsed.id : "";
    const orderId = extractCancelOrderId(parsed);
    if (!orderId) {
      // Inget order-id → kan inte agera. Ack:a (200) så Wix inte retry-loopar; logga synligt.
      console.warn(`[wix-order] ${kind}-event utan härledbart order-id (eventId=${eventId || "—"}) — ack:ar utan åtgärd`);
      await audit("order", "okänd", `${kind}: inget order-id i eventet — ignorerat`);
      return NextResponse.json({ ok: true, ignored: true, reason: "no-order-id" });
    }
    // Idempotens: samma event-id kan levereras flera gånger. cancel/flag är dessutom
    // idempotenta i sig (terminal-noop / redan-flaggad), så dubbelkörning är ofarlig.
    if (eventId && (await store.hasSeenEvent(eventId))) {
      return NextResponse.json({ ok: true, deduped: true });
    }
    if (kind === "cancel") {
      // Hel-annullering: avbryt alla icke-terminala tasks för ordern (entydigt).
      const summary = await cancelTasksForOrder(store, orderId);
      if (eventId) await store.markEventSeen(eventId);
      await audit(
        "order",
        orderId,
        `cancel: ${summary.cancelled} avbrutna, ${summary.terminalSkipped} terminala, ${summary.midOrderFlagged} flaggade (orderläggning pågick)` +
          (summary.manualAeCancels.length ? ` — MANUELL AE-avbeställning krävs: ${summary.manualAeCancels.join(", ")}` : ""),
      );
      return NextResponse.json({ ok: true, orderId, kind, ...summary });
    }
    // Återbetalning: avbryt INTE (kan vara delvis, inga radnummer) — flagga + blockera
    // orderläggning tills manuell granskning.
    const summary = await flagTasksForOrderRefund(store, orderId);
    if (eventId) await store.markEventSeen(eventId);
    await audit("order", orderId, `refund: ${summary.flagged} flaggade för granskning, ${summary.terminalSkipped} terminala`);
    return NextResponse.json({ ok: true, orderId, kind, ...summary });
  }

  const event = normalizeOrderEvent(parsed);
  if (!event) {
    return NextResponse.json({ error: "Kunde inte tolka orderhändelse" }, { status: 422 });
  }

  // Idempotens: samma event-id kan levereras flera gånger.
  if (await store.hasSeenEvent(event.eventId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Skapa tasks FÖRST, markera event:et sett EFTERÅT. createTaskIfAbsent är
  // idempotent (nyckel `${orderId}:${lineItemId}`), så en omleverans efter en
  // krasch mitt i skapandet återskapar bara saknade tasks utan dubbletter. Om vi
  // (som tidigare) markerade sett före skapandet kunde en krasch däremellan göra
  // att omleveransen dedupp:ades och ordern tappades helt (kund aldrig skickad).
  const tasks = deriveTasks(event);
  let created = 0;
  for (const task of tasks) {
    if (await store.createTaskIfAbsent(task)) created++;
  }
  await store.markEventSeen(event.eventId);

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
