// lib/medlem/inloggning.ts
//
// Inloggning utan lösenord (Leonards beslut A2, 2026-11-04): kunden anger sin
// e-post och får en länk och en sexsiffrig kod i samma mejl. Länken fungerar
// på enheten där mejlet öppnas, koden på enheten där kunden började. Det
// första lyckade inloggningen skapar kontot, så registrering och inloggning är
// samma flöde och svaret är detsamma oavsett om e-posten redan finns.
//
// Ren modul utan lokala imports: den prövas med
// `node --test --experimental-strip-types` (inloggning.test.ts).
//
// ☠️ Varken länkens token eller koden sparas i klartext. Raden i
// `FyndplatsInloggningar` har tokenens sha256 som id och kodens HMAC, med en
// nyckel som härleds ur MEDLEM_JWT_SECRET. Den som läser kollektionen kan
// alltså inte logga in.

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const GILTIG_MS = 15 * 60_000;
export const MAX_KODFORSOK = 5;
export const MAX_PER_TIMME_EPOST = 5;
export const MAX_PER_TIMME_IP = 20;
export const MIN_MELLANRUM_MS = 30_000;
/** Felaktiga koder per e-post och dygn, oavsett hur många koder som begärts. */
export const MAX_FEL_PER_DYGN = 10;
/** Kakan som bär länkens token från mejlet till inloggningssidan. */
export const LANK_KAKA = "fp_medlem_lank";

/** Trimmad, med gemener och rimlig form, eller null. */
export function normaliseraEpost(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return null;
  if (!/^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/.test(e)) return null;
  return e;
}

/** Medlemmens id: samma för samma e-post, och e-posten syns inte i det. */
export function medlemsId(epost: string): string {
  return `m_${createHash("sha256").update(`fyndplats-medlem|${epost}`, "utf8").digest("hex").slice(0, 40)}`;
}

/** En delnyckel per syfte, så att en läckt delnyckel inte öppnar något annat. */
export function delnyckel(hemlighet: string, syfte: "session" | "kod" | "ip" | "strypning" | "avregistrering"): Buffer {
  return createHmac("sha256", hemlighet).update(`fyndplats-medlem-${syfte}-v1`).digest();
}

export function hashaToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function hashaKod(kod: string, epost: string, skapad: string, hemlighet: string): string {
  return createHmac("sha256", delnyckel(hemlighet, "kod")).update(`${epost}|${skapad}|${kod}`).digest("hex");
}

export function ipNyckel(ip: string, hemlighet: string): string {
  return createHmac("sha256", delnyckel(hemlighet, "ip")).update(ip).digest("hex").slice(0, 32);
}

/**
 * Id för e-postens strypning i ett trettiosekundersfönster. Raden skapas med
 * en insert som vägrar ett id som finns, så två samtidiga förfrågningar på
 * samma adress kan inte båda skicka ett mejl (granskningen 2026-11-04: räknaren
 * lästes före skrivningen, och en skur samtidiga anrop kom alla förbi den).
 * E-posten går inte att läsa ur id:t.
 */
export function strypId(epost: string, nuMs: number, hemlighet: string): string {
  const h = createHmac("sha256", delnyckel(hemlighet, "strypning")).update(epost).digest("hex").slice(0, 32);
  return `s_${h}_${Math.floor(nuMs / MIN_MELLANRUM_MS)}`;
}

export interface NyInloggning {
  /** Går med i länken; sparas aldrig. */
  token: string;
  /** Radens id. */
  tokenHash: string;
  /** Står i mejlet; sparas aldrig. */
  kod: string;
  kodHash: string;
  skapad: string;
  giltigTill: string;
}

export function nyInloggning(epost: string, nuMs: number, hemlighet: string): NyInloggning {
  const token = randomBytes(32).toString("base64url");
  const kod = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const skapad = new Date(nuMs).toISOString();
  return {
    token,
    tokenHash: hashaToken(token),
    kod,
    kodHash: hashaKod(kod, epost, skapad, hemlighet),
    skapad,
    giltigTill: new Date(nuMs + GILTIG_MS).toISOString(),
  };
}

/** Bara siffrorna, så att "123 456" och "123-456" går lika bra. */
export function stadaKod(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const k = String(v).replace(/[\s-]/g, "");
  return /^\d{6}$/.test(k) ? k : null;
}

export interface Inloggningsrad {
  epost: string;
  skapad: string;
  giltigTill: string;
  kodHash: string;
  forsok: number;
  anvand?: string;
}

export type Prov = "ok" | "fel-kod" | "for-manga-forsok" | "utgangen" | "anvand";

/** Prövar en kod mot raden. Räkna upp `forsok` vid "fel-kod". */
export function provaKod(rad: Inloggningsrad, kod: string, nuMs: number, hemlighet: string): Prov {
  if (rad.anvand) return "anvand";
  if (Date.parse(rad.giltigTill) <= nuMs) return "utgangen";
  if (rad.forsok >= MAX_KODFORSOK) return "for-manga-forsok";
  const vantad = Buffer.from(rad.kodHash, "hex");
  const given = Buffer.from(hashaKod(kod, rad.epost, rad.skapad, hemlighet), "hex");
  return vantad.length === given.length && timingSafeEqual(vantad, given) ? "ok" : "fel-kod";
}

/**
 * Tar ett försök i anspråk INNAN koden prövas. `las` ger radens räknare (null
 * om raden saknas), `cas` flyttar den från `fore` till `fore + 1` bara om
 * ingen annan hann före. Så prövas högst `max` koder per inloggning, hur många
 * anrop som än kommer samtidigt.
 *
 * ☠️ Granskningen 2026-11-04: räknaren steg först EFTER prövningen. Hundra
 * samtidiga gissningar läste då alla räknaren 0 och prövades alla.
 */
export async function taForsok(
  las: () => Promise<number | null>,
  cas: (fore: number) => Promise<boolean>,
  max = MAX_KODFORSOK,
): Promise<"ok" | "slut" | "saknas"> {
  // Varje förlorad cas betyder att någon annan tog ett försök, så slingan
  // tar slut efter högst `max` varv; marginalen är för en rad som ändrats av
  // annat skäl samtidigt.
  for (let varv = 0; varv < max + 3; varv++) {
    const fore = await las();
    if (fore === null) return "saknas";
    if (fore >= max) return "slut";
    if (await cas(fore)) return "ok";
  }
  return "slut";
}

/** Länkens token: samma prövning utan kod. */
export function provaLank(rad: Inloggningsrad, nuMs: number): Prov {
  if (rad.anvand) return "anvand";
  if (Date.parse(rad.giltigTill) <= nuMs) return "utgangen";
  if (rad.forsok >= MAX_KODFORSOK) return "for-manga-forsok";
  return "ok";
}

/** Får en ny kod skickas? Räknat på den senaste timmens förfrågningar. */
export function farSkicka(
  v: { senasteTimmenEpost: number; senasteTimmenIp: number; senasteSkapad: string | null },
  nuMs: number,
): "ok" | "for-tatt" | "for-manga" {
  if (v.senasteTimmenEpost >= MAX_PER_TIMME_EPOST || v.senasteTimmenIp >= MAX_PER_TIMME_IP) return "for-manga";
  if (v.senasteSkapad && nuMs - Date.parse(v.senasteSkapad) < MIN_MELLANRUM_MS) return "for-tatt";
  return "ok";
}

/** Länkens token har rätt form (32 slumpbyte i base64url). */
export function arToken(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v);
}

/** Ett Wix order-id (GUID), eller null. */
export function orderGuid(v: unknown): string | null {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v.toLowerCase() : null;
}

/** "k•••@example.se": nog för att känna igen sin adress, inte för att läsa den. */
export function maskeradEpost(epost: string): string {
  const [namn, doman] = epost.split("@");
  if (!doman) return "•••";
  return `${namn.slice(0, 1)}•••@${doman}`;
}

/**
 * Bara en sökväg på vår egen sajt får bli målet efter inloggningen: ett
 * snedstreck följt av synliga ASCII-tecken, aldrig "//" eller "/\\" i början.
 *
 * ☠️ Granskningen 2026-11-04: webbläsaren och URL-tolken tar bort tabb och
 * radbrytning, så "/\t/ond.se" blev "//ond.se", en adress på en annan sajt.
 */
export function sakertMal(v: unknown): string {
  if (typeof v !== "string" || v.length > 200) return "/konto";
  return /^\/(?![/\\])[\x21-\x7e]*$/.test(v) ? v : "/konto";
}

// ─────────────────────────────────────────────────────────────────────────────
// Avregistrering från mejlen om nivån
// ─────────────────────────────────────────────────────────────────────────────

const MEDLEMS_ID = /^m_[0-9a-f]{40}$/;

/**
 * Token i länken "avregistrera dig" i mejlen om nivån. Den beror bara på
 * medlemmens id och hemligheten, så länken i ett gammalt mejl fungerar
 * fortfarande, och den öppnar ingenting annat än avregistreringen.
 */
export function avregistreringsToken(medlemsIdText: string, hemlighet: string): string {
  return createHmac("sha256", delnyckel(hemlighet, "avregistrering")).update(medlemsIdText).digest("base64url").slice(0, 32);
}

export function arGiltigAvregistrering(medlemsIdText: unknown, token: unknown, hemlighet: string): boolean {
  if (typeof medlemsIdText !== "string" || !MEDLEMS_ID.test(medlemsIdText)) return false;
  if (typeof token !== "string" || token.length !== 32) return false;
  const vantad = Buffer.from(avregistreringsToken(medlemsIdText, hemlighet));
  const fatt = Buffer.from(token);
  return fatt.length === vantad.length && timingSafeEqual(fatt, vantad);
}

/** Frågedelen i länkarna: `?m=…&t=…`. */
export function avregistreringsFraga(medlemsIdText: string, hemlighet: string): string {
  return `?m=${encodeURIComponent(medlemsIdText)}&t=${avregistreringsToken(medlemsIdText, hemlighet)}`;
}
