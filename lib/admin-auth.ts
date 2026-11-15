// Edge-säker HTTP Basic Auth för /admin-sidorna (används av middleware.ts, som
// kör på Vercel Edge → INGEN node:crypto här).
//
// ☠️ Skyddet är inte längre ett tillval (2026-11-14). Saknas ADMIN_BASIC_USER
// eller ADMIN_BASIC_PASS i en driftsatt motor NEKAS /admin med ett tydligt
// konfigurationsfel. Förut släpptes allt igenom då, så att en tappad variabel
// öppnade adminsidorna utan att något syntes. Öppet utan inställning är det
// bara lokalt och i prov (`lib/sakerhetslage.ts`).

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

export type AdminAuthUtfall = "disabled" | "misconfigured" | "ok" | "unauthorized";

/**
 * Beslutar admin-Basic-Auth-utfall (ren funktion → enhetstestbar):
 * - env saknas (user ELLER pass tom) → "misconfigured": middleware NEKAR med
 *   ett konfigurationsfel. Bara med `oppetUtanKonfig` (lokalt och i prov, se
 *   `oppetUtanKonfiguration`) blir det "disabled" och släpps igenom.
 * - korrekt matchande Basic-credentials → "ok"
 * - annars → "unauthorized" (middleware svarar 401 + WWW-Authenticate)
 *
 * `oppetUtanKonfig` är FALSKT om inget annat sägs: den som glömmer argumentet
 * får det stängda läget, inte det öppna.
 */
export function adminAuthDecision(
  authHeader: string | null,
  envUser: string | undefined,
  envPass: string | undefined,
  oppetUtanKonfig = false,
): AdminAuthUtfall {
  if (!envUser || !envPass) return oppetUtanKonfig ? "disabled" : "misconfigured";
  const creds = parseBasicAuth(authHeader);
  if (creds && safeEqual(creds.user, envUser) && safeEqual(creds.pass, envPass)) return "ok";
  return "unauthorized";
}
