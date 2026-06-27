// lib/webhook-email-dedup.ts
//
// Idempotens-vakt för webhook-utlösta transaktionsmejl som INTE redan har en
// egen dedup (refund + order_cancelled). Wix levererar "at-least-once" och
// fyrar ibland samma event flera gånger → utan vakt skickade vi refund-/
// avboknings-mejlet en gång per fyrning. Speglar lib/order-confirmation-dedup.
//
// Nyckeln (event_key) sätts av anroparen och MÅSTE vara stabil per logiskt
// event men UNIK mellan olika event:
//   - refund:        `refund:<refundId>`  (INTE order-id — en order kan ha
//                    flera legitima delvis-refunds; varje refund har eget id).
//   - cancellation:  `cancel:<orderId>`   (en order avbokas en gång).
//
// Design: atomiskt anspråk via INSERT ... ON CONFLICT DO NOTHING RETURNING.
// Vinner vi raden → först → SKICKA. Förlorar vi → redan skickat → HOPPA.
// Misslyckas mejlet släpper anroparen anspråket (release) så en Wix-retry kan
// ta över. Fail-open vid DB-fel: hellre ett (ev. dubbelt) mejl än ett tappat.

import { sql } from "./db";

let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS webhook_email_sent (
          event_key TEXT PRIMARY KEY,
          sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
    })().catch((e) => {
      ensured = null; // tillåt retry vid nästa anrop
      throw e;
    });
  }
  return ensured;
}

/** Atomiskt anspråk på att skicka mejlet för `eventKey`.
 *  true  = vi vann → SKICKA.  false = redan skickat (dubblett) → HOPPA.
 *  Fail-open (true) vid DB-fel så ett mejl aldrig tappas pga infra. */
export async function claimWebhookEmail(eventKey: string): Promise<boolean> {
  if (!eventKey) return true;
  try {
    await ensureTable();
    const { rows } = await sql/*sql*/`
      INSERT INTO webhook_email_sent (event_key)
      VALUES (${eventKey})
      ON CONFLICT (event_key) DO NOTHING
      RETURNING event_key
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[webhook-email-dedup] claim misslyckades (fail-open → skickar)", err instanceof Error ? err.message : err);
    return true;
  }
}

/** Släpper ett anspråk (anropas när mejlet faktiskt misslyckades) så att en
 *  efterföljande Wix-retry kan vinna anspråket och skicka mejlet. */
export async function releaseWebhookEmail(eventKey: string): Promise<void> {
  if (!eventKey) return;
  try {
    await sql/*sql*/`DELETE FROM webhook_email_sent WHERE event_key = ${eventKey}`;
  } catch (err) {
    console.error("[webhook-email-dedup] release misslyckades", err instanceof Error ? err.message : err);
  }
}
