// lib/delivery-dedup.ts
//
// Delad idempotens-vakt för leverans-/utlämnings-notiser. Två kanaler kan
// vilja mejla kunden om samma paket:
//   1. 17TRACK-push  (app/api/track17-webhook)  — Delivered / OutForDelivery
//   2. Vidarebefordrat carrier-SMS (app/api/sms-inbound) — pickup-kod m.m.
// Utan en GEMENSAM vakt kunde kunden få två "levererat"-mejl (ett per kanal).
//
// Design speglar lib/order-confirmation-dedup: atomiskt anspråk via
// INSERT ... ON CONFLICT DO NOTHING RETURNING. Nyckel = (tracking_number,
// status). Vinner vi raden → vi är först → SKICKA. Förlorar vi → redan skickat
// → HOPPA. Misslyckas själva mejlet släpper anroparen anspråket (release) så
// nästa fyrning/retry kan ta över. Fail-open vid DB-fel: hellre en (möjlig)
// dubblett än ett tappat leveransmejl.

import { sql } from "./db";

let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS delivery_notifications (
          tracking_number TEXT NOT NULL,
          status          TEXT NOT NULL,
          channel         TEXT,
          customer_email  TEXT,
          sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (tracking_number, status)
        );
      `;
    })().catch((e) => {
      ensured = null; // tillåt retry vid nästa anrop
      throw e;
    });
  }
  return ensured;
}

/** Atomiskt anspråk på att skicka EN leveransnotis för (tracking, status).
 *  true  = vi vann → SKICKA.  false = redan skickat (dubblett) → HOPPA.
 *  Fail-open (true) vid DB-fel så en notis aldrig tappas pga infra. */
export async function claimDeliveryNotification(
  trackingNumber: string,
  status: string,
  channel: string,
  customerEmail?: string | null,
): Promise<boolean> {
  if (!trackingNumber || !status) return true;
  try {
    await ensureTable();
    const { rows } = await sql/*sql*/`
      INSERT INTO delivery_notifications (tracking_number, status, channel, customer_email)
      VALUES (${trackingNumber}, ${status}, ${channel}, ${customerEmail ?? null})
      ON CONFLICT (tracking_number, status) DO NOTHING
      RETURNING tracking_number
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[delivery-dedup] claim misslyckades (fail-open → skickar)", err instanceof Error ? err.message : err);
    return true;
  }
}

/** Släpper ett anspråk (anropas när mejlet faktiskt misslyckades) så att en
 *  efterföljande fyrning/retry kan vinna anspråket och skicka notisen. */
export async function releaseDeliveryNotification(trackingNumber: string, status: string): Promise<void> {
  if (!trackingNumber || !status) return;
  try {
    await sql/*sql*/`
      DELETE FROM delivery_notifications WHERE tracking_number = ${trackingNumber} AND status = ${status}
    `;
  } catch (err) {
    console.error("[delivery-dedup] release misslyckades", err instanceof Error ? err.message : err);
  }
}
