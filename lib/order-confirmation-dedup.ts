// lib/order-confirmation-dedup.ts
// Idempotens-vakt för orderbekräftelse-mejlet (app/api/wix-webhook).
//
// Problem: Wix fyrar order-eventet FLERA gånger för samma order — slug "created"
// OCH "approved" klassas båda som order_created, plus Wix at-least-once-retries.
// Utan vakt skickade webhooken en orderbekräftelse per fyrning → kunden fick
// dubbla mejl. (Leverans-mejlet har redan motsvarande vakt via tracking_mapping.)
//
// Design: atomiskt anspråk på orderns GUID via INSERT ... ON CONFLICT DO NOTHING
// RETURNING. Vinner vi raden (RETURNING gav en rad) → vi är först → skicka.
// Förlorar vi (rad fanns redan) → någon har redan skickat → hoppa. Misslyckas
// själva mejlet SLÄPPER anroparen anspråket (releaseOrderConfirmation) så att en
// Wix-retry kan ta över och skicka — ingen bekräftelse går förlorad. Fail-open
// vid DB-fel: hellre ett (eventuellt dubbelt) mejl än ett tappat.

import { sql } from "./db";

let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS order_confirmation_sent (
          order_id     TEXT PRIMARY KEY,
          order_number TEXT,
          sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
    })().catch((e) => {
      ensured = null; // tillåt retry vid nästa anrop
      throw e;
    });
  }
  return ensured;
}

/** Atomiskt anspråk på att skicka orderbekräftelsen för `orderId`.
 *  true  = vi vann anspråket → SKICKA mejlet.
 *  false = redan skickat/anspråkat (dubblett) → HOPPA.
 *  Fail-open (true) vid DB-fel så en bekräftelse aldrig tappas pga infra. */
export async function claimOrderConfirmation(orderId: string, orderNumber?: string): Promise<boolean> {
  if (!orderId) return true;
  try {
    await ensureTable();
    const { rows } = await sql/*sql*/`
      INSERT INTO order_confirmation_sent (order_id, order_number)
      VALUES (${orderId}, ${orderNumber ?? null})
      ON CONFLICT (order_id) DO NOTHING
      RETURNING order_id
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[order-dedup] claim misslyckades (fail-open → skickar)", err instanceof Error ? err.message : err);
    return true;
  }
}

/** Släpper ett anspråk (anropas när mejlet faktiskt misslyckades) så att en
 *  efterföljande Wix-retry kan vinna anspråket och skicka bekräftelsen. */
export async function releaseOrderConfirmation(orderId: string): Promise<void> {
  if (!orderId) return;
  try {
    await sql/*sql*/`DELETE FROM order_confirmation_sent WHERE order_id = ${orderId}`;
  } catch (err) {
    console.error("[order-dedup] release misslyckades", err instanceof Error ? err.message : err);
  }
}
