// lib/newsletter.ts
// Nyhetsbrevs-prenumeranter.
//
// LAGRING: Wix CMS (`nyhetsbrev` i lib/wix-lager.ts). Prenumeranterna bodde i
// Postgres-tabellen `newsletter_subscribers` till flytten tillbaka till Wix
// 2026-10-29; Postgres-vägen togs bort 2026-11-05.

import { createHmac } from "crypto";
import { nyhetsbrev } from "./wix-lager";

export type SubscribeResult =
  | { ok: true; already: boolean }
  | { ok: false; error: string };

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
  const { already } = await nyhetsbrev.prenumerera(email, source, consent);
  return { ok: true, already };
}

// Avregistrering — verifierar token, sätter status='unsubscribed'.
// Upsert (inte bara uppdatering): mottagare av t.ex. abandoned-cart-mejl finns
// oftast INTE bland prenumeranterna, men ska ändå kunna avregistrera sig. Då
// skapas en rad med status 'unsubscribed' så att suppressionen gäller framåt.
export async function unsubscribe(emailRaw: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const email = emailRaw.toLowerCase().trim();
  if (!isValidEmail(email)) return { ok: false, error: "invalid_email" };
  if (token !== unsubscribeToken(email)) return { ok: false, error: "invalid_token" };
  await nyhetsbrev.avregistrera(email);
  return { ok: true };
}

// Har den här adressen avregistrerat sig? Används av abandoned-cart-flödet för att
// respektera opt-out innan varje mejl skickas (GDPR).
export async function isSuppressed(emailRaw: string): Promise<boolean> {
  const email = emailRaw.toLowerCase().trim();
  if (!isValidEmail(email)) return false;
  try {
    return await nyhetsbrev.arAvregistrerad(email);
  } catch {
    // If the lookup fails we fail OPEN (allow send) — a transactional cart reminder
    // under legitimate interest is the conservative default, and the recipient still
    // gets a working unsubscribe link in that email.
    return false;
  }
}
