// Wix Data (CMS) för motorns drift-data. EN klient, använd av alla lager.
//
// VARFÖR DEN FINNS (2026-10-29). Drift-datan flyttar tillbaka från Neon till
// Wix CMS: Elite-planen tar 10 miljoner rader, och taket på 4 000 som drev ut
// den 2026-08-31 gäller inte längre. Den gamla Wix-vägen låg kvar i varje
// modul för sig, och den bar tak som var ofarliga när datan var liten:
//
//   - auktionskön lästes med EN sida om 1 000 rader (kön är 4 522),
//   - importkostnaderna likaså (1 283 rader),
//   - recensionernas betyg grupperades i en sida om 1 000 produkter,
//   - offset-sidningen sorterade om hela kollektionen för varje sida.
//
// En lista som kapas tyst är värre än ett fel. Den här klienten läser med
// markör till slutet, och KASTAR i stället för att kapa.
//
// ☠️ KVOTERNA ÄR SAJTENS, INTE MOTORNS: 3 000 läsningar och 1 500 skrivningar
// i minuten för hela sajten, och 5 sekunder per fråga
// (support.wix.com/en/article/velo-about-data-quotas). Över kvoten svarar Wix
// WDE0014, och ett sådant anrop kördes aldrig — så det får alltid göras om,
// även en skrivning. En fråga som tar mer än 5 sekunder svarar WDE0028; en
// läsning får göras om, ett anspråk aldrig (det kan ha gått igenom).
//
// TRE SLAGS ANROP, och de försöks om olika:
//   lasning     get, query, count, aggregate — gör ingenting, alltid säkert.
//   idempotent  save, bulk save, remove, patch utan villkor — ett andra försök
//               gör samma sak en gång till.
//   engang      insert (ett anspråk) och villkorad patch (CAS) — försöks bara
//               om när Wix BEVISLIGEN inte körde anropet (429/WDE0014). Efter
//               ett nätverksfel vet vi inte, och då avgör en återläsning.

import { randomUUID } from "node:crypto";

export const WIX_DATA_BAS = "https://www.wixapis.com/data/v2";

export type Slag = "lasning" | "idempotent" | "engang";

/** Ett fel från Wix Data, med status och WDE-kod så anroparen kan skilja dem åt. */
export class WixDataFel extends Error {
  constructor(
    readonly operation: string,
    readonly kollektion: string,
    /** 0 = nätverksfel, inget svar kom. */
    readonly status: number,
    readonly kod: string | null,
    meddelande: string,
  ) {
    super(meddelande);
    this.name = "WixDataFel";
  }
}

/** Kollektioner vars felkroppar aldrig loggas: ett valideringsfel kan eka
 *  fält ur raden, och tokenraden bär AliExpress-nycklarna. */
function arKanslig(kollektion: string): boolean {
  return kollektion === (process.env.WIX_DATA_COL_TOKENS ?? "FyndplatsAliExpressTokens");
}

export interface Klientval {
  /** Väntan mellan försöken. Byts i tester. */
  vanta?: (ms: number) => Promise<void>;
  /** Rubrikerna. Byts i tester och av den som pratar med en annan sajt. */
  rubriker?: () => Record<string, string>;
}

export function wixDataRubriker(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

let vantaStandard = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Endast för tester: byter väntan mellan försöken (och efter ett tvetydigt anspråk). */
export function __sattVantaForTester(f: ((ms: number) => Promise<void>) | null): void {
  vantaStandard = f ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
}

/** Pauserna före varje försök. Fyra försök totalt, 12 sekunder som mest. */
export const PAUSER_MS = [0, 1_000, 3_000, 8_000];

/** Första WDE-koden i ett svar, eller null. */
export function wdeKod(text: string): string | null {
  return /WDE\d{4}/.exec(text)?.[0] ?? null;
}

/**
 * Får anropet göras om efter det här svaret?
 *
 * ☠️ KVOTEN FÖRST, OCH FÖR ALLA SLAG. 429 och WDE0014 betyder att Wix vägrade
 * anropet innan det kördes. Utan återförsök där hade varje kvotstopp blivit ett
 * tappat anspråk eller en tappad skrivning, och kvoten delas med hela sajten.
 */
export function kanForsokaIgen(status: number, kod: string | null, slag: Slag): boolean {
  if (status === 429 || kod === "WDE0014") return true;
  if (slag === "engang") return false;
  if (status === 0) return true;
  if (status >= 500) return true;
  return kod === "WDE0028";
}

interface Svar<T> {
  ok: boolean;
  status: number;
  kod: string | null;
  text: string;
  json: T | null;
  /** Wix `Retry-After`, i millisekunder, när svaret bar en. */
  vantaMs?: number;
}

/** Längsta väntan vi följer från `Retry-After`. Längre än så och lambdan hinner inte. */
const MAX_RETRY_AFTER_MS = 30_000;

async function anropa<T>(
  operation: string,
  kollektion: string,
  metod: "GET" | "POST" | "PATCH" | "DELETE",
  sokvag: string,
  kropp: unknown,
  slag: Slag,
  val: Klientval = {},
): Promise<Svar<T>> {
  // ☠️ Rubrikerna UTANFÖR loopen: ett saknat token är inte övergående, och
  // inuti försöken hade det rapporterats som ett nätverksfel fyra gånger.
  const rubriker = (val.rubriker ?? wixDataRubriker)();
  const vanta = val.vanta ?? ((ms: number) => vantaStandard(ms));
  let senaste: Svar<T> = { ok: false, status: 0, kod: null, text: "", json: null };
  for (let i = 0; i < PAUSER_MS.length; i++) {
    if (i > 0) {
      // Ett återförsök som lyckas syns annars ingenstans. Raden gör övergående fel mätbara.
      console.warn(
        `[wix-data] försöker om ${operation} ${kollektion} (${senaste.status || "nätverk"}${senaste.kod ? ` ${senaste.kod}` : ""})`,
      );
      await vanta(Math.max(PAUSER_MS[i], Math.min(senaste.vantaMs ?? 0, MAX_RETRY_AFTER_MS)));
    }
    let res: Response;
    try {
      res = await fetch(`${WIX_DATA_BAS}${sokvag}`, {
        method: metod,
        headers: rubriker,
        body: kropp === undefined ? undefined : JSON.stringify(kropp),
      });
    } catch (e) {
      senaste = {
        ok: false,
        status: 0,
        kod: null,
        text: `nätverksfel: ${String((e as Error)?.message ?? e).slice(0, 200)}`,
        json: null,
      };
      if (kanForsokaIgen(0, null, slag)) continue;
      return senaste;
    }
    const text = await res.text();
    if (res.ok) {
      try {
        return { ok: true, status: res.status, kod: null, text: "", json: text ? (JSON.parse(text) as T) : ({} as T) };
      } catch {
        // ☠️ Ett 200-svar som inte går att läsa är ett FEL, inte en tom sida:
        // tolkat som tomt hade `allaRader` slutat mitt i och svarat med en halv lista.
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
  const kropp = arKanslig(kollektion) ? "[redacted]" : s.text.slice(0, 300);
  return new WixDataFel(
    operation,
    kollektion,
    s.status,
    s.kod,
    `Wix Data ${operation} ${kollektion} (${s.status || "nätverk"}${s.kod ? ` ${s.kod}` : ""}): ${kropp}`,
  );
}

/** Wix egna fält på en rad. `_id` behålls: flera lager använder den som nyckel. */
export const SYSTEMFALT = ["_owner", "_createdDate", "_updatedDate", "anspraksToken"] as const;

/** Raden utan Wix systemfält (utom `_id`) och utan anspråkets token. */
export function utanSystemfalt<T>(rad: Record<string, unknown>): T {
  const ut = { ...rad };
  for (const f of SYSTEMFALT) delete ut[f];
  return ut as T;
}

/** En rad som Wix lagrar den: data med `_id`. */
export interface WixRad {
  id: string;
  data: Record<string, unknown>;
}

function datum(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && typeof (v as { $date?: unknown }).$date === "string") {
    return (v as { $date: string }).$date;
  }
  return null;
}

/** När Wix senast skrev raden (`_updatedDate`), eller null. Wix svarar ibland `{"$date": …}`. */
export function uppdateradAt(rad: Record<string, unknown>): string | null {
  return datum(rad._updatedDate);
}

/** När Wix skapade raden (`_createdDate`), eller null. */
export function skapadAt(rad: Record<string, unknown>): string | null {
  return datum(rad._createdDate);
}

// ── läsning ──────────────────────────────────────────────────────────────────

/**
 * En rad, eller null om den inte finns.
 *
 * ☠️ EN SAKNAD KOLLEKTION ÄR ETT FEL, inte en tom rad. Den gamla vägen tog
 * 404 och "unknown collection" som tomt, vilket var rätt innan kollektionerna
 * fanns. Efter flytten hade en felstavad eller raderad kollektion sett ut
 * precis som en tom databas — samma tystnad som `/api/tracking-events`
 * 2026-09-01.
 */
export async function hamta<T = Record<string, unknown>>(
  kollektion: string,
  id: string,
  opts: { medSystemfalt?: boolean } & Klientval = {},
): Promise<T | null> {
  const s = await anropa<{ dataItem?: { data?: Record<string, unknown> } }>(
    "get",
    kollektion,
    "GET",
    `/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(kollektion)}`,
    undefined,
    "lasning",
    opts,
  );
  if (!s.ok) {
    if (s.kod === "WDE0073" || (s.status === 404 && s.kod !== "WDE0025")) return null;
    throw felFor("get", kollektion, s);
  }
  const data = s.json?.dataItem?.data;
  if (!data) return null;
  return (opts.medSystemfalt ? data : utanSystemfalt(data)) as T;
}

export type Sortering = { fieldName: string; order: "ASC" | "DESC" }[];

/** EN sida. För topp-N-läsningar (senaste händelser, köns huvud). */
export async function fraga<T = Record<string, unknown>>(
  kollektion: string,
  q: { filter?: Record<string, unknown>; sort?: Sortering; limit: number; offset?: number },
  opts: { medSystemfalt?: boolean } & Klientval = {},
): Promise<T[]> {
  if (q.limit > 1000) throw new Error(`fraga(${kollektion}): limit ${q.limit} > 1000 — använd allaRader`);
  const paging: Record<string, number> = { limit: q.limit };
  if (q.offset) paging.offset = q.offset;
  const s = await anropa<{ dataItems?: { data?: Record<string, unknown> }[] }>(
    "query",
    kollektion,
    "POST",
    "/items/query",
    { dataCollectionId: kollektion, query: { filter: q.filter ?? {}, sort: q.sort ?? [], paging } },
    "lasning",
    opts,
  );
  if (!s.ok) throw felFor("query", kollektion, s);
  return (s.json?.dataItems ?? [])
    .map((d) => d.data)
    .filter((d): d is Record<string, unknown> => Boolean(d))
    .map((d) => (opts.medSystemfalt ? d : utanSystemfalt(d)) as T);
}

/** Högsta antal rader `allaRader` läser innan den kastar. Elite tar 10 miljoner. */
export const ALLA_RADER_TAK = 500_000;

/**
 * ALLA rader som matchar, med markör till slutet.
 *
 * ☠️ MARKÖR, INTE OFFSET. Offset-sidningen sorterade om hela kollektionen för
 * varje sida och behövde ett tak för att inte gå i evighet. Markören går
 * framåt och slutar när Wix inte har någon nästa sida.
 *
 * Filtret och sorteringen skickas BARA i första anropet. Wix dokumentation:
 * "filter and sort are ignored on subsequent cursor requests".
 *
 * Sidan är högst 1 000 rader. Kollektionsschemat påstår 100 för markör
 * ("maxPageSize … 100 for cursor-based queries"), men uppmätt 2026-10-29 mot
 * FyndplatsRedirects gav `cursorPaging.limit: 1000` alla 555 rader i ett svar.
 *
 * Kastar hellre än kapar: över `tak` rader, eller om samma markör kommer
 * tillbaka två gånger (en loop som annars hade gått tills lambdan dog).
 *
 * `falt` begränsar svaret till de fälten (och `_id`). Skickas med på VARJE
 * sida, inte bara den första: uppmätt 2026-10-29 att Wix tar emot `fields`
 * tillsammans med markören och svarar med bara de fälten. Att markören bär
 * urvalet själv, som den bär filtret, är inte mätt, och Stores sökning gör
 * det inte (CLAUDE.md, "`fields` är TVÄRTOM").
 */
export async function allaRader<T = Record<string, unknown>>(
  kollektion: string,
  q: { filter?: Record<string, unknown>; sort?: Sortering; sidstorlek?: number; tak?: number; falt?: readonly string[] } = {},
  opts: { medSystemfalt?: boolean } & Klientval = {},
): Promise<T[]> {
  const sid = Math.min(Math.max(1, q.sidstorlek ?? 1000), 1000);
  const tak = q.tak ?? ALLA_RADER_TAK;
  const ut: T[] = [];
  const sedda = new Set<string>();
  const markorer = new Set<string>();
  let markor: string | null = null;
  for (;;) {
    const query: Record<string, unknown> = markor
      ? { cursorPaging: { limit: sid, cursor: markor } }
      : { filter: q.filter ?? {}, sort: q.sort ?? [], cursorPaging: { limit: sid } };
    if (q.falt?.length) query.fields = [...q.falt];
    const s = await anropa<{
      dataItems?: { data?: Record<string, unknown> }[];
      pagingMetadata?: { cursors?: { next?: string | null } };
    }>("query", kollektion, "POST", "/items/query", { dataCollectionId: kollektion, query }, "lasning", opts);
    if (!s.ok) throw felFor("query", kollektion, s);
    const sida = (s.json?.dataItems ?? []).map((d) => d.data).filter((d): d is Record<string, unknown> => Boolean(d));
    for (const d of sida) {
      const id = typeof d._id === "string" ? d._id : null;
      if (id) {
        if (sedda.has(id)) continue;
        sedda.add(id);
      }
      ut.push((opts.medSystemfalt ? d : utanSystemfalt(d)) as T);
    }
    if (ut.length > tak) {
      throw new Error(`allaRader(${kollektion}) passerade ${tak} rader — en kapad lista är värre än ett fel.`);
    }
    const nasta = s.json?.pagingMetadata?.cursors?.next ?? null;
    if (!nasta || sida.length === 0) return ut;
    if (markorer.has(nasta)) throw new Error(`allaRader(${kollektion}): samma markör två gånger`);
    markorer.add(nasta);
    markor = nasta;
  }
}

/** Antal rader som matchar filtret. */
export async function rakna(
  kollektion: string,
  filter: Record<string, unknown> = {},
  val: Klientval = {},
): Promise<number> {
  const s = await anropa<{ totalCount?: number }>(
    "count",
    kollektion,
    "POST",
    "/items/count",
    { dataCollectionId: kollektion, filter },
    "lasning",
    val,
  );
  if (!s.ok) throw felFor("count", kollektion, s);
  const n = s.json?.totalCount;
  if (typeof n !== "number") throw new Error(`count(${kollektion}) svarade utan totalCount`);
  return n;
}

// ── skrivning ────────────────────────────────────────────────────────────────

/** Sparar raden (skapar eller ersätter HELA raden). `_id` sätts till `id`. */
export async function spara(
  kollektion: string,
  id: string,
  data: Record<string, unknown>,
  val: Klientval = {},
): Promise<void> {
  const s = await anropa(
    "save",
    kollektion,
    "POST",
    "/items/save",
    { dataCollectionId: kollektion, dataItem: { id, dataCollectionId: kollektion, data: { ...data, _id: id } } },
    "idempotent",
    val,
  );
  if (!s.ok) throw felFor("save", kollektion, s);
}

/** Högst så här många rader och byte per massanrop. Wix tar 1 000 rader; bytetaket är vårt. */
export const MASSA_RADER = 100;
export const MASSA_BYTE = 1_500_000;

/** Delar rader i omgångar under båda taken. En ensam rad över bytetaket får en egen omgång. */
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

export interface Massutfall {
  sparade: number;
  fel: { id: string; fel: string }[];
}

/**
 * Sparar många rader (skapar eller ersätter), i omgångar.
 *
 * ☠️ EN RAD RÄKNAS BARA NÄR WIX UTTRYCKLIGEN BEKRÄFTAT DEN. Samma tre regler
 * som lagersynkens `tolkaBulkUtfall`: en rad Wix inte nämner är inte bevisat
 * sparad, `undetailedFailures` gör hela omgången oadresserbar, och ett saknat
 * id härleds ur `originalIndex` mot det vi faktiskt skickade.
 */
export async function sparaManga(kollektion: string, rader: WixRad[], val: Klientval = {}): Promise<Massutfall> {
  const utfall: Massutfall = { sparade: 0, fel: [] };
  const omgangar = iOmgangar(rader, (r) => JSON.stringify(r.data).length + 64);
  for (const omgang of omgangar) {
    const s = await anropa<{
      results?: { itemMetadata?: { id?: string; originalIndex?: number; success?: boolean; error?: { code?: string; description?: string } } }[];
      bulkActionMetadata?: { totalSuccesses?: number; totalFailures?: number; undetailedFailures?: number };
    }>(
      "bulk-save",
      kollektion,
      "POST",
      "/bulk/items/save",
      {
        dataCollectionId: kollektion,
        dataItems: omgang.map((r) => ({ id: r.id, dataCollectionId: kollektion, data: { ...r.data, _id: r.id } })),
      },
      "idempotent",
      val,
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
 * ETT ANSPRÅK: skapar raden bara om `id` inte redan finns.
 *
 * Wix svarar WDE0074 när id:t finns ("WD_ITEM_ALREADY_EXISTS"), och det är
 * hela låset: den som får in raden äger den. Samma regel som Postgres
 * `insert … on conflict do nothing returning`.
 *
 * ☠️ EFTER ETT NÄTVERKSFEL VET VI INTE OM ANSPRÅKET GICK IGENOM. Ett blint
 * nytt försök hade fått WDE0074 av VÅR EGEN rad och svarat "fanns" — och då
 * hade ingen skickat mejlet. Raden bär därför en token, och tvetydigheten
 * avgörs genom att läsa tillbaka: vår token = vi äger raden.
 */
export async function infoga(
  kollektion: string,
  id: string,
  data: Record<string, unknown>,
  val: Klientval = {},
): Promise<Infogat> {
  const token = randomUUID();
  for (let forsok = 0; forsok < 3; forsok++) {
    const s = await anropa(
      "insert",
      kollektion,
      "POST",
      "/items",
      { dataCollectionId: kollektion, dataItem: { id, data: { ...data, _id: id, anspraksToken: token } } },
      "engang",
      val,
    );
    if (s.ok) return "skapad";
    if (s.kod === "WDE0074") {
      // Fanns raden redan av ett tidigare, tvetydigt försök från oss själva?
      if (forsok === 0) return "fanns";
      const rad = await hamta<Record<string, unknown>>(kollektion, id, { ...val, medSystemfalt: true });
      return rad?.anspraksToken === token ? "skapad" : "fanns";
    }
    if (!(s.status === 0 || s.status >= 500)) throw felFor("insert", kollektion, s);
    // Tvetydigt: läs tillbaka.
    const rad = await hamta<Record<string, unknown>>(kollektion, id, { ...val, medSystemfalt: true });
    if (rad) return rad.anspraksToken === token ? "skapad" : "fanns";
    await (val.vanta ?? ((ms: number) => vantaStandard(ms)))(PAUSER_MS[forsok + 1] ?? 3_000);
  }
  throw new Error(`insert ${kollektion}: tre tvetydiga försök i rad`);
}

export type Faltandring =
  | { action: "SET_FIELD"; fieldPath: string; setFieldOptions: { value: unknown } }
  | { action: "REMOVE_FIELD"; fieldPath: string };

export const satt = (fieldPath: string, value: unknown): Faltandring => ({
  action: "SET_FIELD",
  fieldPath,
  setFieldOptions: { value },
});
export const taBortFalt = (fieldPath: string): Faltandring => ({ action: "REMOVE_FIELD", fieldPath });

export type Patchutfall = "applied" | "condition-failed" | "not-found";

/**
 * Ändrar bara de angivna fälten. Med `villkor` är det en atomisk
 * compare-and-set: uppmätt mot riktig Wix Data (lib/store/wix-data.ts) — två
 * samtidiga villkorade patchar → exakt EN lyckas, förloraren får 428 WDE0193.
 */
export async function patcha(
  kollektion: string,
  id: string,
  andringar: Faltandring[],
  villkor?: Record<string, unknown>,
  val: Klientval = {},
): Promise<Patchutfall> {
  const s = await anropa(
    "patch",
    kollektion,
    "PATCH",
    `/items/${encodeURIComponent(id)}`,
    {
      dataCollectionId: kollektion,
      patch: { dataItemId: id, fieldModifications: andringar },
      ...(villkor ? { condition: { filter: villkor } } : {}),
    },
    villkor ? "engang" : "idempotent",
    val,
  );
  if (s.ok) return "applied";
  if (s.kod === "WDE0193" || (s.status === 428 && villkor)) return "condition-failed";
  if (s.kod === "WDE0073" || (s.status === 404 && s.kod !== "WDE0025")) return "not-found";
  throw felFor("patch", kollektion, s);
}

export type Borttagning = "borttagen" | "fanns-inte" | "villkor";

/** Tar bort raden. Med `villkor` bara om raden matchar det. */
export async function taBort(
  kollektion: string,
  id: string,
  villkor?: Record<string, unknown>,
  val: Klientval = {},
): Promise<Borttagning> {
  const s = await anropa(
    "remove",
    kollektion,
    "DELETE",
    `/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(kollektion)}`,
    villkor ? { condition: { filter: villkor } } : undefined,
    villkor ? "engang" : "idempotent",
    val,
  );
  if (s.ok) return "borttagen";
  if (s.kod === "WDE0193" || (s.status === 428 && villkor)) return "villkor";
  if (s.kod === "WDE0073" || (s.status === 404 && s.kod !== "WDE0025")) return "fanns-inte";
  throw felFor("remove", kollektion, s);
}

/** Tar bort många rader per id, i omgångar om högst 1 000. En rad som redan var borta räknas inte som fel. */
export async function taBortManga(
  kollektion: string,
  idn: string[],
  val: Klientval = {},
): Promise<{ borttagna: number; fel: string[] }> {
  const ut = { borttagna: 0, fel: [] as string[] };
  for (let i = 0; i < idn.length; i += 1000) {
    const omgang = idn.slice(i, i + 1000);
    const s = await anropa<{
      results?: { itemMetadata?: { id?: string; success?: boolean; error?: { code?: string } } }[];
    }>("bulk-remove", kollektion, "POST", "/bulk/items/remove", { dataCollectionId: kollektion, dataItemIds: omgang }, "idempotent", val);
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

/** Asynkron massradering på filter. Wix svarar med ett jobb-id direkt; raderingen är inte klar då. */
export async function taBortMedFilter(
  kollektion: string,
  filter: Record<string, unknown>,
  val: Klientval = {},
): Promise<string> {
  if (!filter || Object.keys(filter).length === 0) {
    throw new Error(`taBortMedFilter(${kollektion}) utan filter — vägrar radera allt.`);
  }
  const s = await anropa<{ jobId?: string }>(
    "remove-by-filter",
    kollektion,
    "POST",
    "/bulk/items/async-remove-by-filter",
    { dataCollectionId: kollektion, filter },
    "idempotent",
    val,
  );
  if (!s.ok) throw felFor("remove-by-filter", kollektion, s);
  return s.json?.jobId ?? "";
}

/**
 * Wix egen aggregering, sida för sida. Grupperna kan bli fler än en sida
 * (recensionerna har omdömen på över 1 000 produkter), och en kapad
 * gruppering hade gett produkter utan stjärnor utan att något sa till.
 *
 * ☠️ SORTERAD PÅ GRUPPERINGSFÄLTEN (2026-10-29). Utan sortering kommer
 * grupperna i en annan ordning för varje anrop, och sidorna överlappar.
 * Uppmätt på recensionerna samma natt som motorn växlade till Wix, 3 663
 * grupper i fyra sidor:
 *
 *   offset utan sortering           2 625 unika
 *   markör utan sortering           2 504 unika
 *   båda, sorterade på productId    3 663 unika, 12 404 omdömen (= Neons tal)
 *
 * Antalet RADER var rätt hela tiden (1 000 + 1 000 + 1 000 + 663), så en
 * räknare hade inte sett felet. Korten för ~1 000 produkter tappade sina
 * stjärnor. En grupp som kommer två gånger KASTAR därför: då har ordningen
 * glidit igen, och en annan grupp saknas.
 */
export async function aggregera<T = Record<string, unknown>>(
  kollektion: string,
  kropp: {
    initialFilter?: Record<string, unknown>;
    aggregation: { groupingFields?: string[]; operations: Record<string, unknown>[] };
  },
  val: Klientval = {},
): Promise<T[]> {
  const falt = kropp.aggregation.groupingFields ?? [];
  const sortering = falt.map((fieldName) => ({ fieldName, order: "ASC" }));
  const sedda = new Set<string>();
  const ut: T[] = [];
  const sid = 1000;
  for (let offset = 0; offset <= ALLA_RADER_TAK; offset += sid) {
    const s = await anropa<{ results?: T[] }>(
      "aggregate",
      kollektion,
      "POST",
      "/items/aggregate",
      {
        dataCollectionId: kollektion,
        ...kropp,
        ...(sortering.length > 0 ? { sort: sortering } : {}),
        paging: { limit: sid, offset },
      },
      "lasning",
      val,
    );
    if (!s.ok) throw felFor("aggregate", kollektion, s);
    const sida = s.json?.results ?? [];
    for (const rad of sida) {
      const nyckel = JSON.stringify(falt.map((f) => (rad as Record<string, unknown>)[f] ?? null));
      if (sedda.has(nyckel)) {
        throw new Error(`aggregera(${kollektion}): samma grupp på två sidor — sidorna överlappar`);
      }
      sedda.add(nyckel);
    }
    ut.push(...sida);
    if (sida.length < sid) return ut;
  }
  throw new Error(`aggregera(${kollektion}) passerade ${ALLA_RADER_TAK} grupper`);
}
