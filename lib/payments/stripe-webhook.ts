// Stripe webhook-signaturverifiering — beroendefri (Node crypto, ingen SDK).
//
// Stripe signerar varje webhook med headern `Stripe-Signature` på formatet
//   t=<unix-tid>,v1=<hex-hmac>[,v1=<hex-hmac>...]
// där HMAC-SHA256 beräknas över `${t}.${rawBody}` med din webhook-hemlighet.
// Verifieringen måste ske mot RÅ request-body (inte JSON-parsad).

import crypto from "node:crypto";

interface ParsedSignature {
  t: number;
  v1: string[];
}

/** Plockar isär Stripe-Signature-headern. */
export function parseSignatureHeader(header: string): ParsedSignature {
  const out: ParsedSignature = { t: 0, v1: [] };
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "t") out.t = Number(val);
    else if (key === "v1") out.v1.push(val);
  }
  return out;
}

/** Beräknar den förväntade signaturen för en payload. */
export function computeSignature(payload: string, secret: string, timestamp: number): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

/**
 * Verifierar en Stripe-webhook. Returnerar true endast om en giltig v1-signatur
 * matchar och tidsstämpeln ligger inom toleransen (skydd mot replay).
 */
export function verifyStripeSignature(opts: {
  payload: string;
  header: string;
  secret: string;
  toleranceSec?: number;
  nowSec?: number;
}): boolean {
  const { payload, header, secret } = opts;
  const toleranceSec = opts.toleranceSec ?? 300;
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000);

  if (!header || !secret) return false;
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || v1.length === 0) return false;
  if (toleranceSec > 0 && Math.abs(nowSec - t) > toleranceSec) return false;

  const expected = Buffer.from(computeSignature(payload, secret, t));
  return v1.some((sig) => {
    const provided = Buffer.from(sig);
    return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
  });
}
