// lib/neon-till-wix.ts
//
// Butikens tabeller ur Neon (Postgres) till Wix CMS, rad för rad. Samma regler
// som motorns lib/migration/neon-till-wix.ts (grenen main), porterade hit
// eftersom butiken har en EGEN Neon-databas (uppmätt 2026-10-29: motorns
// databas har inga andra tabeller än motorns).
//
// FYRA LÄGEN, alla per tabell och med markör:
//   plan       radantal i Neon och Wix (rutten, inte här).
//   kopiera    skriver varje Neon-rad som saknas i Wix eller skiljer sig.
//              Raderar ingenting. Före växlingen är Wix bara en kopia.
//   verifiera  jämför RAD FÖR RAD åt båda hållen och skriver ingenting.
//   delta      efter växlingen: en Neon-rad skrivs bara om Wix-raden saknas
//              och Neon ändrat den efter kopieringen, eller om Wix-raden skrevs
//              FÖRE växlingen. En Wix-rad som saknas i Neon tas bort bara om
//              både skapande och senaste skrivning ligger före växlingen.
//
// TVÅ SKILLNADER MOT MOTORN:
//   - Neon läses med en egen markör (radens ordningskolumner), inte med Wix
//     id. Wix id är ibland en hash (`wixNyckel`), och två tabeller har
//     sammansatta nycklar.
//   - Bakåt-passet frågar inte Neon per id utan läser tabellens alla Wix-id en
//     gång (`allaIdn`), av samma skäl.
//
// VIKTIGT: håll denna fil fri från lokala imports — den körs under
// `node --test --experimental-strip-types` via neon-till-wix.test.ts.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** En rad som den ska ligga i Wix. */
export interface KallRad {
  id: string;
  data: Record<string, unknown>;
  /** När raden senast ändrades i Neon (ms). Delta-läget behöver det. */
  andrad?: number;
}

export type WixPost = Record<string, unknown> & { _id: string };

export interface Kalla {
  namn: string;
  kollektion: string;
  /** Nästa tugga ur Neon efter markören (null = från början), och markören efter den. */
  lasNeon(efter: string | null, antal: number): Promise<{ rader: KallRad[]; nasta: string | null }>;
  raknaNeon(): Promise<number>;
  /** Alla Wix-id som tabellen ger, för bakåt-passet. */
  allaIdn(): Promise<Set<string>>;
}

export interface WixSida {
  hamtaIdn(kollektion: string, idn: string[]): Promise<WixPost[]>;
  sidaEfter(kollektion: string, efter: string | null, antal: number): Promise<WixPost[]>;
  rakna(kollektion: string): Promise<number>;
  spara(kollektion: string, rader: KallRad[]): Promise<{ sparade: number; fel: { id: string; fel: string }[] }>;
  taBort(kollektion: string, idn: string[]): Promise<{ borttagna: number; fel: string[] }>;
}

export type Lage = "kopiera" | "verifiera" | "delta";

export interface Markor {
  tabell: string;
  fas: "fram" | "bak";
  efter: string | null;
}

export interface TabellUtfall {
  tabell: string;
  granskade: number;
  lika: number;
  saknas: number;
  olika: number;
  wixNyare: number;
  extra: number;
  nyaIWix: number;
  borttagenIWix: number;
  skrivna: number;
  borttagna: number;
  /** Upp till fem id per slag. Rutten hashar dem innan de lämnar servern. */
  exempel: { saknas: string[]; olika: string[]; extra: string[] };
  olikaFalt: Record<string, number>;
  fel: string[];
}

export interface Summering {
  lage: Lage;
  dryRun: boolean;
  vaxling: string | null;
  tabeller: TabellUtfall[];
  markor: Markor | null;
  stoppadAv: "klart" | "tidsbudget";
}

export const TUGGA = 500;

const UTANFOR = new Set(["_id", "_owner", "_createdDate", "_updatedDate", "anspraksToken"]);

function sortera(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(sortera);
  if (x && typeof x === "object") {
    return Object.fromEntries(
      Object.keys(x as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortera((x as Record<string, unknown>)[k])]),
    );
  }
  return x;
}

/** Kanonisk JSON: nycklar sorterade rekursivt, arrayer i sin ordning. */
export function kanonisk(v: unknown): string {
  return JSON.stringify(sortera(v));
}

function normalisera(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalisera);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const nycklar = Object.keys(o);
    if (nycklar.length === 1 && nycklar[0] === "$date" && typeof o.$date === "string") {
      const t = Date.parse(o.$date);
      return Number.isNaN(t) ? o.$date : new Date(t).toISOString();
    }
    const ut: Record<string, unknown> = {};
    for (const k of nycklar) if (o[k] !== null && o[k] !== undefined) ut[k] = normalisera(o[k]);
    return ut;
  }
  return v;
}

/** Raden utan systemfält, null räknat som saknat, {$date} som ISO. */
export function jamforbar(rad: Record<string, unknown>): Record<string, unknown> {
  const ut: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rad)) {
    if (UTANFOR.has(k) || v === undefined || v === null) continue;
    ut[k] = normalisera(v);
  }
  return ut;
}

export function skiljandeFalt(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  const ja = jamforbar(a);
  const jb = jamforbar(b);
  const ut: string[] = [];
  for (const k of new Set([...Object.keys(ja), ...Object.keys(jb)])) {
    if (kanonisk(ja[k]) !== kanonisk(jb[k])) ut.push(k);
  }
  return ut.sort();
}

function tid(v: unknown): number {
  if (typeof v === "string") return Date.parse(v);
  if (v && typeof v === "object" && typeof (v as { $date?: unknown }).$date === "string") {
    return Date.parse((v as { $date: string }).$date);
  }
  return NaN;
}

function nyttUtfall(tabell: string): TabellUtfall {
  return {
    tabell,
    granskade: 0,
    lika: 0,
    saknas: 0,
    olika: 0,
    wixNyare: 0,
    extra: 0,
    nyaIWix: 0,
    borttagenIWix: 0,
    skrivna: 0,
    borttagna: 0,
    exempel: { saknas: [], olika: [], extra: [] },
    olikaFalt: {},
    fel: [],
  };
}

function exempel(lista: string[], id: string) {
  if (lista.length < 5) lista.push(id);
}

export interface SynkOptions {
  lage: Lage;
  /** Default SANT: räkna och jämför, skriv ingenting. */
  dryRun?: boolean;
  vaxling?: string | null;
  kopieradSedan?: string | null;
  efter?: Markor | null;
  baraTabeller?: string[];
  tidsbudgetMs?: number;
  now?: () => number;
}

export async function synka(kallor: Kalla[], wix: WixSida, opts: SynkOptions): Promise<Summering> {
  const dryRun = opts.lage === "verifiera" || opts.dryRun !== false;
  const now = opts.now ?? (() => Date.now());
  const start = now();
  const budget = opts.tidsbudgetMs ?? 240_000;
  const vaxlingMs = opts.vaxling ? Date.parse(opts.vaxling) : NaN;
  const kopieradMs = opts.kopieradSedan ? Date.parse(opts.kopieradSedan) : NaN;
  if (opts.lage === "delta" && !Number.isFinite(vaxlingMs)) {
    throw new Error("delta kräver `vaxling` — tiden då butiken bytte lager (ISO).");
  }
  if (opts.lage === "delta" && !Number.isFinite(kopieradMs)) {
    throw new Error("delta kräver `kopieradSedan` — när den sista kopieringen startade (ISO).");
  }
  if (opts.lage === "delta" && kopieradMs >= vaxlingMs) {
    throw new Error("delta: `kopieradSedan` måste ligga före `vaxling`.");
  }

  const ko = kallor.filter((k) => !opts.baraTabeller?.length || opts.baraTabeller.includes(k.namn));
  const s: Summering = { lage: opts.lage, dryRun, vaxling: opts.vaxling ?? null, tabeller: [], markor: null, stoppadAv: "klart" };

  let i = 0;
  if (opts.efter) {
    const tabell = opts.efter.tabell;
    i = ko.findIndex((k) => k.namn === tabell);
    if (i === -1) throw new Error(`Markören pekar på okänd tabell "${tabell}".`);
  }

  for (; i < ko.length; i++) {
    const kalla = ko[i];
    const u = nyttUtfall(kalla.namn);
    s.tabeller.push(u);
    const fortsatt = opts.efter && opts.efter.tabell === kalla.namn ? opts.efter : null;

    // ── framåt: varje Neon-rad mot Wix ──
    if (!fortsatt || fortsatt.fas === "fram") {
      let efter = fortsatt?.fas === "fram" ? fortsatt.efter : null;
      for (;;) {
        if (now() - start > budget) {
          s.markor = { tabell: kalla.namn, fas: "fram", efter };
          s.stoppadAv = "tidsbudget";
          return s;
        }
        const { rader, nasta } = await kalla.lasNeon(efter, TUGGA);
        if (rader.length === 0) break;
        const iWix = new Map((await wix.hamtaIdn(kalla.kollektion, rader.map((r) => r.id))).map((w) => [w._id, w]));
        const skriv: KallRad[] = [];
        for (const r of rader) {
          u.granskade++;
          const w = iWix.get(r.id);
          if (!w) {
            if (opts.lage === "delta" && !(typeof r.andrad === "number" && r.andrad >= kopieradMs)) {
              u.borttagenIWix++;
              continue;
            }
            u.saknas++;
            exempel(u.exempel.saknas, r.id);
            if (opts.lage !== "verifiera") skriv.push(r);
            continue;
          }
          const falt = skiljandeFalt(r.data, w);
          if (falt.length === 0) {
            u.lika++;
            continue;
          }
          if (opts.lage === "delta" && tid(w._updatedDate) >= vaxlingMs) {
            u.wixNyare++;
            continue;
          }
          u.olika++;
          exempel(u.exempel.olika, r.id);
          for (const f of falt) u.olikaFalt[f] = (u.olikaFalt[f] ?? 0) + 1;
          if (opts.lage !== "verifiera") skriv.push(r);
        }
        if (skriv.length && !dryRun) {
          const res = await wix.spara(kalla.kollektion, skriv);
          u.skrivna += res.sparade;
          for (const f of res.fel.slice(0, 10)) u.fel.push(`spara ${f.id}: ${f.fel}`);
          if (res.fel.length > 10) u.fel.push(`… och ${res.fel.length - 10} till`);
        }
        efter = nasta;
        if (!nasta || rader.length < TUGGA) break;
      }
    }

    // ── bakåt: Wix-rader som saknas i Neon (aldrig i kopiera) ──
    if (opts.lage === "kopiera") continue;
    const iNeon = await kalla.allaIdn();
    let efter = fortsatt?.fas === "bak" ? fortsatt.efter : null;
    for (;;) {
      if (now() - start > budget) {
        s.markor = { tabell: kalla.namn, fas: "bak", efter };
        s.stoppadAv = "tidsbudget";
        return s;
      }
      const sida = await wix.sidaEfter(kalla.kollektion, efter, 1000);
      if (sida.length === 0) break;
      const bort: string[] = [];
      for (const w of sida) {
        if (iNeon.has(w._id)) continue;
        if (opts.lage === "delta" && !(tid(w._createdDate) < vaxlingMs && tid(w._updatedDate) < vaxlingMs)) {
          u.nyaIWix++;
          continue;
        }
        u.extra++;
        exempel(u.exempel.extra, w._id);
        if (opts.lage === "delta") bort.push(w._id);
      }
      if (bort.length && !dryRun) {
        const res = await wix.taBort(kalla.kollektion, bort);
        u.borttagna += res.borttagna;
        u.fel.push(...res.fel.slice(0, 10));
      }
      efter = sida[sida.length - 1]._id;
      if (sida.length < 1000) break;
    }
  }
  return s;
}

/** Varje Neon-rad finns i Wix med samma innehåll, och Wix har inget extra. */
export function godkand(s: Summering): boolean {
  return s.stoppadAv === "klart" && s.tabeller.every((t) => t.saknas === 0 && t.olika === 0 && t.extra === 0 && t.fel.length === 0);
}

// ── Det som lämnar servern ───────────────────────────────────────────────────

/** ☠️ Varje id kan bära e-post, spårningsnummer eller vagn-id: ut går bara en kort hash. */
export function hashatId(id: string): string {
  return `#${createHash("sha256").update(id, "utf8").digest("hex").slice(0, 10)}`;
}

/** Felet utan radens innehåll: bara status och WDE-kod, eller felets första ord. */
export function kortFel(fel: string): string {
  const kod = /WDE\d{4}/.exec(fel)?.[0];
  const status = /\((\d{3})/.exec(fel)?.[1];
  if (kod || status) return [status, kod].filter(Boolean).join(" ");
  return fel.split(/[:\s]/)[0].slice(0, 40) || "fel";
}

/** Summeringen som den får lämna servern: hashade id, korta fel. */
export function redigerad(s: Summering): Summering {
  return {
    ...s,
    tabeller: s.tabeller.map((t) => ({
      ...t,
      exempel: {
        saknas: t.exempel.saknas.map(hashatId),
        olika: t.exempel.olika.map(hashatId),
        extra: t.exempel.extra.map(hashatId),
      },
      fel: t.fel.map(kortFel),
    })),
  };
}

// ── Markören ─────────────────────────────────────────────────────────────────

const PREFIX = "f1.";

function nyckel(hemlighet: string): Buffer {
  return createHash("sha256").update(`neon-till-wix:${hemlighet}`, "utf8").digest();
}

/** ☠️ Markören bär radens nyckel (e-post, spårningsnummer) och förseglas innan den lämnar servern. */
export function forsegla(markor: Markor | null, hemlighet: string): string | null {
  if (!markor) return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", nyckel(hemlighet), iv);
  const data = Buffer.concat([c.update(JSON.stringify(markor), "utf8"), c.final()]);
  return PREFIX + Buffer.concat([iv, c.getAuthTag(), data]).toString("base64url");
}

export function oppna(strang: string | null | undefined, hemlighet: string): Markor | null {
  const v = (strang ?? "").trim();
  if (!v) return null;
  if (!v.startsWith(PREFIX)) throw new Error("markören är inte förseglad — kör om utan after");
  const raa = Buffer.from(v.slice(PREFIX.length), "base64url");
  if (raa.length <= 28) throw new Error("markören är trasig — kör om utan after");
  try {
    const d = createDecipheriv("aes-256-gcm", nyckel(hemlighet), raa.subarray(0, 12));
    d.setAuthTag(raa.subarray(12, 28));
    const klar = Buffer.concat([d.update(raa.subarray(28)), d.final()]).toString("utf8");
    return JSON.parse(klar) as Markor;
  } catch {
    throw new Error("markören går inte att öppna — kör om utan after");
  }
}
