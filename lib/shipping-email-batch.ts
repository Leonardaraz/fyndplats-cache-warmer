// lib/shipping-email-batch.ts
//
// Ett fraktmejl per order, inte ett per paket.
//
// Wix skapar en fulfillment per spårningsnummer. En order på två sängramar som
// går i två DPD-paket (order 10051, 2026-09-30) gav därför två "Ditt paket är
// på väg"-mejl några sekunder isär. Nu köas varje nytt spårningsnummer här, och
// mejlet går när ordern är helt skickad, med alla nummer i samma mejl.
//
// Skickas ordern i omgångar (en del i dag, resten senare) blir den aldrig helt
// skickad vid första numret. Då skickar cronen /api/cron/fraktmejl det som
// väntat i minst VANTETID_MIN minuter, så kunden aldrig står utan spårning.
//
// Dedup: tracking_mapping (unik på tracking_number) avgör fortfarande om ett
// nummer är nytt. Kön avgör bara NÄR mejlet går och vilka nummer det bär.
// Anspråket är atomiskt (UPDATE … WHERE sent_at IS NULL RETURNING), så två
// samtidiga webhook-anrop för samma order kan inte båda skicka.

import { sql } from "./db";
import { sandningsRader, slaIhopRader, heltSkickad, type SandningsRad } from "./fraktmejl-rader";

export { sandningsRader, slaIhopRader, heltSkickad };
export type { SandningsRad };

/** Minuter ett nummer får vänta på resten av ordern innan cronen skickar det. */
export const VANTETID_MIN = 30;

export interface KoadSandning {
  trackingNumber: string;
  carrier: string | null;
  lineItems: SandningsRad[];
}

let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS shipping_email_queue (
          tracking_number TEXT PRIMARY KEY,
          order_guid      TEXT NOT NULL,
          carrier         TEXT,
          line_items      JSONB NOT NULL DEFAULT '[]'::jsonb,
          queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          sent_at         TIMESTAMPTZ
        );
      `;
      await sql/*sql*/`
        CREATE INDEX IF NOT EXISTS shipping_email_queue_pending
          ON shipping_email_queue (order_guid) WHERE sent_at IS NULL;
      `;
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}

/** Lägger ett nytt spårningsnummer i kön. false vid DB-fel: anroparen skickar
 *  då mejlet direkt som förr, hellre ett extra mejl än ett tappat. */
export async function koaSandning(orderGuid: string, s: KoadSandning): Promise<boolean> {
  try {
    await ensureTable();
    await sql/*sql*/`
      INSERT INTO shipping_email_queue (tracking_number, order_guid, carrier, line_items)
      VALUES (${s.trackingNumber}, ${orderGuid}, ${s.carrier}, ${JSON.stringify(s.lineItems)}::jsonb)
      ON CONFLICT (tracking_number) DO NOTHING
    `;
    return true;
  } catch (err) {
    console.error("[fraktmejl] kunde inte köa", s.trackingNumber, err instanceof Error ? err.message : err);
    return false;
  }
}

/** Tar atomiskt alla väntande nummer för ordern. Tom lista = inget att skicka
 *  (eller någon annan hann före). */
export async function taVantande(orderGuid: string): Promise<KoadSandning[]> {
  await ensureTable();
  const { rows } = await sql<{ tracking_number: string; carrier: string | null; line_items: SandningsRad[] | string }>/*sql*/`
    UPDATE shipping_email_queue SET sent_at = NOW()
     WHERE order_guid = ${orderGuid} AND sent_at IS NULL
    RETURNING tracking_number, carrier, line_items, queued_at
  `;
  return rows
    .map((r) => ({
      trackingNumber: r.tracking_number,
      carrier: r.carrier,
      lineItems: (typeof r.line_items === "string" ? JSON.parse(r.line_items) : r.line_items) ?? [],
    }))
    .sort((a, b) => a.trackingNumber.localeCompare(b.trackingNumber));
}

/** Lämnar tillbaka anspråket när mejlet inte gick iväg, så nästa försök tar det. */
export async function slappVantande(trackingNumbers: string[]): Promise<void> {
  for (const tn of trackingNumbers) {
    try {
      await sql/*sql*/`UPDATE shipping_email_queue SET sent_at = NULL WHERE tracking_number = ${tn}`;
    } catch (err) {
      console.error("[fraktmejl] kunde inte släppa", tn, err instanceof Error ? err.message : err);
    }
  }
}

/** Ordrar vars äldsta väntande nummer har väntat minst `minuter`. */
export async function ordrarSomVantat(minuter: number = VANTETID_MIN, max = 25): Promise<string[]> {
  await ensureTable();
  const { rows } = await sql<{ order_guid: string }>/*sql*/`
    SELECT order_guid FROM shipping_email_queue
     WHERE sent_at IS NULL
     GROUP BY order_guid
    HAVING MIN(queued_at) < NOW() - make_interval(mins => ${minuter})
     LIMIT ${max}
  `;
  return rows.map((r) => r.order_guid);
}
