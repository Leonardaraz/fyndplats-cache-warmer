// lib/review-token.ts
//
// Signerad länk till omdömesformuläret. Kunden får den i leveransmejlet:
//   https://www.fyndplats.se/omdome/<token>
//
// Token bär orderns id och är HMAC-signerad. Ingen databas behövs — vi kan
// verifiera den i efterhand utan att ha sparat något, och den går inte att
// gissa sig till. Det viktiga är att BARA den som fått mejlet kan skriva ett
// omdöme, annars är "verifierat köp" en tom fras.
//
// Fail-closed: utan REVIEW_TOKEN_SECRET går det inte att signera, och då
// läggs ingen länk i mejlet och formuläret svarar 404. Hellre ingen funktion
// än en som släpper in vem som helst.

import { createHmac, timingSafeEqual } from "node:crypto";

/** Hur länge en länk fungerar. Räknat från att mejlet skickades. */
export const TOKEN_TTL_DAYS = 90;

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}

function unb64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Bygger token för en order. Returnerar null utan hemlighet — anroparen ska då
 * hoppa över länken helt.
 */
export function signReviewToken(
  orderId: string,
  secret: string | undefined,
  issuedAtMs: number = Date.now(),
): string | null {
  if (!orderId || !secret) return null;
  const payload = `${orderId}.${issuedAtMs.toString(36)}`;
  return `${b64url(payload)}.${sign(payload, secret)}`;
}

/**
 * Läser tillbaka order-id:t ur en token. null = ogiltig, manipulerad eller för
 * gammal. Jämförelsen är tidskonstant så att en angripare inte kan gissa sig
 * fram till signaturen tecken för tecken.
 */
export function verifyReviewToken(
  token: string | undefined,
  secret: string | undefined,
  nowMs: number = Date.now(),
): { orderId: string; issuedAtMs: number } | null {
  if (!token || !secret) return null;
  const bitar = token.split(".");
  if (bitar.length !== 2) return null;

  let payload: string;
  try {
    payload = unb64url(bitar[0]);
  } catch {
    return null;
  }

  const väntad = sign(payload, secret);
  const a = Buffer.from(väntad);
  const b = Buffer.from(bitar[1]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const delar = payload.split(".");
  if (delar.length !== 2) return null;
  const orderId = delar[0];
  const issuedAtMs = parseInt(delar[1], 36);
  if (!orderId || !Number.isFinite(issuedAtMs)) return null;

  if (nowMs - issuedAtMs > TOKEN_TTL_DAYS * 24 * 3600 * 1000) return null;
  // En token daterad i framtiden är antingen en klockglidning eller ett försök
  // att förlänga giltigheten. En dags marginal räcker för det förra.
  if (issuedAtMs - nowMs > 24 * 3600 * 1000) return null;

  return { orderId, issuedAtMs };
}

/** Full länk till formuläret, eller null när funktionen är avstängd. */
export function reviewFormUrl(
  orderId: string,
  siteUrl: string,
  secret: string | undefined,
  issuedAtMs?: number,
): string | null {
  const t = signReviewToken(orderId, secret, issuedAtMs);
  return t ? `${siteUrl.replace(/\/$/, "")}/omdome/${t}` : null;
}
