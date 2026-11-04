// lib/medlem/niva.ts
//
// Medlemsnivån räknas ur orderliggaren (specifikationen, "Privat", beslutad
// tabell). Ren modul utan lokala imports: den prövas med
// `node --test --experimental-strip-types` (niva.test.ts).
//
// Regeln, ordagrant ur specen:
//   K(t) = summan av betalda ordrar med  t − 365 d < betald ≤ t  av
//          (rabattberättigade rader P·q − återbetalt varuvärde).
//   Ordern räknas från betalningstidpunkten [P1]. Avbrutna och obetalda
//   ordrar räknas inte. Frakt, avgifter och presentkort ingår inte.
//   Återbetalningar minskar orderns bidrag den dag de registreras.
//   Rullande fönster utan nivåskydd [P2].
//   Dygnsgränser och "365 dagar" räknas i Europe/Stockholm.
//
// Belopp är heltal i öre genom hela modulen.

// ─────────────────────────────────────────────────────────────────────────────
// Dagar i svensk tid
// ─────────────────────────────────────────────────────────────────────────────

export const FONSTER_DAGAR = 365;
export const VARNING_DAGAR = 14;
const DYGN_MS = 86_400_000;

const STOCKHOLM = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Datumet i svensk tid, "ÅÅÅÅ-MM-DD". */
export function stockholmsDatum(t: string | number | Date): string {
  const d = t instanceof Date ? t : new Date(t);
  if (Number.isNaN(d.getTime())) throw new Error("ogiltig tidpunkt");
  const delar = Object.fromEntries(STOCKHOLM.formatToParts(d).map((p) => [p.type, p.value]));
  return `${delar.year}-${delar.month}-${delar.day}`;
}

/** Dagnummer (dagar sedan 1970-01-01) för ett kalenderdatum "ÅÅÅÅ-MM-DD". */
export function dagnummer(datum: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum);
  if (!m) throw new Error(`ogiltigt datum: ${datum}`);
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DYGN_MS);
}

/** Dagnumret för tidpunktens svenska datum. */
export function stockholmsDag(t: string | number | Date): number {
  return dagnummer(stockholmsDatum(t));
}

/** "ÅÅÅÅ-MM-DD" för ett dagnummer. */
export function dagTillDatum(dag: number): string {
  return new Date(dag * DYGN_MS).toISOString().slice(0, 10);
}

const LANGT_DATUM = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "3 november 2026" för ett dagnummer. */
export function dagSomText(dag: number): string {
  return LANGT_DATUM.format(new Date(dag * DYGN_MS));
}

// ─────────────────────────────────────────────────────────────────────────────
// Nivåerna
// ─────────────────────────────────────────────────────────────────────────────

export interface Niva {
  namn: string;
  /** Lägsta K för nivån, i öre. */
  franOre: number;
  /** Medlemsrabatten i hela procent. Gäller först från E2. */
  rabattProcent: number;
}

export interface Regler {
  version: number;
  /** Stigande efter `franOre`; den första börjar på 0. */
  nivaer: Niva[];
}

/** Specens tabell [BESLUTAT], version 1. Låst av niva.test.ts (E1-5). */
export const REGLER_V1: Regler = {
  version: 1,
  nivaer: [
    { namn: "Brons", franOre: 0, rabattProcent: 0 },
    { namn: "Silver", franOre: 200_000, rabattProcent: 1 },
    { namn: "Guld", franOre: 400_000, rabattProcent: 2 },
    { namn: "Platina", franOre: 700_000, rabattProcent: 3 },
    { namn: "Diamant", franOre: 2_000_000, rabattProcent: 4 },
    { namn: "VIP", franOre: 5_000_000, rabattProcent: 5 },
  ],
};

/** Felet i en regeluppsättning, eller null om den går att använda. */
export function reglerFel(r: unknown): string | null {
  const regler = r as Regler | null;
  if (!regler || typeof regler !== "object") return "saknas";
  if (!Number.isInteger(regler.version) || regler.version < 1) return "version";
  const n = regler.nivaer;
  if (!Array.isArray(n) || n.length === 0) return "inga nivåer";
  if (n[0].franOre !== 0) return "första nivån börjar inte på 0";
  for (let i = 0; i < n.length; i++) {
    const v = n[i];
    if (!v || typeof v.namn !== "string" || !v.namn.trim()) return `nivå ${i}: namn`;
    if (!Number.isInteger(v.franOre) || v.franOre < 0) return `nivå ${i}: gräns`;
    if (!Number.isInteger(v.rabattProcent) || v.rabattProcent < 0 || v.rabattProcent > 50) return `nivå ${i}: rabatt`;
    if (i > 0 && v.franOre <= n[i - 1].franOre) return `nivå ${i}: gränserna stiger inte`;
  }
  return null;
}

/** Index för nivån som K ger. */
export function nivaIndex(kOre: number, regler: Regler): number {
  let ix = 0;
  for (let i = 0; i < regler.nivaer.length; i++) if (kOre >= regler.nivaer[i].franOre) ix = i;
  return ix;
}

export function nivaFor(kOre: number, regler: Regler): Niva {
  return regler.nivaer[nivaIndex(kOre, regler)];
}

export function nivaMedNamn(namn: string, regler: Regler): Niva | null {
  return regler.nivaer.find((n) => n.namn === namn) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// K
// ─────────────────────────────────────────────────────────────────────────────

/** Det nivån behöver ur en rad i orderliggaren. */
export interface KPost {
  orderId: string;
  ordernummer?: string;
  /** Betalningstidpunkten (ISO). Saknas för en obetald order. */
  betald?: string;
  /** Betald, inte avbruten och i kronor. */
  raknas: boolean;
  /** Rabattberättigade rader P·q, i öre. */
  varorOre: number;
  aterbetalningar: { tid: string; varorOre: number }[];
}

/** Orderns bidrag till K på dagen `dag`, i öre. */
export function bidrag(post: KPost, dag: number): number {
  if (!post.raknas || !post.betald) return 0;
  const betaldDag = stockholmsDag(post.betald);
  if (!(betaldDag > dag - FONSTER_DAGAR && betaldDag <= dag)) return 0;
  let ater = 0;
  for (const a of post.aterbetalningar) if (stockholmsDag(a.tid) <= dag) ater += Math.max(0, a.varorOre);
  return Math.max(0, post.varorOre - ater);
}

export function beraknaK(poster: KPost[], dag: number): number {
  let k = 0;
  for (const p of poster) k += bidrag(p, dag);
  return k;
}

/** Första dagen ordern inte längre räknas: betalningsdagen + 365. */
export function fallerUrDag(post: KPost): number | null {
  if (!post.raknas || !post.betald) return null;
  return stockholmsDag(post.betald) + FONSTER_DAGAR;
}

export interface RaknatKop {
  orderId: string;
  ordernummer?: string;
  betaldDag: number;
  /** Första dagen köpet inte räknas. Det räknas till och med dagen före. */
  fallerUrDag: number;
  bidragOre: number;
}

export interface Nivalage {
  dag: number;
  kOre: number;
  niva: Niva;
  /** Nästa nivå och vad som saknas dit, eller null på högsta nivån. */
  nasta: { niva: Niva; kvarOre: number } | null;
  /** Köpen som räknas i dag, äldst först. */
  raknade: RaknatKop[];
  /** Dagen då det äldsta köpet faller ur, eller null utan köp. */
  aldstaFallerUr: number | null;
  /** Första dagen nivån sjunker om inget mer köps, eller null. */
  sankning: { dag: number; niva: Niva; kOre: number } | null;
  /** Satt för hand i admin, i stället för den räknade. */
  manuell: { tillDag: number | null } | null;
}

export function nivalage(poster: KPost[], dag: number, regler: Regler): Nivalage {
  const raknade: RaknatKop[] = [];
  for (const p of poster) {
    const b = bidrag(p, dag);
    const ut = fallerUrDag(p);
    if (b > 0 && ut !== null) raknade.push({ orderId: p.orderId, ordernummer: p.ordernummer, betaldDag: ut - FONSTER_DAGAR, fallerUrDag: ut, bidragOre: b });
  }
  raknade.sort((a, b) => a.betaldDag - b.betaldDag || a.orderId.localeCompare(b.orderId));
  const kOre = raknade.reduce((s, r) => s + r.bidragOre, 0);
  const ix = nivaIndex(kOre, regler);
  const niva = regler.nivaer[ix];
  const over = regler.nivaer[ix + 1];
  const nasta = over ? { niva: over, kvarOre: over.franOre - kOre } : null;

  // Nivån sjunker bara när ett köp faller ur. Pröva varje sådan dag i tur och
  // ordning med det som då återstår; återbetalningar efter i dag finns inte än.
  let sankning: Nivalage["sankning"] = null;
  let kvar = kOre;
  const dagar = [...new Set(raknade.map((r) => r.fallerUrDag))].sort((a, b) => a - b);
  for (const d of dagar) {
    for (const r of raknade) if (r.fallerUrDag === d) kvar -= r.bidragOre;
    const nyIx = nivaIndex(kvar, regler);
    if (nyIx < ix) {
      sankning = { dag: d, niva: regler.nivaer[nyIx], kOre: kvar };
      break;
    }
  }

  return {
    dag,
    kOre,
    niva,
    nasta,
    raknade,
    aldstaFallerUr: raknade.length ? raknade[0].fallerUrDag : null,
    sankning,
    manuell: null,
  };
}

/**
 * En nivå satt för hand i admin gäller i stället för den räknade, till och med
 * `tillDatum` om ett sådant finns. Efter det gäller den räknade igen.
 */
export function medManuellNiva(
  lage: Nivalage,
  manuell: { namn: string; tillDatum?: string | null } | null | undefined,
  regler: Regler,
): Nivalage {
  if (!manuell) return lage;
  const niva = nivaMedNamn(manuell.namn, regler);
  if (!niva) return lage;
  const tillDag = manuell.tillDatum ? dagnummer(manuell.tillDatum) : null;
  if (tillDag !== null && tillDag < lage.dag) return lage;
  const ix = regler.nivaer.indexOf(niva);
  const over = regler.nivaer[ix + 1];
  const nasta = over && lage.kOre < over.franOre ? { niva: over, kvarOre: over.franOre - lage.kOre } : null;
  let sankning: Nivalage["sankning"] = null;
  if (tillDag !== null) {
    // Dagen efter sista dagen gäller den räknade nivån igen, med de köp som
    // då återstår.
    let kvar = lage.kOre;
    for (const r of lage.raknade) if (r.fallerUrDag <= tillDag + 1) kvar -= r.bidragOre;
    const nyIx = nivaIndex(kvar, regler);
    if (nyIx < ix) sankning = { dag: tillDag + 1, niva: regler.nivaer[nyIx], kOre: kvar };
  }
  return { ...lage, niva, nasta, sankning, manuell: { tillDag } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mejlen
// ─────────────────────────────────────────────────────────────────────────────

/** Ska "ny nivå" mejlas? Bara när nivån stigit över den senast meddelade. */
export function nyNivaAttMeddela(lage: Nivalage, meddeladNiva: string | null | undefined, regler: Regler): boolean {
  const nu = regler.nivaer.indexOf(lage.niva);
  const forra = meddeladNiva ? regler.nivaer.findIndex((n) => n.namn === meddeladNiva) : 0;
  return nu > Math.max(0, forra);
}

export interface Varning {
  /** Nivån sänkningen sker från. */
  fran: string;
  /** Sänkningens datum, "ÅÅÅÅ-MM-DD". */
  datum: string;
}

/**
 * Ska varningen "nivån sjunker om 14 dagar" skickas i dag? Exakt en gång per
 * väntande sänkning: en tidigare varning från samma nivå vars datum inte har
 * passerat räknas som skickad, även om datumet flyttats av en återbetalning.
 */
export function varningAttSkicka(lage: Nivalage, tidigare: Varning | null | undefined): Varning | null {
  if (lage.manuell || !lage.sankning) return null;
  const om = lage.sankning.dag - lage.dag;
  if (om < 1 || om > VARNING_DAGAR) return null;
  if (tidigare && tidigare.fran === lage.niva.namn && dagnummer(tidigare.datum) >= lage.dag) return null;
  return { fran: lage.niva.namn, datum: dagTillDatum(lage.sankning.dag) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Medlemmen
// ─────────────────────────────────────────────────────────────────────────────

/** Det nattjobbet och Mina sidor behöver av medlemsraden. */
export interface Medlemslage {
  kOre?: number;
  niva?: string;
  meddeladNiva?: string;
  varnadFor?: Varning;
  manuellNiva?: string;
  manuellTill?: string;
}

/** Läget i dag, med en nivå satt för hand om en sådan gäller. */
export function lageForMedlem(m: Medlemslage | null, poster: KPost[], regler: Regler, nuMs: number): Nivalage {
  const lage = nivalage(poster, stockholmsDag(nuMs), regler);
  return m?.manuellNiva ? medManuellNiva(lage, { namn: m.manuellNiva, tillDatum: m.manuellTill }, regler) : lage;
}

/**
 * Nattjobbets beslut för en medlem: fälten att skriva och vilka mejl som ska
 * gå. `meddeladNiva` sätts först när mejlet om den nya nivån har gått iväg.
 */
export function medlemsbeslut(
  m: Medlemslage,
  lage: Nivalage,
  regler: Regler,
  nuIso: string,
): { falt: Record<string, unknown>; nyNiva: boolean; varning: Varning | null } {
  const falt: Record<string, unknown> = {};
  if (m.kOre !== lage.kOre) falt.kOre = lage.kOre;
  if (m.niva !== lage.niva.namn) falt.niva = lage.niva.namn;
  const nyNiva = nyNivaAttMeddela(lage, m.meddeladNiva, regler);
  // En sänkning meddelas inte i efterhand: den senast meddelade följer med
  // ned, så att nästa höjning mejlas igen.
  const nuIx = regler.nivaer.indexOf(lage.niva);
  const meddIx = m.meddeladNiva ? regler.nivaer.findIndex((n) => n.namn === m.meddeladNiva) : -1;
  if (!nyNiva && meddIx > nuIx) falt.meddeladNiva = lage.niva.namn;
  const varning = varningAttSkicka(lage, m.varnadFor);
  if (Object.keys(falt).length || nyNiva || varning) falt.beraknad = nuIso;
  return { falt, nyNiva, varning };
}

// ─────────────────────────────────────────────────────────────────────────────
// Visning
// ─────────────────────────────────────────────────────────────────────────────

const KRONOR = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const HELA_KRONOR = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

/** "1 999,99 kr", eller "2 000 kr" när det är jämna kronor. Mellanslagen är hårda. */
export function kronor(ore: number): string {
  const t = ore % 100 === 0 ? HELA_KRONOR.format(ore / 100) : KRONOR.format(ore / 100);
  return `${t.replace(/\s/g, " ")} kr`;
}
