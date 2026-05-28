import { NextResponse } from "next/server";
import { parseWebhookBody } from "@/lib/orders/webhook";
import { deriveTasks, normalizeOrderEvent } from "@/lib/orders/tasks";
import { getMemoryStore } from "@/lib/store/memory";

// Wix eCom Order-webhook. Verifierar signatur (om publik nyckel finns),
// avduplicerar på event-id (idempotens) och skapar en fulfillment-task per
// orderrad. Returnerar alltid 200 vid giltig men redan sedd händelse så att
// Wix inte fortsätter göra retries.
export async function POST(req: Request) {
  const raw = await req.text();
  const publicKey = process.env.WIX_WEBHOOK_PUBLIC_KEY;

  const parsed = parseWebhookBody(raw, publicKey);
  if (!parsed) {
    return NextResponse.json({ error: "Ogiltig eller osignerad webhook" }, { status: 401 });
  }

  const event = normalizeOrderEvent(parsed);
  if (!event) {
    return NextResponse.json({ error: "Kunde inte tolka orderhändelse" }, { status: 422 });
  }

  const store = getMemoryStore();

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

  return NextResponse.json({ ok: true, orderId: event.orderId, tasksCreated: created });
}
