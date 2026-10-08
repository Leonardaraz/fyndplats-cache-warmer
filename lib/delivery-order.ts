// lib/delivery-order.ts
//
// Orderns paket i tracking_mapping, för levererat-mejlet per order (se
// levereratBeslut i lib/delivery-status). Beslutet är rent och testat där;
// här bor bara läsningarna och skrivningarna.
//
// `levererad_at` är när paketet först rapporterades levererat. updated_at
// duger inte: 17TRACK pushar samma status flera gånger, och varje push skriver
// updated_at, så väntetiden mot de andra paketen hade börjat om varje gång.

import { sql } from "./db";
import { POLL_MAX_ÅLDER_DAGAR, orderNyckel } from "./delivery-status";

let ensured: Promise<void> | null = null;
function ensureKolumn(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      try {
        await sql/*sql*/`ALTER TABLE tracking_mapping ADD COLUMN IF NOT EXISTS levererad_at TIMESTAMPTZ`;
        // Paket som blev levererade innan kolumnen fanns.
        await sql/*sql*/`
          UPDATE tracking_mapping SET levererad_at = updated_at
           WHERE status = 'delivered' AND levererad_at IS NULL
        `;
      } catch (e) {
        // Samtidiga kallstarter kan krocka på ALTER (42701 duplicate_column).
        const code = (e as { code?: string })?.code;
        if (code !== "42701" && code !== "23505") {
          ensured = null;
          throw e;
        }
      }
    })();
  }
  return ensured;
}

/** Markerar paketet levererat. levererad_at sätts bara första gången. */
export async function markeraLevererad(trackingNumber: string): Promise<void> {
  await ensureKolumn();
  await sql/*sql*/`
    UPDATE tracking_mapping
       SET status = 'delivered',
           levererad_at = COALESCE(levererad_at, NOW()),
           updated_at = NOW()
     WHERE tracking_number = ${trackingNumber}
       AND status <> 'ambiguous'
  `;
}

export interface OrderPaket {
  statusar: string[];
  /** Millisekunder, eller null om inget paket har levererats. */
  förstaLevererad: number | null;
}

/** Status för orderns alla paket. 'ambiguous' räknas inte: vi vet inte vems
 *  paket det är, och det ska inte hålla tillbaka mejlet. */
export async function läsOrderPaket(orderId: string): Promise<OrderPaket> {
  await ensureKolumn();
  const r = await sql<{ status: string; levererad_at: Date | string | null }>/*sql*/`
    SELECT status, levererad_at FROM tracking_mapping
     WHERE order_id = ${orderId} AND status <> 'ambiguous'
  `;
  let förstaLevererad: number | null = null;
  for (const rad of r.rows) {
    if (!rad.levererad_at) continue;
    const t = new Date(rad.levererad_at).getTime();
    if (Number.isFinite(t) && (förstaLevererad === null || t < förstaLevererad)) förstaLevererad = t;
  }
  return { statusar: r.rows.map((x) => x.status), förstaLevererad };
}

/** Svepet tar bara ordrar där ett paket levererades de senaste dagarna. Ett
 *  "har levererats"-mejl veckor efter leveransen är mer förvirrande än inget,
 *  och paket som blev levererade innan kolumnen fanns får sin gamla tid. */
export const SVEP_MAX_DAGAR = 10;

export interface OrderAttSvepa {
  order_id: string;
  /** Ett av orderns levererade paket. Sändaren markerar det levererat igen,
   *  vilket inte ändrar något. */
  tracking_number: string;
  customer_email: string;
  customer_name: string | null;
}

/**
 * Ordrar med minst ett levererat paket och inget levererat-mejl. Svepet i
 * /api/cron/ae-delivery-poll prövar dem igen: det sista paketet kan ha
 * kommit fram utan att mejlet gick (Resend-fel, två paket samtidigt), och
 * väntetiden mot paket som aldrig rapporteras kan ha gått ut.
 *
 * ☠️ En order där något paket fick ett eget levererat-mejl före 2026-10-08
 * (nyckeln är då spårningsnumret) räknas inte. Kunden har redan fått sitt
 * mejl, och svepet hade annars skickat ett till för varje gammal order.
 */
export async function ordrarAttSvepa(gräns = 30): Promise<OrderAttSvepa[]> {
  await ensureKolumn();
  const r = await sql.query<OrderAttSvepa>(
    `WITH o AS (
       SELECT order_id,
              array_agg(tracking_number) AS tns,
              (array_agg(tracking_number) FILTER (WHERE status = 'delivered'))[1] AS tracking_number,
              (array_agg(customer_email ORDER BY created_at DESC))[1] AS customer_email,
              (array_agg(customer_name ORDER BY created_at DESC))[1] AS customer_name
         FROM tracking_mapping
        WHERE order_id IS NOT NULL
          AND status <> 'ambiguous'
          AND created_at > NOW() - ($1::int * INTERVAL '1 day')
        GROUP BY order_id
       HAVING bool_or(status = 'delivered' AND levererad_at > NOW() - ($4::int * INTERVAL '1 day'))
     )
     SELECT o.order_id, o.tracking_number, o.customer_email, o.customer_name
       FROM o
      WHERE NOT EXISTS (
        SELECT 1 FROM delivery_notifications d
         WHERE d.status = 'delivered'
           AND (d.tracking_number = $2 || o.order_id OR d.tracking_number = ANY(o.tns))
      )
      LIMIT $3`,
    [POLL_MAX_ÅLDER_DAGAR, orderNyckel(""), gräns, SVEP_MAX_DAGAR],
  );
  return r.rows;
}
