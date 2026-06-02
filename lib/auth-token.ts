// lib/auth-token.ts
//
// Verifiering av kund-JWT från magic-link-inloggningen (native-appen). Detta är
// kontraktet push-API:t (POST /api/push/preferences) lutar sig mot:
//
//   • Token signeras HS256 med hemligheten `AUTH_JWT_SECRET`.
//   • Payload innehåller minst ett `email`-claim (kundens e-post) och valfritt
//     `exp` (unix-sekunder).
//
// Auth-tasken (magic-link-flödet) äger SIGNERINGEN. Om den landar med ett annat
// modulnamn/secret koordineras det vid rebase — håll signerings- och
// verifieringssidan på samma `AUTH_JWT_SECRET` + HS256 så fungerar de ihop.
//
// Beroendelöst (node:crypto) — repo:t har varken jose eller jsonwebtoken, och
// wix-webhook gör redan motsvarande för RS256.

import crypto from "node:crypto";

export interface UserClaims {
  email: string;
  exp?: number;
  [key: string]: unknown;
}

function b64urlJson(part: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** Plocka Bearer-token ur Authorization-headern. */
export function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return m ? m[1].trim() : null;
}

/**
 * Verifierar en HS256-JWT mot AUTH_JWT_SECRET och returnerar claims, eller null
 * om signaturen är ogiltig, token utgången, secret saknas eller formatet är fel.
 * Accepterar ALDRIG `alg: none`.
 */
export function verifyUserToken(token: string): UserClaims | null {
  const secret = (process.env.AUTH_JWT_SECRET || "").trim();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  const header = b64urlJson(headerB64) as { alg?: string } | null;
  if (!header || header.alg !== "HS256") return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  // Konstanttids-jämförelse för att undvika timing-läckage.
  const sig = Buffer.from(sigB64);
  const exp = Buffer.from(expected);
  if (sig.length !== exp.length || !crypto.timingSafeEqual(sig, exp)) return null;

  const payload = b64urlJson(payloadB64) as UserClaims | null;
  if (!payload || typeof payload.email !== "string" || !payload.email.trim()) return null;

  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;

  return payload;
}
