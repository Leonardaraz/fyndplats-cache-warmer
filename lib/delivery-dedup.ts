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
      try {
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
      } catch (e) {
        // Samtidiga cold starts kan racea CREATE TABLE (Postgres 23505/42P07
        // "duplicate"). Tabellen finns ändå efteråt → svälj race-felet i stället
        // för att kasta det vidare (annars fail-open:ar claim och kan mejla
        // dubbletter). Tabellen pre-skapas dessutom i lib/db.ts runMigration.
        const code = (e as { code?: string })?.code;
        if (code !== "23505" && code !== "42P07") {
          ensured = null; // okänt fel → tillåt retry vid nästa anrop
          throw e;
        }
      }
    })();
  }
  return ensured;
}

// In-process-vakt: dedupar (tracking_number, status) inom EN varm instans även
// om DB-claimen skulle fail-open:a under en DB-glitch (17TRACK re-pushar samma
// status flera gånger, ofta till samma instans). Kompletterar DB-claimen, ersätter
// den inte. Cap:ad för att aldrig läcka minne på långlivade instanser.
const seenThisProcess = new Set<string>();
function rememberLocal(key: string): void {
  if (seenThisProcess.size >= 2000) {
    let i = 0;
    for (const k of seenThisProcess) {
      seenThisProcess.delete(k);
      if (++i >= 1000) break;
    }
  }
  seenThisProcess.add(key);
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
  const localKey = `${trackingNumber}|${status}`;
  // Snabb in-process-vakt först: redan hanterad i denna instans → hoppa (skyddar
  // mot dubbletter när DB-claimen fail-open:ar under en DB-glitch).
  if (seenThisProcess.has(localKey)) return false;
  try {
    await ensureTable();
    const { rows } = await sql/*sql*/`
      INSERT INTO delivery_notifications (tracking_number, status, channel, customer_email)
      VALUES (${trackingNumber}, ${status}, ${channel}, ${customerEmail ?? null})
      ON CONFLICT (tracking_number, status) DO NOTHING
      RETURNING tracking_number
    `;
    const won = rows.length > 0;
    if (won) rememberLocal(localKey);
    return won;
  } catch (err) {
    console.error("[delivery-dedup] claim misslyckades (fail-open → skickar)", err instanceof Error ? err.message : err);
    // Fail-open men minns lokalt så SAMMA instans inte mejlar igen vid re-push.
    rememberLocal(localKey);
    return true;
  }
}

/** Släpper ett anspråk (anropas när mejlet faktiskt misslyckades) så att en
 *  efterföljande fyrning/retry kan vinna anspråket och skicka notisen. */
export async function releaseDeliveryNotification(trackingNumber: string, status: string): Promise<void> {
  if (!trackingNumber || !status) return;
  // Släpp även in-process-vakten så en retry (eller den andra kanalen) kan ta över.
  seenThisProcess.delete(`${trackingNumber}|${status}`);
  try {
    await sql/*sql*/`
      DELETE FROM delivery_notifications WHERE tracking_number = ${trackingNumber} AND status = ${status}
    `;
  } catch (err) {
    console.error("[delivery-dedup] release misslyckades", err instanceof Error ? err.message : err);
  }
}
