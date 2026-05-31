// lib/newsletter.ts
// Nyhetsbrevs-prenumeranter.
//
// LAGRING: Postgres-tabellen `newsletter_subscribers` (samma DB som abandoned-
// cart-flödet). Uppgiften bad om en Wix Data-collection (FyndplatsNewsletter-
// Subscribers) skapad via Wix MCP — men ingen Wix Data-MCP är ansluten i denna
// miljö och @wix/data-SDK:n finns inte installerad. Vi återanvänder därför den
// befintliga, redan deployade Postgres-infran (lib/db.ts) som redan lagrar
// e-postadresser för transaktionsmejl. Kolumnerna speglar de begärda Wix-fälten
// (email, subscribedAt, source, status) så en migrering till Wix Data senare är
// rakt fram. Se HANDOFF-anteckning i commit-meddelandet.

import { createHmac } from "crypto";
import { sql } from "./db";

export type SubscribeResult =
  | { ok: true; already: boolean }
  | { ok: false; error: string };

let ensured = false;
// Idempotent tabell-skapande (CREATE IF NOT EXISTS) — körs en gång per kall
// process, så routen funkar även om den centrala runMigration() inte har körts
// mot denna databas. Mönstret matchar lib/db.ts.
async function ensureTable(): Promise<void> {
  if (ensured) return;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email          TEXT PRIMARY KEY,
      subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source         TEXT,
      status         TEXT NOT NULL DEFAULT 'subscribed',
      consent        BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  ensured = true;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function secret(): string {
  return process.env.NEWSLETTER_SECRET || process.env.CRON_SECRET || "fyndplats-newsletter-v1";
}

// Stabil, e-post-specifik avregistreringstoken (HMAC). Ingen DB-lookup behövs
// för att verifiera — länken i mejlet håller för all framtid.
export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret())
    .update(email.toLowerCase().trim())
    .digest("base64url")
    .slice(0, 32);
}

export function unsubscribeUrl(email: string, base = "https://www.fyndplats.se"): string {
  const e = encodeURIComponent(email.toLowerCase().trim());
  return `${base}/avregistrera?e=${e}&t=${unsubscribeToken(email)}`;
}

// Upsert: ny prenumerant → infogas; befintlig (t.ex. tidigare avregistrerad)
// → status återställs till 'subscribed'. `already` = adressen var redan aktiv.
export async function subscribe(emailRaw: string, source: string, consent: boolean): Promise<SubscribeResult> {
  const email = emailRaw.toLowerCase().trim();
  if (!isValidEmail(email)) return { ok: false, error: "invalid_email" };
  if (!consent) return { ok: false, error: "consent_required" };
  await ensureTable();
  const res = await sql/*sql*/`
    INSERT INTO newsletter_subscribers (email, source, status, consent)
    VALUES (${email}, ${source}, 'subscribed', ${consent})
    ON CONFLICT (email) DO UPDATE
      SET status = 'subscribed',
          consent = EXCLUDED.consent,
          source = COALESCE(newsletter_subscribers.source, EXCLUDED.source),
          updated_at = NOW()
    RETURNING (xmax = 0) AS inserted
  `;
  const inserted = (res.rows[0] as { inserted: boolean } | undefined)?.inserted ?? true;
  return { ok: true, already: !inserted };
}

// Avregistrering — verifierar token, sätter status='unsubscribed'.
export async function unsubscribe(emailRaw: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const email = emailRaw.toLowerCase().trim();
  if (!isValidEmail(email)) return { ok: false, error: "invalid_email" };
  if (token !== unsubscribeToken(email)) return { ok: false, error: "invalid_token" };
  await ensureTable();
  await sql/*sql*/`
    UPDATE newsletter_subscribers
       SET status = 'unsubscribed', updated_at = NOW()
     WHERE email = ${email}
  `;
  return { ok: true };
}
