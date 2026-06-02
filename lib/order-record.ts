// lib/order-record.ts
// Speglar en inkommen Wix order_created-händelse till vår lokala `orders`-tabell
// så att morgon-dashboarden (app/admin/dashboard) kan visa orderantal, omsättning,
// AOV och topprodukter.
//
// Roll: SKYDDSNÄT, inte primärkälla. Wix Orders-API:t svarar 200 (nyckeln HAR
// Read Orders — verifierat 2026-06-02), så dashboarden läser i första hand
// auktoritativt från Wix (lib/dashboard → tryWixOrders) och faller bara tillbaka
// till den här spegeln om API:t skulle börja neka (t.ex. om behörigheten dras in).
// Spegeln hålls aktuell på två sätt: (1) realtid via order_created-webhooken som
// anropar recordOrder, (2) en daglig sync-cron (lib/order-sync) som fyller i ev.
// missade webhooks mot Wix-API:t.
//
// Best-effort: anropas i wix-webhook-routen. Ett fel här får ALDRIG blockera
// mejlet eller webhook-ack:en — vi loggar och sväljer. Idempotent på order-id
// (ON CONFLICT DO NOTHING) så Wix-retries och sync-cron inte dubbelräknar.

import { sql } from "./db";

/* eslint-disable @typescript-eslint/no-explicit-any */

type RecordedItem = { name: string; qty: number; lineMinor: number };

function moneyMinor(v: unknown): number {
  // Wix-pengar kcommer som { amount: "199.00" } | "199.00" | 199. Vi lagrar i öre.
  if (v == null) return 0;
  if (typeof v === "number") return Math.round(v * 100);
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }
  const o = v as Record<string, unknown>;
  if (o.amount != null) return moneyMinor(o.amount);
  if ((o as any).value != null) return moneyMinor((o as any).value);
  return 0;
}

function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function extractItems(order: Record<string, unknown>): RecordedItem[] {
  const lineItems = (order.lineItems ?? order.items) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((li) => {
    const name =
      firstStr(
        li.productName as string | undefined,
        (li.productName as { original?: string } | undefined)?.original,
        li.name as string | undefined,
      ) ?? "Produkt";
    const qty = Number(li.quantity ?? 1) || 1;
    const unit = moneyMinor(li.price ?? li.priceData ?? li.unitPrice);
    const lineMinor = moneyMinor(
      li.totalPriceAfterTax ?? li.totalPrice ?? li.lineItemTotal,
    ) || unit * qty;
    return { name, qty, lineMinor };
  });
}

/** Plockar order-objektet ur webhook-entiteten (vissa event har { order: {...} }). */
function unwrapOrder(entity: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!entity) return null;
  const order = (entity.order ?? entity) as Record<string, unknown>;
  return order && typeof order === "object" ? order : null;
}

export async function recordOrder(
  entity: Record<string, unknown> | undefined,
): Promise<{ recorded: boolean; inserted?: boolean }> {
  const order = unwrapOrder(entity);
  if (!order) return { recorded: false };

  const id = firstStr(order._id as string, order.id as string, order.number as string, order.orderNumber as string);
  if (!id) return { recorded: false };

  const totals = (order.priceSummary ?? order.totals) as Record<string, unknown> | undefined;
  const totalMinor = moneyMinor(totals?.total ?? (totals as any)?.totalPrice ?? totals?.subtotal);
  const currency =
    firstStr(
      (order.currency as string | undefined),
      ((order.priceSummary as { total?: { currency?: string } } | undefined)?.total?.currency),
    ) ?? "SEK";
  const items = extractItems(order);
  const itemCount = items.reduce((n, it) => n + it.qty, 0);
  const email = firstStr(
    (order.buyerInfo as { email?: string } | undefined)?.email,
    (order.buyer as { email?: string } | undefined)?.email,
  );
  const orderNumber = firstStr(order.number as string, order.orderNumber as string, id);
  const createdIso =
    firstStr(order.createdDate as string, order._createdDate as string, order.dateCreated as string) ??
    new Date().toISOString();

  try {
    const res = await sql/*sql*/`
      INSERT INTO orders (id, order_number, email, total_minor, currency, item_count, items_json, created_at)
      VALUES (
        ${id}, ${orderNumber ?? null}, ${email ?? null}, ${totalMinor}, ${currency},
        ${itemCount}, ${JSON.stringify(items)}::jsonb, ${createdIso}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    // rowCount = 1 vid ny rad, 0 när ordern redan fanns (ON CONFLICT). Sync-cronet
    // använder detta för att skilja faktiskt ifyllda missade ordrar från no-ops.
    return { recorded: true, inserted: (res.rowCount ?? 0) > 0 };
  } catch (err) {
    // Tabellen kanske inte är migrerad än, eller DB nere — logga och svälj.
    console.error("[order-record] kunde inte spegla order", id, err instanceof Error ? err.message : err);
    return { recorded: false };
  }
}
