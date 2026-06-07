// Edge-säker HTTP Basic Auth för /admin-sidorna (används av middleware.ts, som
// kör på Vercel Edge → INGEN node:crypto här). Opt-in: aktiveras bara när
// ADMIN_BASIC_USER + ADMIN_BASIC_PASS är satta i miljön, annars släpps allt
// igenom (ingen risk att låsa ute Leonard, och Vercel Deployment Protection
// fortsätter vara det yttre skyddet tills detta aktiveras).

/** Konstant-tid-ish strängjämförelse utan node:crypto (edge-kompatibel). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Tolkar en `Basic <base64>`-Authorization-header → { user, pass } eller null. */
export function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header || !header.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return null;
  }
  const idx = decoded.indexOf(":");
  if (idx === -1) return null;
  return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
}

/**
 * Beslutar admin-Basic-Auth-utfall (ren funktion → enhetstestbar):
 * - env saknas (user ELLER pass tom) → "disabled" (släpp igenom — ingen utelåsning)
 * - korrekt matchande Basic-credentials → "ok"
 * - annars → "unauthorized" (middleware svarar 401 + WWW-Authenticate)
 */
export function adminAuthDecision(
  authHeader: string | null,
  envUser: string | undefined,
  envPass: string | undefined,
): "disabled" | "ok" | "unauthorized" {
  if (!envUser || !envPass) return "disabled";
  const creds = parseBasicAuth(authHeader);
  if (creds && safeEqual(creds.user, envUser) && safeEqual(creds.pass, envPass)) return "ok";
  return "unauthorized";
}
