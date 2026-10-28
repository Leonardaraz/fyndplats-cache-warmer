// Flytten tillbaka: drift-datan ur Neon (Postgres) till Wix CMS, rad för rad.
//
// VARFÖR (2026-10-28). Datan flyttade till Neon 2026-08-31 för att Wix tog
// 4 000 rader. Sajten står nu på Elite (10 miljoner rader), och Neon kostar
// 30–40 dollar i månaden för att datorn aldrig hinner somna. Leonards beslut:
// allt tillbaka till Wix.
//
// FYRA LÄGEN, alla per tabell och med markör:
//
//   plan       radantal i Neon och Wix, och alla tabeller i Neon-databasen
//              (svarar på om butikens tabeller bor i samma databas).
//   kopiera    skriver varje Neon-rad som saknas i Wix eller skiljer sig.
//              Raderar ingenting. Före växlingen är Wix bara en kopia.
//   verifiera  jämför RAD FÖR RAD åt båda hållen och skriver ingenting.
//   delta      efter växlingen (`vaxling` = när produktionen bytte lager):
//              en Neon-rad skrivs bara om Wix-raden saknas eller skrevs
//              FÖRE växlingen. En Wix-rad som saknas i Neon tas bort bara
//              om Wix skapade den före växlingen (alltså av kopieringen).
//
// ☠️ DELTA-REGELN ÄR DET SOM GÖR VÄXLINGEN SÄKER. Mellan kopieringen och
// växlingen skriver produktionen fortfarande till Neon. Efter växlingen
// skriver den till Wix. En rad som ändrats på båda ställena ska behålla Wix
// version, för den är nyare. Wix stämplar varje skrivning (`_updatedDate`), och
// allt kopieringen skrev ligger FÖRE växlingen, så stämpeln avgör.
// `vaxling` ska vara tiden då växlings-PR:en mergades: tidigare än den nya
// deployens första skrivning, och senare än kopieringens sista.
//
// ☠️ RÄKNA EFTER, LITA INTE PÅ SVARET. Varje skriven rad räknas bara när Wix
// bekräftat den (sparaManga), och verifieringen jämför innehållet kanoniskt —
// inte radantal. Åttonde gången i det här projektet hade ett radantal varit
// ett grönt kvitto på en halv kopia.

import { kanonisk } from "./kanonisk";

/** En rad som den ska ligga i Wix: id plus data utan systemfält och utan `_id`. */
export interface KallRad {
  id: string;
  data: Record<string, unknown>;
  /** När raden senast ändrades i Neon (ms), om tabellen vet det. Delta-läget behöver det. */
  andrad?: number;
}

/** En rad ur Wix, med systemfälten kvar (`_createdDate`, `_updatedDate`). */
export type WixPost = Record<string, unknown> & { _id: string };

export interface Kalla {
  /** Tabellens namn i rapporten, t.ex. "mappings" eller "llm_kv:FyndplatsLlmStats". */
  namn: string;
  kollektion: string;
  /** Nästa tugga ur Neon i id-ordning, efter `efter` (null = från början). */
  lasNeon(efter: string | null, antal: number): Promise<KallRad[]>;
  raknaNeon(): Promise<number>;
  /** Vilka av `idn` som finns i Neon. */
  finnsINeon(idn: string[]): Promise<Set<string>>;
}

export interface WixSida {
  /** Rader med de givna id:na. */
  hamtaIdn(kollektion: string, idn: string[]): Promise<WixPost[]>;
  /** Nästa sida id-ordnade rader efter `efter`, med systemfälten. */
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
  /** Neon-rader som granskats i den här körningen. */
  granskade: number;
  lika: number;
  /** Neon-rad som saknas i Wix. */
  saknas: number;
  /** Finns i båda men skiljer sig. */
  olika: number;
  /** Skiljer sig, men Wix skrev raden EFTER växlingen — Wix behålls (delta). */
  wixNyare: number;
  /** Wix-rad som saknas i Neon och skapades före växlingen (av kopieringen). */
  extra: number;
  /** Wix-rad som saknas i Neon och skapades eller skrevs EFTER växlingen — ny i drift, behålls. */
  nyaIWix: number;
  /** Delta: Neon-rad som saknas i Wix men inte ändrats sedan kopieringen — Wix tog bort den efter växlingen. */
  borttagenIWix: number;
  skrivna: number;
  borttagna: number;
  /** Upp till fem id per slag, aldrig innehåll. */
  exempel: { saknas: string[]; olika: string[]; extra: string[] };
  /** Fältnamnen som skilde (bara namnen), räknade över alla olika rader. */
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

/** Wix systemfält och anspråkets token. Jämförelsen och kopian bryr sig inte om dem. */
const UTANFOR = new Set(["_id", "_owner", "_createdDate", "_updatedDate", "anspraksToken"]);

/**
 * Jämförelseform, rekursivt:
 *   - `{"$date": "…"}` blir ISO-strängen. Wix ger datum så i datumtypade fält,
 *     och ibland utan millisekunder.
 *   - ett fält som är `null` räknas som saknat. Koden läser båda som "inget"
 *     (`?? null`), och ett lager som tappar null-fält ska inte se olika ut.
 * Arrayer behåller sin ordning och sina element, null eller ej.
 */
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

/** Raden utan systemfält, i den form jämförelsen använder. */
export function jamforbar(rad: Record<string, unknown>): Record<string, unknown> {
  const ut: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rad)) {
    if (UTANFOR.has(k) || v === undefined || v === null) continue;
    ut[k] = normalisera(v);
  }
  return ut;
}

/** Fälten (översta nivån) som skiljer två rader åt. */
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
  /** Krävs i delta-läget: ISO-tiden då produktionen bytte lager. */
  vaxling?: string | null;
  /**
   * Krävs i delta-läget: ISO-tiden då den SISTA kopieringen startade. En
   * Neon-rad som saknas i Wix skrivs bara om den ändrats efter den — annars
   * fanns den i Wix efter kopieringen och har tagits bort i drift sedan
   * växlingen, och då ska den inte väckas till liv igen.
   */
  kopieradSedan?: string | null;
  efter?: Markor | null;
  baraTabeller?: string[];
  tidsbudgetMs?: number;
  now?: () => number;
}

/**
 * Går igenom källorna i ordning: framåt (Neon → Wix) och sedan bakåt (Wix
 * som saknas i Neon). Stannar på tidsbudgeten och lämnar en markör.
 */
export async function synka(kallor: Kalla[], wix: WixSida, opts: SynkOptions): Promise<Summering> {
  const dryRun = opts.lage === "verifiera" || opts.dryRun !== false;
  const now = opts.now ?? (() => Date.now());
  const start = now();
  const budget = opts.tidsbudgetMs ?? 240_000;
  const vaxlingMs = opts.vaxling ? Date.parse(opts.vaxling) : NaN;
  const kopieradMs = opts.kopieradSedan ? Date.parse(opts.kopieradSedan) : NaN;
  if (opts.lage === "delta" && !Number.isFinite(vaxlingMs)) {
    throw new Error("delta kräver `vaxling` — tiden då produktionen bytte lager (ISO).");
  }
  if (opts.lage === "delta" && !Number.isFinite(kopieradMs)) {
    throw new Error("delta kräver `kopieradSedan` — när den sista kopieringen startade (ISO).");
  }
  if (opts.lage === "delta" && kopieradMs >= vaxlingMs) {
    throw new Error("delta: `kopieradSedan` måste ligga före `vaxling`.");
  }

  const ko = kallor.filter((k) => !opts.baraTabeller?.length || opts.baraTabeller.includes(k.namn));
  const s: Summering = {
    lage: opts.lage,
    dryRun,
    vaxling: opts.vaxling ?? null,
    tabeller: [],
    markor: null,
    stoppadAv: "klart",
  };

  let i = 0;
  if (opts.efter) {
    i = ko.findIndex((k) => k.namn === opts.efter!.tabell);
    if (i === -1) throw new Error(`Markören pekar på okänd tabell "${opts.efter.tabell}".`);
  }

  for (; i < ko.length; i++) {
    const kalla = ko[i];
    const u = nyttUtfall(kalla.namn);
    s.tabeller.push(u);
    const fortsatt = opts.efter && opts.efter.tabell === kalla.namn ? opts.efter : null;

    // ── framåt: varje Neon-rad mot Wix ──────────────────────────────────────
    if (!fortsatt || fortsatt.fas === "fram") {
      let efter = fortsatt?.fas === "fram" ? fortsatt.efter : null;
      for (;;) {
        if (now() - start > budget) {
          s.markor = { tabell: kalla.namn, fas: "fram", efter };
          s.stoppadAv = "tidsbudget";
          return s;
        }
        const rader = await kalla.lasNeon(efter, TUGGA);
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
        efter = rader[rader.length - 1].id;
        if (rader.length < TUGGA) break;
      }
    }

    // ── bakåt: Wix-rader som saknas i Neon ──────────────────────────────────
    // Kopieringen raderar aldrig: före växlingen är en extra Wix-rad bara
    // något som Neon hunnit ta bort under tiden, och delta-läget tar den.
    if (opts.lage === "kopiera") continue;
    let efter = fortsatt?.fas === "bak" ? fortsatt.efter : null;
    for (;;) {
      if (now() - start > budget) {
        s.markor = { tabell: kalla.namn, fas: "bak", efter };
        s.stoppadAv = "tidsbudget";
        return s;
      }
      const sida = await wix.sidaEfter(kalla.kollektion, efter, 1000);
      if (sida.length === 0) break;
      const iNeon = await kalla.finnsINeon(sida.map((w) => w._id));
      const bort: string[] = [];
      for (const w of sida) {
        if (iNeon.has(w._id)) continue;
        // Bara en rad som både skapades och senast skrevs FÖRE växlingen var
        // kopieringens. En rad drift rört efter växlingen behålls.
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

/** Är kopian godkänd? Varje Neon-rad finns i Wix med samma innehåll, och Wix har inget extra. */
export function godkand(s: Summering): boolean {
  return s.stoppadAv === "klart" && s.tabeller.every((t) => t.saknas === 0 && t.olika === 0 && t.extra === 0 && t.fel.length === 0);
}
