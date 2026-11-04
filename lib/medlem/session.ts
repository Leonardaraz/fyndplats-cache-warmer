// lib/medlem/session.ts
//
// Medlemmens session: kakan `fp_medlem` med en HS256-JWT. Samma regler som
// lib/auth-token.ts (node:crypto, aldrig `alg: none`, jämförelse i konstant
// tid), men med en egen hemlighet, MEDLEM_JWT_SECRET, och en egen delnyckel.
//
// Kunden förblir inloggad i 90 dagar, och tiden förlängs vid besök (Leonards
// beslut 2026-11-04): en token äldre än ett dygn skrivs om vid nästa besök på
// Mina sidor. Kakan är httpOnly, så skript på sidan kan inte läsa den.
//
// Ren modul utan lokala imports: den prövas med
// `node --test --experimental-strip-types` (session.test.ts).

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_KAKA = "fp_medlem";
export const SESSION_DAGAR = 90;
export const FORNYA_EFTER_S = 24 * 60 * 60;

export interface Session {
  /** Medlemmens id (`m_…`). */
  sub: string;
  email: string;
  typ: "medlem";
  /** E3: kontot handlar som sitt företag. Saknas: privat. Servern prövar
   *  ändå företagsprofilen vid varje prissättning; tecknet ger ingen rätt. */
  profil?: "foretag";
  iat: number;
  exp: number;
}

export type Profilval = "privat" | "foretag";

function nyckel(hemlighet: string): Buffer {
  // Samma härledning som inloggning.ts `delnyckel(…, "session")`.
  return createHmac("sha256", hemlighet).update("fyndplats-medlem-session-v1").digest();
}

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o), "utf8").toString("base64url");

export function signera(s: Session, hemlighet: string): string {
  const huvud = b64({ alg: "HS256", typ: "JWT" });
  const last = b64(s);
  const sig = createHmac("sha256", nyckel(hemlighet)).update(`${huvud}.${last}`).digest("base64url");
  return `${huvud}.${last}.${sig}`;
}

export function nySession(
  medlemsId: string,
  epost: string,
  nuMs: number,
  hemlighet: string,
  profil: Profilval = "privat",
): { token: string; maxAgeS: number } {
  const iat = Math.floor(nuMs / 1000);
  const maxAgeS = SESSION_DAGAR * 24 * 60 * 60;
  const s: Session = { sub: medlemsId, email: epost, typ: "medlem", ...(profil === "foretag" ? { profil } : {}), iat, exp: iat + maxAgeS };
  return { token: signera(s, hemlighet), maxAgeS };
}

function json(del: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(Buffer.from(del, "base64url").toString("utf8"));
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Sessionen, eller null om token är ogiltig, utgången eller hemligheten saknas. */
export function lasSession(token: string | null | undefined, hemlighet: string | null | undefined, nuMs: number): Session | null {
  if (!token || !hemlighet) return null;
  const delar = token.split(".");
  if (delar.length !== 3) return null;
  const [huvud, last, sig] = delar;
  const h = json(huvud);
  if (!h || h.alg !== "HS256") return null;
  const vantad = Buffer.from(createHmac("sha256", nyckel(hemlighet)).update(`${huvud}.${last}`).digest("base64url"));
  const given = Buffer.from(sig);
  if (vantad.length !== given.length || !timingSafeEqual(vantad, given)) return null;
  const p = json(last);
  if (!p || p.typ !== "medlem") return null;
  if (typeof p.sub !== "string" || !p.sub.startsWith("m_")) return null;
  if (typeof p.email !== "string" || !p.email) return null;
  if (typeof p.iat !== "number" || typeof p.exp !== "number") return null;
  if (p.exp * 1000 <= nuMs) return null;
  return { sub: p.sub, email: p.email, typ: "medlem", ...(p.profil === "foretag" ? { profil: "foretag" as const } : {}), iat: p.iat, exp: p.exp };
}

export function behoverFornyas(s: Session, nuMs: number): boolean {
  return nuMs / 1000 - s.iat >= FORNYA_EFTER_S;
}

/** Kakans attribut. `secure` bara över https, så att den lokala servern fungerar. */
export function kakaAttribut(maxAgeS: number, https = true) {
  return { httpOnly: true, secure: https, sameSite: "lax" as const, path: "/", maxAge: maxAgeS };
}

/**
 * Ett tecken som sidans skript får läsa: "här finns en inloggning". Sessionen
 * själv är httpOnly. Utan tecknet hade varje produktsida behövt fråga servern
 * om medlemspriset, också för alla som aldrig loggat in. Tecknet bär ingenting
 * hemligt och ger ingen behörighet; servern läser alltid sessionen.
 */
export const TECKEN_KAKA = "fp_medlem_inne";

/** Tecknets värde: "1" privat, "f" företag (E3). Sidans skript visar då
 *  priser exkl. moms medan servern svarar; priset kommer alltid från servern. */
export function teckenVarde(profil: Profilval | undefined): "1" | "f" {
  return profil === "foretag" ? "f" : "1";
}

export function teckenAttribut(maxAgeS: number, https = true) {
  return { httpOnly: false, secure: https, sameSite: "lax" as const, path: "/", maxAge: maxAgeS };
}
