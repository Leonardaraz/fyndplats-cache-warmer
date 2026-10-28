// lib/wix-lager.ts
//
// Butikens tabeller i Wix CMS. Flytten från Neon, Leonards beslut 2026-10-28
// efter köpet av Wix Elite (10 miljoner rader): Neon kostade 30–40 dollar i
// månaden, och 4 000-taket som drev ut datan 2026-08-31 gäller inte längre.
//
// VÄXELN är en rad i Wix (`FyndplatsButikInstallningar/datalager`), inte en
// konstant: att byta lager kostar då inget eget bygge, och ett butiksbygge
// tömmer ISR-cachen för hela katalogen (CLAUDE.md, "bunta ihop deploys").
// Raden läses högst en gång i minuten per instans. Saknas den, eller svarar
// Wix inte vid en kallstart, gäller Postgres. Efter växlingen betyder det att
// en instans som inte når Wix skriver till Neon; delta-läget i kopieringen
// plockar upp sådana rader, och Postgres-vägen tas bort när Neon stängs.
//
// ☠️ Två mätningar mot Wix (2026-10-29) styr formen på raderna:
//   - ett `_id` får vara högst 128 tecken, ASCII-bokstäver, siffror och
//     skiljetecken (WDE0075). E-post och händelsenycklar går därför genom
//     `wixNyckel`, som hashar det som inte får plats;
//   - `{ f: { $exists: false } }` matchar INTE en rad där f är null. Inget
//     fält skrivs därför som null, och "ta bort" är REMOVE_FIELD.
//
// VIKTIGT: håll denna fil fri från lokala imports — den körs under
// `node --test --experimental-strip-types` via wix-lager.test.ts.

import { createHash, randomUUID } from "node:crypto";

export const WIX_DATA_BAS = "https://www.wixapis.com/data/v2";

// ─────────────────────────────────────────────────────────────────────────────
// Kollektionerna
// ─────────────────────────────────────────────────────────────────────────────

export const K = {
  installningar: "FyndplatsButikInstallningar",
  las: "FyndplatsButikLas",
  kundvagnar: "FyndplatsKundvagnar",
  kundvagnMejl: "FyndplatsKundvagnMejl",
  anvandaAdresser: "FyndplatsAnvandaAdresser",
  sparning: "FyndplatsSparning",
  smsLogg: "FyndplatsSmsLogg",
  smsOmatchade: "FyndplatsSmsOmatchade",
  leveransnotiser: "FyndplatsLeveransnotiser",
  webhookMejl: "FyndplatsWebhookMejl",
  nyhetsbrev: "FyndplatsNyhetsbrev",
  ordrar: "FyndplatsOrdrar",
  trustpilot: "FyndplatsTrustpilotInbjudningar",
  prishistorik: "FyndplatsPrishistorik",
  orderbekraftelser: "FyndplatsOrderbekraftelser",
  angerarenden: "FyndplatsAngerarenden",
  fraktmejlKo: "FyndplatsFraktmejlKo",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Klienten (samma regler som motorns lib/db/wix-data-klient.ts)
// ─────────────────────────────────────────────────────────────────────────────

/** lasning: alltid säkert att göra om. idempotent: ett andra försök gör samma
 *  sak. engang: ett anspråk eller en villkorad ändring, görs bara om när Wix
 *  bevisligen inte körde anropet (429/WDE0014). */
export type Slag = "lasning" | "idempotent" | "engang";

export class WixDataFel extends Error {
  readonly operation: string;
  readonly kollektion: string;
  /** 0 = nätverksfel. */
  readonly status: number;
  readonly kod: string | null;
  constructor(operation: string, kollektion: string, status: number, kod: string | null, meddelande: string) {
    super(meddelande);
    this.name = "WixDataFel";
    this.operation = operation;
    this.kollektion = kollektion;
    this.status = status;
    this.kod = kod;
  }
}

export function wixDataRubriker(): Record<string, string> {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) throw new Error("WIX_API_KEY eller WIX_SITE_ID saknas i miljön.");
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

let vantaStandard = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Endast för tester. */
export function __sattVantaForTester(f: ((ms: number) => Promise<void>) | null): void {
  vantaStandard = f ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
}

/** Pauserna före varje försök: fyra försök, 12 sekunder som mest. */
export const PAUSER_MS = [0, 1_000, 3_000, 8_000];
const MAX_RETRY_AFTER_MS = 30_000;

export function wdeKod(text: string): string | null {
  return /WDE\d{4}/.exec(text)?.[0] ?? null;
}

/** ☠️ Kvotstoppet först, för alla slag: 429/WDE0014 betyder att anropet aldrig kördes. */
export function kanForsokaIgen(status: number, kod: string | null, slag: Slag): boolean {
  if (status === 429 || kod === "WDE0014") return true;
  if (slag === "engang") return false;
  if (status === 0 || status >= 500) return true;
  return kod === "WDE0028";
}

interface Svar<T> {
  ok: boolean;
  status: number;
  kod: string | null;
  text: string;
  json: T | null;
  vantaMs?: number;
}

async function anropa<T>(
  operation: string,
  kollektion: string,
  metod: "GET" | "POST" | "PATCH" | "DELETE",
  sokvag: string,
  kropp: unknown,
  slag: Slag,
): Promise<Svar<T>> {
  // Rubrikerna utanför loopen: en saknad nyckel är inte övergående.
  const rubriker = wixDataRubriker();
  let senaste: Svar<T> = { ok: false, status: 0, kod: null, text: "", json: null };
  for (let i = 0; i < PAUSER_MS.length; i++) {
    if (i > 0) {
      console.warn(
        `[wix-lager] försöker om ${operation} ${kollektion} (${senaste.status || "nätverk"}${senaste.kod ? ` ${senaste.kod}` : ""})`,
      );
      await vantaStandard(Math.max(PAUSER_MS[i], Math.min(senaste.vantaMs ?? 0, MAX_RETRY_AFTER_MS)));
    }
    let res: Response;
    try {
      res = await fetch(`${WIX_DATA_BAS}${sokvag}`, {
        method: metod,
        headers: rubriker,
        body: kropp === undefined ? undefined : JSON.stringify(kropp),
        cache: "no-store",
      });
    } catch (e) {
      senaste = { ok: false, status: 0, kod: null, text: `nätverksfel: ${String((e as Error)?.message ?? e).slice(0, 200)}`, json: null };
      if (kanForsokaIgen(0, null, slag)) continue;
      return senaste;
    }
    const text = await res.text();
    if (res.ok) {
      try {
        return { ok: true, status: res.status, kod: null, text: "", json: text ? (JSON.parse(text) as T) : ({} as T) };
      } catch {
        // Ett 200-svar som inte går att läsa är ett fel, inte en tom sida.
        senaste = { ok: false, status: res.status, kod: "JSON", text: text.slice(0, 200), json: null };
        if (kanForsokaIgen(500, null, slag)) continue;
        return senaste;
      }
    }
    const ra = Number(res.headers?.get?.("retry-after"));
    senaste = {
      ok: false,
      status: res.status,
      kod: wdeKod(text),
      text,
      json: null,
      vantaMs: Number.isFinite(ra) && ra > 0 ? ra * 1000 : undefined,
    };
    if (!kanForsokaIgen(res.status, senaste.kod, slag)) return senaste;
  }
  return senaste;
}

function felFor(operation: string, kollektion: string, s: Svar<unknown>): WixDataFel {
  return new WixDataFel(
    operation,
    kollektion,
    s.status,
    s.kod,
    `Wix Data ${operation} ${kollektion} (${s.status || "nätverk"}${s.kod ? ` ${s.kod}` : ""}): ${s.text.slice(0, 300)}`,
  );
}

const arSaknadRad = (s: Svar<unknown>) => s.kod === "WDE0073" || (s.status === 404 && s.kod !== "WDE0025");

/** Wix egna fält och anspråkets token. `_id` behålls. */
export const SYSTEMFALT = ["_owner", "_createdDate", "_updatedDate", "anspraksToken"] as const;

export function utanSystemfalt(rad: Record<string, unknown>): Record<string, unknown> {
  const ut = { ...rad };
  for (const f of SYSTEMFALT) delete ut[f];
  return ut;
}

/** ☠️ Inget fält skrivs som null eller undefined: `$exists: false` matchar inte null. */
export function utanTomma(rad: Record<string, unknown>): Record<string, unknown> {
  const ut: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rad)) if (v !== null && v !== undefined) ut[k] = v;
  return ut;
}

export type Rad = Record<string, unknown>;
export type Sortering = { fieldName: string; order: "ASC" | "DESC" }[];

/** En rad, eller null om den inte finns. En saknad KOLLEKTION är ett fel. */
export async function hamta(kollektion: string, id: string): Promise<Rad | null> {
  const s = await anropa<{ dataItem?: { data?: Rad } }>(
    "get",
    kollektion,
    "GET",
    `/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(kollektion)}`,
    undefined,
    "lasning",
  );
  if (!s.ok) {
    if (arSaknadRad(s)) return null;
    throw felFor("get", kollektion, s);
  }
  const data = s.json?.dataItem?.data;
  return data ? utanSystemfalt(data) : null;
}

/** Raden med anspråkets token kvar, för att avgöra ett tvetydigt anspråk. */
async function hamtaRa(kollektion: string, id: string): Promise<Rad | null> {
  const s = await anropa<{ dataItem?: { data?: Rad } }>(
    "get",
    kollektion,
    "GET",
    `/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(kollektion)}`,
    undefined,
    "lasning",
  );
  if (!s.ok) {
    if (arSaknadRad(s)) return null;
    throw felFor("get", kollektion, s);
  }
  return s.json?.dataItem?.data ?? null;
}

/** EN sida, för topp-N-läsningar. `medSystemfalt` behåller `_createdDate` och `_updatedDate` (kopians delta-läge). */
export async function fraga(
  kollektion: string,
  q: { filter?: Rad; sort?: Sortering; limit: number },
  opts: { medSystemfalt?: boolean } = {},
): Promise<Rad[]> {
  if (q.limit > 1000) throw new Error(`fraga(${kollektion}): limit ${q.limit} > 1000 — använd allaRader`);
  const s = await anropa<{ dataItems?: { data?: Rad }[] }>(
    "query",
    kollektion,
    "POST",
    "/items/query",
    { dataCollectionId: kollektion, query: { filter: q.filter ?? {}, sort: q.sort ?? [], cursorPaging: { limit: q.limit } } },
    "lasning",
  );
  if (!s.ok) throw felFor("query", kollektion, s);
  const rader = (s.json?.dataItems ?? []).map((d) => d.data).filter((d): d is Rad => Boolean(d));
  return opts.medSystemfalt ? rader : rader.map(utanSystemfalt);
}

export const ALLA_RADER_TAK = 500_000;

/**
 * ALLA rader som matchar, med markör till slutet. Filter och sortering skickas
 * bara i första anropet. Kastar hellre än kapar: en halv lista ser ut som en hel.
 */
export async function allaRader(
  kollektion: string,
  q: { filter?: Rad; sort?: Sortering; sidstorlek?: number; tak?: number } = {},
): Promise<Rad[]> {
  const sid = Math.min(Math.max(1, q.sidstorlek ?? 1000), 1000);
  const tak = q.tak ?? ALLA_RADER_TAK;
  const ut: Rad[] = [];
  const sedda = new Set<string>();
  const markorer = new Set<string>();
  let markor: string | null = null;
  for (;;) {
    const query: Rad = markor
      ? { cursorPaging: { limit: sid, cursor: markor } }
      : { filter: q.filter ?? {}, sort: q.sort ?? [], cursorPaging: { limit: sid } };
    const s: Svar<{ dataItems?: { data?: Rad }[]; pagingMetadata?: { cursors?: { next?: string | null } } }> = await anropa(
      "query",
      kollektion,
      "POST",
      "/items/query",
      { dataCollectionId: kollektion, query },
      "lasning",
    );
    if (!s.ok) throw felFor("query", kollektion, s);
    const sida = (s.json?.dataItems ?? []).map((d) => d.data).filter((d): d is Rad => Boolean(d));
    for (const d of sida) {
      const id = typeof d._id === "string" ? d._id : null;
      if (id) {
        if (sedda.has(id)) continue;
        sedda.add(id);
      }
      ut.push(utanSystemfalt(d));
    }
    if (ut.length > tak) throw new Error(`allaRader(${kollektion}) passerade ${tak} rader — en kapad lista är värre än ett fel.`);
    const nasta = s.json?.pagingMetadata?.cursors?.next ?? null;
    if (!nasta || sida.length === 0) return ut;
    if (markorer.has(nasta)) throw new Error(`allaRader(${kollektion}): samma markör två gånger`);
    markorer.add(nasta);
    markor = nasta;
  }
}

export async function rakna(kollektion: string, filter: Rad = {}): Promise<number> {
  const s = await anropa<{ totalCount?: number }>("count", kollektion, "POST", "/items/count", { dataCollectionId: kollektion, filter }, "lasning");
  if (!s.ok) throw felFor("count", kollektion, s);
  const n = s.json?.totalCount;
  if (typeof n !== "number") throw new Error(`count(${kollektion}) svarade utan totalCount`);
  return n;
}

/** Skapar eller ersätter HELA raden. */
export async function spara(kollektion: string, id: string, data: Rad): Promise<void> {
  const s = await anropa(
    "save",
    kollektion,
    "POST",
    "/items/save",
    { dataCollectionId: kollektion, dataItem: { id, dataCollectionId: kollektion, data: { ...utanTomma(data), _id: id } } },
    "idempotent",
  );
  if (!s.ok) throw felFor("save", kollektion, s);
}

export const MASSA_RADER = 100;
export const MASSA_BYTE = 1_500_000;

export function iOmgangar<T>(rader: T[], storlek: (r: T) => number, maxRader = MASSA_RADER, maxByte = MASSA_BYTE): T[][] {
  const ut: T[][] = [];
  let nu: T[] = [];
  let byte = 0;
  for (const r of rader) {
    const b = storlek(r);
    if (nu.length > 0 && (nu.length >= maxRader || byte + b > maxByte)) {
      ut.push(nu);
      nu = [];
      byte = 0;
    }
    nu.push(r);
    byte += b;
  }
  if (nu.length) ut.push(nu);
  return ut;
}

export interface WixRad {
  id: string;
  data: Rad;
}

export interface Massutfall {
  sparade: number;
  fel: { id: string; fel: string }[];
}

/** ☠️ En rad räknas bara när Wix uttryckligen bekräftat den. */
export async function sparaManga(kollektion: string, rader: WixRad[]): Promise<Massutfall> {
  const utfall: Massutfall = { sparade: 0, fel: [] };
  for (const omgang of iOmgangar(rader, (r) => JSON.stringify(r.data).length + 64)) {
    const s = await anropa<{
      results?: { itemMetadata?: { id?: string; originalIndex?: number; success?: boolean; error?: { code?: string; description?: string } } }[];
      bulkActionMetadata?: { undetailedFailures?: number };
    }>(
      "bulk-save",
      kollektion,
      "POST",
      "/bulk/items/save",
      { dataCollectionId: kollektion, dataItems: omgang.map((r) => ({ id: r.id, dataCollectionId: kollektion, data: { ...utanTomma(r.data), _id: r.id } })) },
      "idempotent",
    );
    if (!s.ok) {
      const f = felFor("bulk-save", kollektion, s).message;
      for (const r of omgang) utfall.fel.push({ id: r.id, fel: f });
      continue;
    }
    const odetaljerade = s.json?.bulkActionMetadata?.undetailedFailures ?? 0;
    const bekraftade = new Set<string>();
    const felIdn = new Map<string, string>();
    for (const res of s.json?.results ?? []) {
      const m = res.itemMetadata ?? {};
      const id = m.id ?? (typeof m.originalIndex === "number" ? omgang[m.originalIndex]?.id : undefined);
      if (!id) continue;
      if (m.success === true) bekraftade.add(id);
      else felIdn.set(id, `${m.error?.code ?? "fel"}: ${(m.error?.description ?? "").slice(0, 120)}`);
    }
    for (const r of omgang) {
      if (odetaljerade === 0 && bekraftade.has(r.id)) utfall.sparade++;
      else utfall.fel.push({ id: r.id, fel: felIdn.get(r.id) ?? (odetaljerade ? "oadresserbart fel i omgången" : "inte bekräftad av Wix") });
    }
  }
  return utfall;
}

export type Infogat = "skapad" | "fanns";

/**
 * ETT ANSPRÅK: skapar raden bara om id:t inte finns (WDE0074 annars) — samma
 * regel som Postgres `insert … on conflict do nothing returning`.
 * ☠️ Efter ett nätverksfel avgör radens token vem som äger den.
 */
export async function infoga(kollektion: string, id: string, data: Rad): Promise<Infogat> {
  const token = randomUUID();
  for (let forsok = 0; forsok < 3; forsok++) {
    const s = await anropa(
      "insert",
      kollektion,
      "POST",
      "/items",
      { dataCollectionId: kollektion, dataItem: { id, data: { ...utanTomma(data), _id: id, anspraksToken: token } } },
      "engang",
    );
    if (s.ok) return "skapad";
    if (s.kod === "WDE0074") {
      if (forsok === 0) return "fanns";
      const rad = await hamtaRa(kollektion, id);
      return rad?.anspraksToken === token ? "skapad" : "fanns";
    }
    if (!(s.status === 0 || s.status >= 500)) throw felFor("insert", kollektion, s);
    const rad = await hamtaRa(kollektion, id);
    if (rad) return rad.anspraksToken === token ? "skapad" : "fanns";
    await vantaStandard(PAUSER_MS[forsok + 1] ?? 3_000);
  }
  throw new Error(`insert ${kollektion}: tre tvetydiga försök i rad`);
}

export type Faltandring =
  | { action: "SET_FIELD"; fieldPath: string; setFieldOptions: { value: unknown } }
  | { action: "REMOVE_FIELD"; fieldPath: string };

export const satt = (fieldPath: string, value: unknown): Faltandring => ({ action: "SET_FIELD", fieldPath, setFieldOptions: { value } });
export const taBortFalt = (fieldPath: string): Faltandring => ({ action: "REMOVE_FIELD", fieldPath });

/** Fältändringar ur ett objekt: null/undefined tas bort, allt annat sätts. */
export function andringar(falt: Rad): Faltandring[] {
  return Object.entries(falt).map(([k, v]) => (v === null || v === undefined ? taBortFalt(k) : satt(k, v)));
}

export type Patchutfall = { utfall: "applied"; rad: Rad | null } | { utfall: "condition-failed" | "not-found" };

/**
 * Ändrar bara de angivna fälten. Med `villkor` är det en atomisk
 * compare-and-set (förloraren får 428 WDE0193). Wix svarar med raden efter
 * ändringen (uppmätt 2026-10-29), och den följer med.
 */
export async function patcha(kollektion: string, id: string, mods: Faltandring[], villkor?: Rad): Promise<Patchutfall> {
  const s = await anropa<{ dataItem?: { data?: Rad } }>(
    "patch",
    kollektion,
    "PATCH",
    `/items/${encodeURIComponent(id)}`,
    {
      dataCollectionId: kollektion,
      patch: { dataItemId: id, fieldModifications: mods },
      ...(villkor ? { condition: { filter: villkor } } : {}),
    },
    villkor ? "engang" : "idempotent",
  );
  if (s.ok) {
    const data = s.json?.dataItem?.data;
    return { utfall: "applied", rad: data ? utanSystemfalt(data) : null };
  }
  if (s.kod === "WDE0193" || (s.status === 428 && villkor)) return { utfall: "condition-failed" };
  if (arSaknadRad(s)) return { utfall: "not-found" };
  throw felFor("patch", kollektion, s);
}

export type Borttagning = "borttagen" | "fanns-inte" | "villkor";

export async function taBort(kollektion: string, id: string, villkor?: Rad): Promise<Borttagning> {
  const s = await anropa(
    "remove",
    kollektion,
    "DELETE",
    `/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(kollektion)}`,
    villkor ? { condition: { filter: villkor } } : undefined,
    villkor ? "engang" : "idempotent",
  );
  if (s.ok) return "borttagen";
  if (s.kod === "WDE0193" || (s.status === 428 && villkor)) return "villkor";
  if (arSaknadRad(s)) return "fanns-inte";
  throw felFor("remove", kollektion, s);
}

/** Tar bort många rader per id. En rad som redan var borta är inget fel. */
export async function taBortManga(kollektion: string, idn: string[]): Promise<{ borttagna: number; fel: string[] }> {
  const ut = { borttagna: 0, fel: [] as string[] };
  for (let i = 0; i < idn.length; i += 1000) {
    const omgang = idn.slice(i, i + 1000);
    const s = await anropa<{ results?: { itemMetadata?: { id?: string; success?: boolean; error?: { code?: string } } }[] }>(
      "bulk-remove",
      kollektion,
      "POST",
      "/bulk/items/remove",
      { dataCollectionId: kollektion, dataItemIds: omgang },
      "idempotent",
    );
    if (!s.ok) {
      ut.fel.push(felFor("bulk-remove", kollektion, s).message);
      continue;
    }
    for (const r of s.json?.results ?? []) {
      const m = r.itemMetadata ?? {};
      if (m.success === true) ut.borttagna++;
      else if (m.error?.code && m.error.code !== "WDE0073") ut.fel.push(`${m.id ?? "?"}: ${m.error.code}`);
    }
  }
  return ut;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nycklar och tider
// ─────────────────────────────────────────────────────────────────────────────

const SAKER_NYCKEL = /^[A-Za-z0-9._@:+\-]{1,128}$/;

/**
 * Radens `_id` för en nyckel. ☠️ Wix tar högst 128 tecken, ASCII och
 * skiljetecken (WDE0075, uppmätt 2026-10-29); mellanslag och å, ä, ö avvisas.
 * En nyckel utanför den snäva mängden ovan blir `h:` + sha256, alltid samma
 * för samma nyckel. Kopian och lagret använder samma funktion.
 */
export function wixNyckel(nyckel: string): string {
  if (SAKER_NYCKEL.test(nyckel) && !nyckel.startsWith("h:")) return nyckel;
  return `h:${createHash("sha256").update(nyckel, "utf8").digest("hex")}`;
}

const sammansatt = (...delar: (string | number)[]) => wixNyckel(delar.map(String).join("__"));

/** Tid som ISO-sträng, eller null. Alla tider i Wix-raderna är ISO-strängar, så de sorterar rätt. */
export function iso(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "object" && v !== null && typeof (v as { $date?: unknown }).$date === "string") {
    return iso((v as { $date: string }).$date);
  }
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const str = (v: unknown): string | null => (v == null ? null : String(v));
const num = (v: unknown, standard = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : standard;
};
const nu = () => new Date().toISOString();

/** JSONB kan komma som sträng från Postgres-drivrutinen. */
function jsonVarde<T>(v: unknown, standard: T): T {
  if (v == null) return standard;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return standard;
    }
  }
  return v as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Växeln
// ─────────────────────────────────────────────────────────────────────────────

export type Datalager = "postgres" | "wix";
export const VAXEL_ID = "datalager";
const VAXEL_CACHE_MS = 60_000;
/** Efter ett läsfel: försök igen tidigast om tio sekunder. */
const VAXEL_FEL_PAUS_MS = 10_000;

let vaxelCache: { lager: Datalager; at: number; giltigMs: number } | null = null;
let vaxelForTester: Datalager | null = null;

/** Endast för tester. null = läs växeln som vanligt. */
export function __sattDatalagerForTester(l: Datalager | null): void {
  vaxelForTester = l;
  vaxelCache = null;
}

/**
 * Vilket lager butikens tabeller bor i. Läses ur Wix högst en gång i minuten.
 * Saknas raden: Postgres. Går den inte att läsa: senast kända, annars Postgres.
 */
export async function datalager(nuMs = Date.now()): Promise<Datalager> {
  if (vaxelForTester) return vaxelForTester;
  if (vaxelCache && nuMs - vaxelCache.at < vaxelCache.giltigMs) return vaxelCache.lager;
  try {
    const rad = await hamta(K.installningar, VAXEL_ID);
    const lager: Datalager = rad?.lager === "wix" ? "wix" : "postgres";
    if (vaxelCache && vaxelCache.lager !== lager) console.log(`[wix-lager] datalagret bytt: ${vaxelCache.lager} → ${lager}`);
    vaxelCache = { lager, at: nuMs, giltigMs: VAXEL_CACHE_MS };
    return lager;
  } catch (e) {
    const forra = vaxelCache?.lager ?? "postgres";
    console.error(`[wix-lager] kunde inte läsa växeln, använder ${forra}:`, e instanceof Error ? e.message : e);
    vaxelCache = { lager: forra, at: nuMs, giltigMs: VAXEL_FEL_PAUS_MS };
    return forra;
  }
}

export async function anvanderWix(): Promise<boolean> {
  return (await datalager()) === "wix";
}

// ─────────────────────────────────────────────────────────────────────────────
// Ett lås (för fraktmejlskön)
// ─────────────────────────────────────────────────────────────────────────────

/** Ett lås som en död instans lämnat efter sig räknas som fritt efter så här lång tid. */
export const LAS_GAMMALT_MS = 60_000;

/** Tar låset. Ett gammalt lås tas över (villkorat, så två övertagare inte båda vinner). */
export async function taLas(namn: string, nuMs = Date.now()): Promise<string | null> {
  const id = wixNyckel(`las__${namn}`);
  const token = randomUUID();
  if ((await infoga(K.las, id, { at: new Date(nuMs).toISOString(), token })) === "skapad") return token;
  const rad = await hamta(K.las, id);
  if (!rad) {
    return (await infoga(K.las, id, { at: new Date(nuMs).toISOString(), token })) === "skapad" ? token : null;
  }
  const at = Date.parse(String(rad.at ?? ""));
  if (Number.isFinite(at) && nuMs - at < LAS_GAMMALT_MS) return null;
  const tagen = await patcha(K.las, id, [satt("at", new Date(nuMs).toISOString()), satt("token", token)], { token: rad.token });
  return tagen.utfall === "applied" ? token : null;
}

export async function slappLas(namn: string, token: string): Promise<void> {
  try {
    await taBort(K.las, wixNyckel(`las__${namn}`), { token });
  } catch (e) {
    console.error(`[wix-lager] kunde inte släppa låset ${namn}:`, e instanceof Error ? e.message : e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabellerna. Varje del har sin form i Wix, sin översättning från Postgres
// (för kopian) och de läsningar och skrivningar modulerna behöver.
// ─────────────────────────────────────────────────────────────────────────────

// ── abandoned_carts → FyndplatsKundvagnar ────────────────────────────────────

/** Samma form som lib/abandoned-cart.ts `CartRow`, så flödet inte behöver veta var raden bodde. */
export interface KundvagnRad {
  id: string;
  email: string;
  phone: string | null;
  shipping_addr_hash: string | null;
  items_json: unknown[];
  subtotal_minor: number;
  currency: string;
  recover_url: string | null;
  next_step: number;
  next_step_at: string;
  status: string;
  discount_code: string | null;
  discount_code_wix_id: string | null;
}

function kundvagnFranWix(d: Rad): KundvagnRad {
  return {
    id: String(d.cartId ?? d._id),
    email: String(d.email ?? ""),
    phone: str(d.phone),
    shipping_addr_hash: str(d.shippingAddrHash),
    items_json: Array.isArray(d.items) ? d.items : [],
    subtotal_minor: num(d.subtotalMinor),
    currency: String(d.currency ?? "SEK"),
    recover_url: str(d.recoverUrl),
    next_step: num(d.nextStep, 1),
    next_step_at: String(d.nextStepAt ?? ""),
    status: String(d.status ?? "pending"),
    discount_code: str(d.discountCode),
    discount_code_wix_id: str(d.discountCodeWixId),
  };
}

export const kundvagnar = {
  franPostgres(r: Rad): WixRad {
    const email = String(r.email ?? "");
    return {
      id: wixNyckel(String(r.id)),
      data: utanTomma({
        cartId: String(r.id),
        email,
        emailLower: email.toLowerCase(),
        phone: str(r.phone),
        shippingAddrHash: str(r.shipping_addr_hash),
        items: jsonVarde<unknown[]>(r.items_json, []),
        subtotalMinor: num(r.subtotal_minor),
        currency: String(r.currency ?? "SEK"),
        recoverUrl: str(r.recover_url),
        abandonedAt: iso(r.abandoned_at),
        nextStep: num(r.next_step, 1),
        nextStepAt: iso(r.next_step_at),
        status: String(r.status ?? "pending"),
        discountCode: str(r.discount_code),
        discountCodeWixId: str(r.discount_code_wix_id),
        createdAt: iso(r.created_at),
        updatedAt: iso(r.updated_at),
      }),
    };
  },

  /** Ny vagn. false när den redan fanns (`ON CONFLICT DO NOTHING`). */
  async skapa(v: {
    id: string;
    email: string;
    phone: string | null;
    shippingAddrHash: string | null;
    items: unknown[];
    subtotalMinor: number;
    currency: string;
    recoverUrl: string | null;
    abandonedAt: string;
    nextStepAt: string;
  }): Promise<boolean> {
    const tid = nu();
    return (
      (await infoga(K.kundvagnar, wixNyckel(v.id), {
        cartId: v.id,
        email: v.email,
        emailLower: v.email.toLowerCase(),
        phone: v.phone,
        shippingAddrHash: v.shippingAddrHash,
        items: v.items,
        subtotalMinor: v.subtotalMinor,
        currency: v.currency,
        recoverUrl: v.recoverUrl,
        abandonedAt: v.abandonedAt,
        nextStep: 1,
        nextStepAt: v.nextStepAt,
        status: "pending",
        createdAt: tid,
        updatedAt: tid,
      })) === "skapad"
    );
  },

  /** `UPDATE … SET status='converted' WHERE id=? AND status='pending' RETURNING discount_code_wix_id`. */
  async konvertera(id: string): Promise<{ konverterad: boolean; rabattWixId: string | null }> {
    const p = await patcha(K.kundvagnar, wixNyckel(id), [satt("status", "converted"), satt("updatedAt", nu())], { status: "pending" });
    if (p.utfall !== "applied") return { konverterad: false, rabattWixId: null };
    return { konverterad: true, rabattWixId: str(p.rad?.discountCodeWixId) };
  },

  /** Alla kundens väntande vagnar, matchat på e-post. Svarar med de återkallningsbara rabatt-id:na. */
  async konverteraForEpost(emailLower: string): Promise<{ antal: number; rabattWixIdn: string[] }> {
    const rader = await allaRader(K.kundvagnar, { filter: { emailLower, status: "pending" } });
    let antal = 0;
    const rabattWixIdn: string[] = [];
    for (const r of rader) {
      const id = String(r._id);
      const p = await patcha(K.kundvagnar, id, [satt("status", "converted"), satt("updatedAt", nu())], { status: "pending" });
      if (p.utfall !== "applied") continue;
      antal++;
      const w = str(p.rad?.discountCodeWixId);
      if (w) rabattWixIdn.push(w);
    }
    return { antal, rabattWixIdn };
  },

  async forfallna(nuIso: string, limit: number): Promise<KundvagnRad[]> {
    const rader = await fraga(K.kundvagnar, {
      filter: { status: "pending", nextStepAt: { $lte: nuIso } },
      sort: [{ fieldName: "nextStepAt", order: "ASC" }],
      limit: Math.min(Math.max(1, limit), 1000),
    });
    return rader.map(kundvagnFranWix);
  },

  /** Sätter fälten (null tar bort fältet) och updatedAt. */
  async uppdatera(id: string, falt: { status?: string; nextStep?: number; nextStepAt?: string; discountCode?: string; discountCodeWixId?: string }): Promise<void> {
    await patcha(K.kundvagnar, wixNyckel(id), andringar({ ...falt, updatedAt: nu() }));
  },

  async hamta(id: string): Promise<KundvagnRad | null> {
    const d = await hamta(K.kundvagnar, wixNyckel(id));
    return d ? kundvagnFranWix(d) : null;
  },

  /** De senast skapade vagnarna, för utvecklingsrutten. */
  async senaste(antal: number): Promise<Rad[]> {
    return fraga(K.kundvagnar, { sort: [{ fieldName: "createdAt", order: "DESC" }], limit: antal });
  },

  async raknaEjKonverteradeSedan(sedanIso: string): Promise<number> {
    return rakna(K.kundvagnar, { abandonedAt: { $gte: sedanIso }, status: { $ne: "converted" } });
  },

  async raknaVantande(): Promise<number> {
    return rakna(K.kundvagnar, { status: "pending" });
  },
};

// ── sent_emails → FyndplatsKundvagnMejl ──────────────────────────────────────

export const kundvagnMejl = {
  franPostgres(r: Rad): WixRad {
    const email = String(r.email ?? "");
    return {
      id: sammansatt(String(r.cart_id), num(r.step)),
      data: utanTomma({
        cartId: String(r.cart_id),
        step: num(r.step),
        resendId: str(r.resend_id),
        sentAt: iso(r.sent_at),
        email,
        emailLower: email.toLowerCase(),
        discountCode: str(r.discount_code),
      }),
    };
  },

  /** `ON CONFLICT (cart_id, step) DO NOTHING`. */
  async logga(v: { cartId: string; step: number; resendId: string | null; email: string; discountCode?: string | null }): Promise<void> {
    await infoga(K.kundvagnMejl, sammansatt(v.cartId, v.step), {
      cartId: v.cartId,
      step: v.step,
      resendId: v.resendId,
      sentAt: nu(),
      email: v.email,
      emailLower: v.email.toLowerCase(),
      discountCode: v.discountCode ?? null,
    });
  },

  /** De senast skickade, för utvecklingsrutten. */
  async senaste(antal: number): Promise<Rad[]> {
    return fraga(K.kundvagnMejl, { sort: [{ fieldName: "sentAt", order: "DESC" }], limit: antal });
  },

  /** Har adressen fått ett kundvagnsmejl sedan `sedanIso` (från en annan vagn än `utomCartId`)? */
  async nyligen(emailLower: string, sedanIso: string, utomCartId?: string): Promise<boolean> {
    const filter: Rad = { emailLower, sentAt: { $gte: sedanIso } };
    if (utomCartId) filter.cartId = { $ne: utomCartId };
    return (await fraga(K.kundvagnMejl, { filter, limit: 1 })).length > 0;
  },
};

// ── used_addresses → FyndplatsAnvandaAdresser ────────────────────────────────

export const anvandaAdresser = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.hash)),
      data: utanTomma({ hash: String(r.hash), email: str(r.email), phone: str(r.phone), firstSeen: iso(r.first_seen) }),
    };
  },

  /** `ON CONFLICT (hash) DO NOTHING`. */
  async registrera(hash: string, email: string | null, phone: string | null): Promise<void> {
    await infoga(K.anvandaAdresser, wixNyckel(hash), { hash, email, phone, firstSeen: nu() });
  },

  async finnsHash(hash: string): Promise<boolean> {
    return (await hamta(K.anvandaAdresser, wixNyckel(hash))) !== null;
  },

  async finnsTelefon(phone: string): Promise<boolean> {
    return (await fraga(K.anvandaAdresser, { filter: { phone }, limit: 1 })).length > 0;
  },
};

// ── tracking_mapping → FyndplatsSparning ─────────────────────────────────────

/** Samma kolumner som tracking_mapping, så anroparna läser samma form som förut. */
export interface SparningRad {
  tracking_number: string;
  order_id: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  created_at: string | null;
  levererad_at: string | null;
}

function sparningFranWix(d: Rad): SparningRad {
  return {
    tracking_number: String(d.trackingNumber ?? d._id),
    order_id: str(d.orderId),
    customer_email: String(d.customerEmail ?? ""),
    customer_name: str(d.customerName),
    customer_phone: str(d.customerPhone),
    status: String(d.status ?? "pending"),
    created_at: str(d.createdAt),
    levererad_at: str(d.levereradAt),
  };
}

export const sparning = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.tracking_number)),
      data: utanTomma({
        trackingNumber: String(r.tracking_number),
        trackingNumberUpper: String(r.tracking_number).toUpperCase(),
        orderId: str(r.order_id),
        customerEmail: String(r.customer_email ?? ""),
        customerName: str(r.customer_name),
        customerPhone: str(r.customer_phone),
        status: String(r.status ?? "pending"),
        createdAt: iso(r.created_at),
        updatedAt: iso(r.updated_at),
        levereradAt: iso(r.levererad_at),
      }),
    };
  },

  /** Ny sändning. false när numret redan fanns (`ON CONFLICT DO NOTHING RETURNING`). */
  async skapa(v: {
    trackingNumber: string;
    orderId: string | null;
    customerEmail: string;
    customerName: string | null;
    customerPhone: string | null;
    status: string;
  }): Promise<boolean> {
    const tid = nu();
    return (
      (await infoga(K.sparning, wixNyckel(v.trackingNumber), {
        trackingNumber: v.trackingNumber,
        trackingNumberUpper: v.trackingNumber.toUpperCase(),
        orderId: v.orderId,
        customerEmail: v.customerEmail,
        customerName: v.customerName,
        customerPhone: v.customerPhone,
        status: v.status,
        createdAt: tid,
        updatedAt: tid,
      })) === "skapad"
    );
  },

  async hamta(trackingNumber: string): Promise<SparningRad | null> {
    const d = await hamta(K.sparning, wixNyckel(trackingNumber));
    return d ? sparningFranWix(d) : null;
  },

  /** Skapar eller ersätter raden (utvecklingsrutten: `ON CONFLICT DO UPDATE`). */
  async sparaHelt(v: {
    trackingNumber: string;
    orderId: string | null;
    customerEmail: string;
    customerName: string | null;
    customerPhone: string | null;
    status: string;
  }): Promise<void> {
    const id = wixNyckel(v.trackingNumber);
    const fanns = await hamta(K.sparning, id);
    const tid = nu();
    await spara(K.sparning, id, {
      ...(fanns ?? {}),
      ...v,
      trackingNumberUpper: v.trackingNumber.toUpperCase(),
      createdAt: str(fanns?.createdAt) ?? tid,
      updatedAt: tid,
    });
  },

  async senaste(antal: number): Promise<SparningRad[]> {
    return (await fraga(K.sparning, { sort: [{ fieldName: "updatedAt", order: "DESC" }], limit: antal })).map(sparningFranWix);
  },

  /** `WHERE UPPER(tracking_number) = ?`: numret som det skrevs in, oavsett skiftläge. */
  async hamtaVersaler(nummerVersaler: string): Promise<SparningRad | null> {
    const exakt = await sparning.hamta(nummerVersaler);
    if (exakt) return exakt;
    const [rad] = await fraga(K.sparning, { filter: { trackingNumberUpper: nummerVersaler }, limit: 1 });
    return rad ? sparningFranWix(rad) : null;
  },

  async sattStatus(trackingNumber: string, status: string): Promise<void> {
    await patcha(K.sparning, wixNyckel(trackingNumber), [satt("status", status), satt("updatedAt", nu())]);
  },

  async taBort(trackingNumber: string): Promise<void> {
    await taBort(K.sparning, wixNyckel(trackingNumber));
  },

  /**
   * `SET status='delivered', levererad_at = COALESCE(levererad_at, NOW())
   *  WHERE tracking_number=? AND status <> 'ambiguous'`.
   */
  async markeraLevererad(trackingNumber: string): Promise<void> {
    const id = wixNyckel(trackingNumber);
    const rad = await hamta(K.sparning, id);
    if (!rad || rad.status === "ambiguous") return;
    const tid = nu();
    const mods = [satt("status", "delivered"), satt("updatedAt", tid)];
    if (!rad.levereradAt) mods.push(satt("levereradAt", tid));
    await patcha(K.sparning, id, mods, { status: { $ne: "ambiguous" } });
  },

  /** Orderns paket, utom de i karantän. */
  async forOrder(orderId: string): Promise<SparningRad[]> {
    return (await allaRader(K.sparning, { filter: { orderId, status: { $ne: "ambiguous" } } })).map(sparningFranWix);
  },

  /** FIFO-kandidater: in_transit sedan `sedanIso`, äldst först, högst fem. */
  async fifo(sedanIso: string): Promise<SparningRad[]> {
    return (
      await fraga(K.sparning, {
        filter: { status: "in_transit", createdAt: { $gte: sedanIso } },
        sort: [{ fieldName: "createdAt", order: "ASC" }],
        limit: 5,
      })
    ).map(sparningFranWix);
  },

  /** Paket att fråga AliExpress om: status i `statusar`, skapade efter `sedanIso`, äldst först. */
  async forPoll(statusar: string[], sedanIso: string, limit: number): Promise<SparningRad[]> {
    return (
      await fraga(K.sparning, {
        filter: { status: { $in: statusar }, createdAt: { $gt: sedanIso } },
        sort: [{ fieldName: "createdAt", order: "ASC" }],
        limit: Math.min(Math.max(1, limit), 1000),
      })
    ).map(sparningFranWix);
  },

  /** Alla paket med order, utom karantän, skapade efter `sedanIso` (underlaget för leveranssvepet). */
  async forSvep(sedanIso: string): Promise<SparningRad[]> {
    return (
      await allaRader(K.sparning, {
        filter: { orderId: { $exists: true }, status: { $ne: "ambiguous" }, createdAt: { $gt: sedanIso } },
      })
    ).map(sparningFranWix);
  },
};

// ── sms_audit och sms_unmatched → FyndplatsSmsLogg, FyndplatsSmsOmatchade ─────

/** Nya rader får ett id som sorterar efter tid. Kopierade behåller Postgres-id:t. */
const nyttLoggId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

export const smsLogg = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.id)),
      data: utanTomma({
        receivedAt: iso(r.received_at),
        rawFrom: String(r.raw_from ?? ""),
        rawText: String(r.raw_text ?? ""),
        carrier: str(r.carrier),
        status: str(r.status),
        pickupLocation: str(r.pickup_location),
        pickupCode: str(r.pickup_code),
        trackingNumber: str(r.tracking_number),
        matched: Boolean(r.matched),
        emailSent: Boolean(r.email_sent),
        resendId: str(r.resend_id),
        error: str(r.error),
        matchStrategy: str(r.match_strategy),
      }),
    };
  },

  async logga(v: {
    rawFrom: string;
    rawText: string;
    carrier: string | null;
    status: string | null;
    pickupLocation: string | null;
    pickupCode: string | null;
    trackingNumber: string | null;
    matched: boolean;
    emailSent: boolean;
    resendId: string | null;
    error: string | null;
    matchStrategy: string | null;
  }): Promise<string> {
    const id = nyttLoggId("sms");
    await infoga(K.smsLogg, id, { ...v, receivedAt: nu() });
    return id;
  },

  async senaste(antal: number): Promise<Rad[]> {
    return fraga(K.smsLogg, { sort: [{ fieldName: "receivedAt", order: "DESC" }], limit: antal });
  },

  async raknaFifoSedan(sedanIso: string): Promise<number> {
    return rakna(K.smsLogg, { matchStrategy: "fifo", receivedAt: { $gte: sedanIso } });
  },
};

export const smsOmatchade = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.id)),
      data: utanTomma({
        auditId: str(r.audit_id),
        receivedAt: iso(r.received_at),
        rawFrom: String(r.raw_from ?? ""),
        rawText: String(r.raw_text ?? ""),
        trackingNumber: str(r.tracking_number),
        reason: String(r.reason ?? ""),
      }),
    };
  },

  async logga(v: { auditId: string | null; rawFrom: string; rawText: string; trackingNumber: string | null; reason: string }): Promise<void> {
    await infoga(K.smsOmatchade, nyttLoggId("omatchad"), { ...v, receivedAt: nu() });
  },

  async senaste(antal: number): Promise<Rad[]> {
    return fraga(K.smsOmatchade, { sort: [{ fieldName: "receivedAt", order: "DESC" }], limit: antal });
  },
};

// ── delivery_notifications → FyndplatsLeveransnotiser ────────────────────────

export const leveransnotiser = {
  franPostgres(r: Rad): WixRad {
    return {
      id: sammansatt(String(r.tracking_number), String(r.status)),
      data: utanTomma({
        trackingNumber: String(r.tracking_number),
        status: String(r.status),
        channel: str(r.channel),
        customerEmail: str(r.customer_email),
        sentAt: iso(r.sent_at),
      }),
    };
  },

  /** Atomiskt anspråk på (nummer, status): true = vi skickar. */
  async ansprak(trackingNumber: string, status: string, channel: string, customerEmail: string | null): Promise<boolean> {
    return (
      (await infoga(K.leveransnotiser, sammansatt(trackingNumber, status), {
        trackingNumber,
        status,
        channel,
        customerEmail,
        sentAt: nu(),
      })) === "skapad"
    );
  },

  async slapp(trackingNumber: string, status: string): Promise<void> {
    await taBort(K.leveransnotiser, sammansatt(trackingNumber, status));
  },

  async finns(trackingNumber: string, status: string): Promise<boolean> {
    return (await hamta(K.leveransnotiser, sammansatt(trackingNumber, status))) !== null;
  },

  /** Vilka av nycklarna har en notis med status `status`. */
  async medStatus(nycklar: string[], status: string): Promise<Set<string>> {
    const ut = new Set<string>();
    const unika = [...new Set(nycklar)];
    for (let i = 0; i < unika.length; i += 100) {
      const del = unika.slice(i, i + 100);
      const idTillNyckel = new Map(del.map((n) => [sammansatt(n, status), n]));
      const rader = await fraga(K.leveransnotiser, { filter: { _id: { $in: [...idTillNyckel.keys()] } }, limit: 1000 });
      for (const r of rader) {
        const n = idTillNyckel.get(String(r._id));
        if (n) ut.add(n);
      }
    }
    return ut;
  },
};

// ── webhook_email_sent → FyndplatsWebhookMejl ────────────────────────────────

export const webhookMejl = {
  franPostgres(r: Rad): WixRad {
    return { id: wixNyckel(String(r.event_key)), data: utanTomma({ eventKey: String(r.event_key), sentAt: iso(r.sent_at) }) };
  },
  async ansprak(eventKey: string): Promise<boolean> {
    return (await infoga(K.webhookMejl, wixNyckel(eventKey), { eventKey, sentAt: nu() })) === "skapad";
  },
  async slapp(eventKey: string): Promise<void> {
    await taBort(K.webhookMejl, wixNyckel(eventKey));
  },
};

// ── order_confirmation_sent → FyndplatsOrderbekraftelser ─────────────────────

export const orderbekraftelser = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.order_id)),
      data: utanTomma({ orderId: String(r.order_id), orderNumber: str(r.order_number), sentAt: iso(r.sent_at) }),
    };
  },
  async ansprak(orderId: string, orderNumber: string | null): Promise<boolean> {
    return (await infoga(K.orderbekraftelser, wixNyckel(orderId), { orderId, orderNumber, sentAt: nu() })) === "skapad";
  },
  async slapp(orderId: string): Promise<void> {
    await taBort(K.orderbekraftelser, wixNyckel(orderId));
  },
};

// ── newsletter_subscribers → FyndplatsNyhetsbrev ─────────────────────────────

export const nyhetsbrev = {
  franPostgres(r: Rad): WixRad {
    const email = String(r.email ?? "").toLowerCase();
    return {
      id: wixNyckel(email),
      data: utanTomma({
        email,
        subscribedAt: iso(r.subscribed_at),
        source: str(r.source),
        status: String(r.status ?? "subscribed"),
        consent: Boolean(r.consent),
        updatedAt: iso(r.updated_at),
      }),
    };
  },

  /**
   * `INSERT … ON CONFLICT (email) DO UPDATE SET status='subscribed', consent,
   *  source = COALESCE(gammal, ny)`. already = adressen fanns redan.
   */
  async prenumerera(email: string, source: string | null, consent: boolean): Promise<{ already: boolean }> {
    const id = wixNyckel(email);
    for (let forsok = 0; forsok < 2; forsok++) {
      const fanns = await hamta(K.nyhetsbrev, id);
      if (fanns) {
        await patcha(
          K.nyhetsbrev,
          id,
          andringar({ status: "subscribed", consent, source: str(fanns.source) ?? source, updatedAt: nu() }),
        );
        return { already: true };
      }
      const tid = nu();
      const r = await infoga(K.nyhetsbrev, id, { email, subscribedAt: tid, source, status: "subscribed", consent, updatedAt: tid });
      if (r === "skapad") return { already: false };
      // Någon hann skapa raden emellan: uppdatera den i stället.
    }
    return { already: true };
  },

  /** `INSERT … ('unsubscribe-link','unsubscribed',FALSE) ON CONFLICT DO UPDATE SET status='unsubscribed'`. */
  async avregistrera(email: string): Promise<void> {
    const id = wixNyckel(email);
    for (let forsok = 0; forsok < 2; forsok++) {
      const p = await patcha(K.nyhetsbrev, id, [satt("status", "unsubscribed"), satt("updatedAt", nu())]);
      if (p.utfall === "applied") return;
      const tid = nu();
      const r = await infoga(K.nyhetsbrev, id, {
        email,
        subscribedAt: tid,
        source: "unsubscribe-link",
        status: "unsubscribed",
        consent: false,
        updatedAt: tid,
      });
      if (r === "skapad") return;
    }
    throw new Error("nyhetsbrev.avregistrera: raden gick varken att ändra eller skapa");
  },

  async arAvregistrerad(email: string): Promise<boolean> {
    const rad = await hamta(K.nyhetsbrev, wixNyckel(email));
    return rad?.status === "unsubscribed";
  },

  async raknaNyaSedan(sedanIso: string): Promise<number> {
    return rakna(K.nyhetsbrev, { subscribedAt: { $gte: sedanIso }, status: "subscribed" });
  },

  async raknaPrenumeranter(): Promise<number> {
    return rakna(K.nyhetsbrev, { status: "subscribed" });
  },
};

// ── orders → FyndplatsOrdrar ─────────────────────────────────────────────────

export interface OrderSpegelRad {
  total_minor: number;
  currency: string;
  items_json: unknown[];
  created_at: string;
}

export const ordrar = {
  franPostgres(r: Rad): WixRad {
    const email = str(r.email);
    return {
      id: wixNyckel(String(r.id)),
      data: utanTomma({
        orderId: String(r.id),
        orderNumber: str(r.order_number),
        email,
        emailLower: email ? email.toLowerCase() : null,
        totalMinor: num(r.total_minor),
        currency: String(r.currency ?? "SEK"),
        itemCount: num(r.item_count),
        items: jsonVarde<unknown[]>(r.items_json, []),
        createdAt: iso(r.created_at),
        recordedAt: iso(r.recorded_at),
      }),
    };
  },

  /** `ON CONFLICT (id) DO NOTHING`: inserted = raden var ny. */
  async spegla(v: {
    id: string;
    orderNumber: string | null;
    email: string | null;
    totalMinor: number;
    currency: string;
    itemCount: number;
    items: unknown[];
    createdAt: string;
  }): Promise<{ inserted: boolean }> {
    const r = await infoga(K.ordrar, wixNyckel(v.id), {
      orderId: v.id,
      orderNumber: v.orderNumber,
      email: v.email,
      emailLower: v.email ? v.email.toLowerCase() : null,
      totalMinor: v.totalMinor,
      currency: v.currency,
      itemCount: v.itemCount,
      items: v.items,
      createdAt: iso(v.createdAt) ?? nu(),
      recordedAt: nu(),
    });
    return { inserted: r === "skapad" };
  },

  async sedan(sedanIso: string): Promise<OrderSpegelRad[]> {
    const rader = await allaRader(K.ordrar, {
      filter: { createdAt: { $gte: sedanIso } },
      sort: [{ fieldName: "createdAt", order: "DESC" }],
    });
    return rader.map((d) => ({
      total_minor: num(d.totalMinor),
      currency: String(d.currency ?? "SEK"),
      items_json: Array.isArray(d.items) ? d.items : [],
      created_at: String(d.createdAt ?? ""),
    }));
  },

  /** Orderns rader, matchat på ordernummer och e-post (`lower(email)`). */
  async raderFor(orderNumber: string, emailLower: string): Promise<unknown[] | null> {
    const [rad] = await fraga(K.ordrar, { filter: { orderNumber, emailLower }, limit: 1 });
    if (!rad) return null;
    return Array.isArray(rad.items) ? rad.items : [];
  },
};

// ── trustpilot_invites → FyndplatsTrustpilotInbjudningar ─────────────────────

export const trustpilot = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.order_id)),
      data: utanTomma({
        orderId: String(r.order_id),
        email: String(r.email ?? ""),
        channel: String(r.channel ?? ""),
        resendId: str(r.resend_id),
        sentAt: iso(r.sent_at),
      }),
    };
  },
  async finns(orderId: string): Promise<boolean> {
    return (await hamta(K.trustpilot, wixNyckel(orderId))) !== null;
  },
  async registrera(orderId: string, email: string, channel: string, resendId: string | null): Promise<void> {
    await infoga(K.trustpilot, wixNyckel(orderId), { orderId, email, channel, resendId, sentAt: nu() });
  },
};

// ── price_history → FyndplatsPrishistorik ────────────────────────────────────

/** YYYY-MM-DD ur ett Postgres-datum eller en sträng. */
export function datumStrang(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v ?? "").slice(0, 10);
}

export const prishistorik = {
  franPostgres(r: Rad): WixRad {
    const datum = datumStrang(r.observed_on);
    return {
      id: sammansatt(String(r.product_id), datum),
      data: utanTomma({
        productId: String(r.product_id),
        observedOn: datum,
        priceMinor: num(r.price_minor),
        currency: String(r.currency ?? "SEK"),
        recordedAt: iso(r.recorded_at),
      }),
    };
  },

  /** Dagens pris för många produkter. Samma (produkt, dag) skrivs om, inte till. */
  async sparaDag(datum: string, rader: { produktId: string; prisMinor: number; valuta: string }[]): Promise<Massutfall> {
    const tid = nu();
    return sparaManga(
      K.prishistorik,
      rader.map((r) => ({
        id: sammansatt(r.produktId, datum),
        data: { productId: r.produktId, observedOn: datum, priceMinor: r.prisMinor, currency: r.valuta, recordedAt: tid },
      })),
    );
  },

  /** Tar bort rader äldre än `foreDatum`. Svarar med hur många som togs bort. */
  async gallra(foreDatum: string): Promise<number> {
    const gamla = await allaRader(K.prishistorik, { filter: { observedOn: { $lt: foreDatum } } });
    if (gamla.length === 0) return 0;
    const r = await taBortManga(K.prishistorik, gamla.map((g) => String(g._id)));
    if (r.fel.length) throw new Error(`prishistorik.gallra: ${r.fel.length} fel, första: ${r.fel[0]}`);
    return r.borttagna;
  },

  async forProdukt(produktId: string, sedanDatum: string): Promise<{ datum: string; prisMinor: number }[]> {
    const rader = await allaRader(K.prishistorik, {
      filter: { productId: produktId, observedOn: { $gte: sedanDatum } },
      sort: [{ fieldName: "observedOn", order: "ASC" }],
    });
    return rader.map((r) => ({ datum: String(r.observedOn), prisMinor: num(r.priceMinor) }));
  },
};

// ── withdrawal_requests → FyndplatsAngerarenden ──────────────────────────────

export const angerarenden = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.id)),
      data: utanTomma({
        caseId: String(r.id),
        orderNumber: str(r.order_number),
        email: String(r.email ?? ""),
        items: jsonVarde<unknown[]>(r.items_json, []),
        reason: str(r.reason),
        matchedOrder: Boolean(r.matched_order),
        createdAt: iso(r.created_at),
      }),
    };
  },
  async logga(v: { caseId: string; orderNumber: string | null; email: string; items: unknown[]; reason: string | null; matchedOrder: boolean }): Promise<void> {
    await infoga(K.angerarenden, wixNyckel(v.caseId), { ...v, createdAt: nu() });
  },
};

// ── shipping_email_queue → FyndplatsFraktmejlKo ──────────────────────────────

export interface KoadRad {
  trackingNumber: string;
  carrier: string | null;
  lineItems: unknown[];
}

/** Hur länge `taVantande` väntar på en annan instans lås innan den ger upp (cronen tar resten). */
const KO_LAS_VANTA_MS = [500, 1_000, 1_500, 2_000];

export const fraktmejlKo = {
  franPostgres(r: Rad): WixRad {
    return {
      id: wixNyckel(String(r.tracking_number)),
      data: utanTomma({
        trackingNumber: String(r.tracking_number),
        orderGuid: String(r.order_guid),
        carrier: str(r.carrier),
        lineItems: jsonVarde<unknown[]>(r.line_items, []),
        queuedAt: iso(r.queued_at),
        sentAt: iso(r.sent_at),
      }),
    };
  },

  /** `ON CONFLICT (tracking_number) DO NOTHING`. */
  async koa(orderGuid: string, s: { trackingNumber: string; carrier: string | null; lineItems: unknown[] }): Promise<void> {
    await infoga(K.fraktmejlKo, wixNyckel(s.trackingNumber), {
      trackingNumber: s.trackingNumber,
      orderGuid,
      carrier: s.carrier,
      lineItems: s.lineItems,
      queuedAt: nu(),
    });
  },

  /**
   * Tar alla orderns väntande nummer. ☠️ Postgres gjorde det i EN sats
   * (`UPDATE … WHERE sent_at IS NULL RETURNING`). Utan låset hade två
   * samtidiga anrop kunnat ta ett nummer var, och kunden fått två mejl.
   * Varje rad tas dessutom villkorat, så ett nummer aldrig tas två gånger.
   */
  async taVantande(orderGuid: string): Promise<KoadRad[]> {
    const lasNamn = `fraktmejl__${orderGuid}`;
    let token = await taLas(lasNamn);
    for (let i = 0; !token && i < KO_LAS_VANTA_MS.length; i++) {
      await vantaStandard(KO_LAS_VANTA_MS[i]);
      token = await taLas(lasNamn);
    }
    if (!token) return []; // en annan instans skickar; cronen tar det som blir kvar
    try {
      const vantande = await allaRader(K.fraktmejlKo, { filter: { orderGuid, sentAt: { $exists: false } } });
      const tagna: KoadRad[] = [];
      const tid = nu();
      for (const r of vantande) {
        const p = await patcha(K.fraktmejlKo, String(r._id), [satt("sentAt", tid)], { sentAt: { $exists: false } });
        if (p.utfall !== "applied") continue;
        tagna.push({
          trackingNumber: String(r.trackingNumber ?? r._id),
          carrier: str(r.carrier),
          lineItems: Array.isArray(r.lineItems) ? r.lineItems : [],
        });
      }
      return tagna.sort((a, b) => a.trackingNumber.localeCompare(b.trackingNumber));
    } finally {
      await slappLas(lasNamn, token);
    }
  },

  /** Lämnar tillbaka numret: fältet tas bort, inte sätts till null. */
  async slapp(trackingNumber: string): Promise<void> {
    await patcha(K.fraktmejlKo, wixNyckel(trackingNumber), [taBortFalt("sentAt")]);
  },

  /** Ordrar vars äldsta väntande nummer köades före `foreIso`. */
  async ordrarSomVantat(foreIso: string, max: number): Promise<string[]> {
    const rader = await allaRader(K.fraktmejlKo, {
      filter: { sentAt: { $exists: false }, queuedAt: { $lt: foreIso } },
      sort: [{ fieldName: "queuedAt", order: "ASC" }],
    });
    const ut: string[] = [];
    for (const r of rader) {
      const g = String(r.orderGuid ?? "");
      if (g && !ut.includes(g)) ut.push(g);
      if (ut.length >= max) break;
    }
    return ut;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Kopian: varje Postgres-tabell, dess kollektion och dess översättning
// ─────────────────────────────────────────────────────────────────────────────

export interface Tabell {
  /** Tabellen i Neon. */
  tabell: string;
  kollektion: string;
  /** SQL-uttrycken raderna läses i ordning efter (primärnyckeln). */
  ordning: string[];
  /** Kolumnerna som läses, om inte alla. */
  kolumner?: string;
  franPostgres(r: Rad): WixRad;
  /** När raden senast ändrades i Neon, för delta-läget. */
  andrad(r: Rad): number | undefined;
}

const ms = (v: unknown) => {
  const s = iso(v);
  return s ? Date.parse(s) : undefined;
};
const senast = (...v: unknown[]) => {
  const t = v.map(ms).filter((x): x is number => x !== undefined);
  return t.length ? Math.max(...t) : undefined;
};

export const TABELLER: Tabell[] = [
  { tabell: "abandoned_carts", kollektion: K.kundvagnar, ordning: ["id"], franPostgres: kundvagnar.franPostgres, andrad: (r) => senast(r.updated_at, r.created_at) },
  { tabell: "sent_emails", kollektion: K.kundvagnMejl, ordning: ["id"], franPostgres: kundvagnMejl.franPostgres, andrad: (r) => ms(r.sent_at) },
  { tabell: "used_addresses", kollektion: K.anvandaAdresser, ordning: ["hash"], franPostgres: anvandaAdresser.franPostgres, andrad: (r) => ms(r.first_seen) },
  { tabell: "tracking_mapping", kollektion: K.sparning, ordning: ["tracking_number"], franPostgres: sparning.franPostgres, andrad: (r) => senast(r.updated_at, r.created_at, r.levererad_at) },
  { tabell: "sms_audit", kollektion: K.smsLogg, ordning: ["id"], franPostgres: smsLogg.franPostgres, andrad: (r) => ms(r.received_at) },
  { tabell: "sms_unmatched", kollektion: K.smsOmatchade, ordning: ["id"], franPostgres: smsOmatchade.franPostgres, andrad: (r) => ms(r.received_at) },
  { tabell: "delivery_notifications", kollektion: K.leveransnotiser, ordning: ["tracking_number", "status"], franPostgres: leveransnotiser.franPostgres, andrad: (r) => ms(r.sent_at) },
  { tabell: "webhook_email_sent", kollektion: K.webhookMejl, ordning: ["event_key"], franPostgres: webhookMejl.franPostgres, andrad: (r) => ms(r.sent_at) },
  { tabell: "newsletter_subscribers", kollektion: K.nyhetsbrev, ordning: ["email"], franPostgres: nyhetsbrev.franPostgres, andrad: (r) => senast(r.updated_at, r.subscribed_at) },
  { tabell: "orders", kollektion: K.ordrar, ordning: ["id"], franPostgres: ordrar.franPostgres, andrad: (r) => senast(r.recorded_at, r.created_at) },
  { tabell: "trustpilot_invites", kollektion: K.trustpilot, ordning: ["order_id"], franPostgres: trustpilot.franPostgres, andrad: (r) => ms(r.sent_at) },
  // Datumet som text: drivrutinen gör annars en Date av det i serverns tidszon.
  { tabell: "price_history", kollektion: K.prishistorik, ordning: ["product_id", "observed_on::text"], kolumner: "product_id, observed_on::text AS observed_on, price_minor, currency, recorded_at", franPostgres: prishistorik.franPostgres, andrad: (r) => ms(r.recorded_at) },
  { tabell: "order_confirmation_sent", kollektion: K.orderbekraftelser, ordning: ["order_id"], franPostgres: orderbekraftelser.franPostgres, andrad: (r) => ms(r.sent_at) },
  { tabell: "withdrawal_requests", kollektion: K.angerarenden, ordning: ["id"], franPostgres: angerarenden.franPostgres, andrad: (r) => ms(r.created_at) },
  { tabell: "shipping_email_queue", kollektion: K.fraktmejlKo, ordning: ["tracking_number"], franPostgres: fraktmejlKo.franPostgres, andrad: (r) => senast(r.sent_at, r.queued_at) },
];
