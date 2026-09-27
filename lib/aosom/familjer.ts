// Färg- och storlekssyskon: vilka av våra Aosom-sidor och -utkast är samma vara
// i en annan färg, samma vara i en annan storlek — eller samma vara två gånger?
//
// VARFÖR DEN FINNS
//
// Aosom säljer varje modell i alla sina kulörer och storlekar, och importen
// skapar ett utkast per feedrad. Poleringen har hittat syskonen ett i taget, med
// måttsvep över polerade texter: golvfåtöljen på sju publicerade sidor och
// björkvilstolen på två med 48 % isär i pris (FARGSYSKONEN.md), och tretton
// utkast i runda N76. Varje sådant svep hittade bara det det letade efter, och
// ett svep över polerad text läser ibland ett syskons mått som sidans eget.
//
// Feeden har svaret strukturerat. Färg, yttermått, material, vikt och paketmått
// är egna kolumner, och mappningen säger vilken Wix-sida varje rad blev. Det här
// svepet läser dem för HELA sortimentet på en gång, och det skriver ingenting.
//
// HUR TVÅ RADER BLIR SYSKON
//
// Kandidaterna kommer från två håll, och båda behövs:
//
//   - `Psin`, Aosoms "relaterade varor"-klunga. ☠️ INTE en variantgrupp (se
//     feed.ts): de tretton valphagarna under en Psin är olika varor. Den säger
//     bara vilka rader som är värda att jämföra.
//   - Den fysiska signaturen: samma yttermått och samma paketmått. Den täcker
//     raderna utan Psin, ungefär en fjärdedel av feeden.
//
// Sedan avgör jämförelsen, och den är konservativ:
//
//   färg        samma mått, paket och vikt, olika färg, samma modellnamn
//   samma vara  samma mått, paket och vikt, SAMMA färg, samma modellnamn
//   storlek     samma Psin, olika mått, samma färg, material och kategori,
//               samma modellnamn
//
// "Samma modellnamn" jämförs på feedens tyska namn efter att färgord, siffror,
// enheter, storleksord och husmärken skalats bort. Det som återstår är modellen,
// och två namn räknas som samma när minst hälften av orden är gemensamma (sju
// tiondelar när raderna inte delar Psin, för då finns inget annat stöd).
// Storlek kräver samma Psin: två olika mått är annars ingen signal alls.
//
// FAMILJENS TYP RÄKNAS PÅ VÅRA SIDOR, INTE PÅ KANTERNA
//
// En familj är en sammanhängande grupp, och den kan hålla ihop genom en feedrad
// vi inte har (grå 2-sits ↔ grå 3-sits ↔ beige 3-sits). Typen avgörs därför av
// VÅRA sidors färger och mått: fler än en färg är "färg", fler än ett mått är
// "storlek", båda är "färg och storlek", ingetdera är "samma vara".
//
// ☠️ SVARET ÄR EN LISTA FÖR EN MÄNNISKA, ALDRIG EN KÖRLISTA. Varje familj ska
// ses med bilderna innan något slås ihop, precis som i ommappningen: ett
// A-hinder med orange och ett med grå duk är samma vara, men två fåtöljer med
// samma stomme och olika tyg kan vara två modeller.
//
// ☠️ SVARET BÄR ALDRIG ARTIKELNUMMER, PSIN, TYSKA NAMN ELLER KOSTNADER. Det går
// till en publik Actions-logg. Utkastens namn är Aosoms egna tyska titlar, och
// en sökning på dem leder till Aosoms produktsida. Publicerade sidor visar sitt
// svenska namn, som ändå står på sajten, och allt fritext tvättas med
// `redigera` som sista skydd.

import type { ProductMappingRecord } from "../store";
import { isAosomMapping } from "../store/supplier";
import { redigera } from "../polish/skrivplan";
import { isShippableToSe, type AosomRow } from "./feed";
import { synligtSaldo } from "./sync";
import { aosomArtiklarPaRaden } from "./artiklar";

/** Två modellnamn räknas som samma när minst så stor andel av orden delas. */
export const NAMN_GRANS_SAMMA_PSIN = 0.5;
/** Samma sak utan gemensam Psin — då bär namnet ensamt bevisningen. */
export const NAMN_GRANS_UTAN_PSIN = 0.7;
/** Storlekssyskon: namnet utan siffror och storleksord. */
export const NAMN_GRANS_STORLEK = 0.6;
/** Material räknas som samma när minst så stor andel av orden delas. */
export const MATERIAL_GRANS = 0.5;
/**
 * En kandidatgrupp större än så här jämförs inte parvis. Ingen Psin i feeden är
 * i närheten, men en fysisk signatur som råkar vara tom eller noll på många
 * rader hade annars blivit en kvadratisk loop över tusentals rader.
 */
export const MAX_GRUPP = 300;
/** Prisspann inom en färgfamilj som ger en varning. */
export const PRISSPANN_VARNING_PCT = 15;

export interface WixProduktInfo {
  id: string;
  visible: boolean;
  /** Visas bara för publicerade sidor. */
  name: string;
  slug: string;
  /** Butikens lägsta pris i kronor. */
  prisMin: number | null;
}

export type Relation = "farg" | "samma" | "storlek";
export type FamiljTyp = "farg" | "storlek" | "farg_storlek" | "samma";
export type FamiljLage = "en_publicerad" | "bara_utkast" | "flera_publicerade";

export interface FamiljMedlem {
  wixProductId: string;
  status: "publicerad" | "utkast";
  /** Feedens färg, t.ex. "Grau". En sammanslagen sida visar alla sina. */
  farg: string;
  /** Yttermåtten som tal ur feeden, t.ex. "79,5 × 33 × 90,7". Aldrig råsträngen. */
  matt: string;
  /** Synligt saldo (feedens minus husets buffert), summerat över sidans artiklar. */
  saldo: number;
  /** Butikens lägsta pris i kronor. */
  pris: number | null;
  /** Antal Aosom-artiklar på sidan — två eller fler är en redan sammanslagen sida. */
  artiklar: number;
  /** Bara publicerade sidor. Utkastens namn är Aosoms tyska titlar. */
  namn: string;
  slug: string;
}

export interface Familj {
  typ: FamiljTyp;
  lage: FamiljLage;
  publicerade: number;
  utkast: number;
  /**
   * Kan dagens verktyg (`aosom-sammanslagning`) ta ett av utkasten? Det kräver
   * en publicerad sida med en enda artikel och ett utkast med en enda artikel,
   * i samma mått och olika, kända färger. Verktyget tar ett utkast per sida.
   */
  verktygetIdag: boolean;
  medlemmar: FamiljMedlem[];
  /** Grupper av våra sidor som är samma vara i samma färg (wix-id). */
  sammaVara: string[][];
  /** Rader i samma familj som går att skicka hit men som vi inte har. */
  ejHosOss: number;
  /** (högsta − lägsta) / lägsta pris i procent, för färg och samma vara. */
  prisSpannPct: number | null;
  varningar: string[];
}

export interface FamiljSvar {
  familjer: Familj[];
  summering: {
    familjer: number;
    perTyp: Record<FamiljTyp, number>;
    perLage: Record<FamiljLage, number>;
    sidorIFamiljer: number;
    publiceradeIFamiljer: number;
    utkastIFamiljer: number;
    /** Familjer där dagens verktyg kan ta minst ett utkast. */
    verktygetIdag: number;
    dubblettgrupper: number;
    /** Samma artikel mappad till två olika sidor — en dubblett importen släppt igenom. */
    sammaArtikelPaTvaSidor: number;
    /** Sidor utan syskon hos oss, men med syskon i feeden som vi inte har. */
    ensammaMedSyskonIFeeden: number;
  };
  underlag: {
    feedrader: number;
    /** Aosom-mappningar som inte är pensionerade. */
    mappningar: number;
    sidor: number;
    artiklar: number;
    artiklarMedPsin: number;
    /** Våra artiklar som inte finns i feeden just nu (lågt saldo tas bort tillfälligt). */
    utanFeedrad: number;
    /** Mappningar vars Wix-produkt inte finns. */
    utanWixProdukt: number;
    /** Kandidatgrupper som var för stora för att jämföras parvis. */
    forStoraGrupper: number;
    /** Hur många radpar jämförelsen kopplade ihop, per relation. */
    kanter: Record<Relation, number>;
  };
}

// ---------------------------------------------------------------------------
// Rader → jämförbara drag

const STOPPORD = new Set([
  "und", "mit", "fur", "fuer", "aus", "der", "die", "das", "den", "dem", "des",
  "in", "im", "am", "an", "auf", "zum", "zur", "von", "vom", "bis", "inkl",
  "inklusive", "ohne", "oder", "als", "auch", "ein", "eine", "einer", "einem",
  "einen", "eines", "zu", "je", "pro", "ca", "the", "and", "with", "for", "of",
  // Husmärken och platshållaren "[BRAND NAME]" — samma i hela familjer, och
  // hade blåst upp likheten mellan två olika varor av samma märke.
  "homcom", "outsunny", "pawhut", "aiyaplay", "vinsetto", "kleankin", "zonekiz",
  "sportnow", "aosom", "brand", "name",
]);

/** Färgord och ytbeskrivningar, i vikt form (ä → a, ß → ss). */
const FARGORD = new Set([
  "schwarz", "weiss", "grau", "hellgrau", "dunkelgrau", "anthrazit", "silber",
  "silbern", "gold", "golden", "blau", "hellblau", "dunkelblau", "marineblau",
  "navy", "navyblau", "turkis", "petrol", "grun", "hellgrun", "dunkelgrun",
  "olivgrun", "oliv", "mint", "mintgrun", "salbei", "salbeigrun", "gelb",
  "senfgelb", "senf", "orange", "rot", "weinrot", "bordeaux", "bordeauxrot",
  "rosa", "pink", "altrosa", "lila", "violett", "flieder", "braun", "hellbraun",
  "dunkelbraun", "kaffee", "mokka", "cappuccino", "beige", "creme", "cremeweiss",
  "cremefarben", "sand", "taupe", "khaki", "natur", "naturfarben", "naturholz",
  "holzfarben", "holzoptik", "eiche", "eichenoptik", "eichefarben", "walnuss",
  "nussbaum", "teak", "kupfer", "bronze", "champagner", "elfenbein", "farbe",
  "farben", "farbig", "mehrfarbig", "bunt", "black", "white", "grey", "gray",
  "blue", "green", "red", "brown", "yellow", "purple",
]);

const STORLEKSORD = new Set([
  "klein", "kleine", "kleiner", "kleines", "kleinen", "gross", "grosse",
  "grosser", "grosses", "grossen", "mittel", "mittelgross", "mittelgrosse",
  "mittelgrosser", "mittelgrossen", "mini", "maxi", "xs", "xl", "xxl", "xxxl",
  "riesig", "extragross",
]);

const ENHETER = new Set(["cm", "mm", "kg", "ml", "stk", "st"]);

/** Gemener, ß → ss, diakritiska tecken bort, delat på allt som inte är bokstav eller siffra. */
function ordAv(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Talen i en måttsträng, med decimalkomma. Bara nollor räknas som inga mått. */
function talAv(s: string): number[] {
  const ut: number[] = [];
  for (const m of s.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const t = Number(m[0].replace(",", "."));
    if (Number.isFinite(t)) ut.push(Math.round(t * 10) / 10);
  }
  return ut.some((t) => t > 0) ? ut : [];
}

export interface Drag {
  psin: string;
  /** Yttermåtten i feedens ordning. */
  matt: number[];
  /** Paketmåtten, sorterade — kollits orientering spelar ingen roll. */
  paket: number[];
  vikt: number | null;
  /** Färgnyckel ("grau+weiss"), "" när feeden saknar färg. */
  farg: string;
  material: Set<string>;
  kategori: string;
  /** Modellens ord: namnet utan färg, siffror, enheter, storleksord och husmärken. */
  modell: Set<string>;
}

export function fargNyckel(farg: string): string {
  return [...new Set(ordAv(farg).filter((w) => w !== "und" && w !== "mit"))].sort().join("+");
}

export function dragAv(r: AosomRow): Drag {
  const egnaFarger = new Set(ordAv(r.color));
  const modell = new Set(
    ordAv(r.name).filter((w) =>
      w.length > 1
      && !/\d/.test(w)
      && !STOPPORD.has(w)
      && !FARGORD.has(w)
      && !egnaFarger.has(w)
      && !STORLEKSORD.has(w)
      && !ENHETER.has(w)),
  );
  return {
    psin: (r.psin ?? "").trim(),
    matt: talAv(r.size),
    paket: talAv(r.packageSize).sort((a, b) => a - b),
    vikt: r.weightKg !== null && r.weightKg > 0 ? r.weightKg : null,
    farg: fargNyckel(r.color),
    material: new Set(ordAv(r.material).filter((w) => w.length > 2 && !/\d/.test(w) && !STOPPORD.has(w))),
    kategori: r.category.trim().toLowerCase(),
    modell,
  };
}

// ---------------------------------------------------------------------------
// Två rader → en relation

function talNara(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(0.5, 0.015 * Math.max(a, b));
}

export function listorNara(a: number[], b: number[]): boolean {
  return a.length > 0 && a.length === b.length && a.every((t, i) => talNara(t, b[i]));
}

function viktNara(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return true;
  return Math.abs(a - b) <= Math.max(0.3, 0.05 * Math.max(a, b));
}

function andelGemensamma(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let gemensamma = 0;
  for (const w of a) if (b.has(w)) gemensamma++;
  return gemensamma / (a.size + b.size - gemensamma);
}

/**
 * Det jämförelsen såg, fält för fält. Bär inga namn, inga nummer och inga
 * kostnader — bara ja/nej, tal och feedens färg — så att ett par som svepet
 * inte kopplade ihop kan felsökas i en publik logg.
 */
export interface Jamforelse {
  sammaPsin: boolean;
  mattLika: boolean;
  paketLika: boolean | null;
  viktSkillnadPct: number | null;
  fargLika: boolean | null;
  materialLikhet: number | null;
  kategoriLika: boolean | null;
  namnLikhet: number;
  relation: Relation | null;
}

export function jamfor(a: Drag, b: Drag): Jamforelse {
  const sammaPsin = a.psin !== "" && a.psin === b.psin;
  // Saknar båda yttermått får paketet stå för storleken. Saknar bara den ena
  // går måtten inte att jämföra, och då blir det ingen relation alls.
  const mattLika = a.matt.length > 0 || b.matt.length > 0
    ? listorNara(a.matt, b.matt)
    : listorNara(a.paket, b.paket);
  const paketLika = a.paket.length === 0 || b.paket.length === 0 ? null : listorNara(a.paket, b.paket);
  const viktSkillnadPct = a.vikt === null || b.vikt === null
    ? null
    : Math.round((Math.abs(a.vikt - b.vikt) / Math.max(a.vikt, b.vikt)) * 1000) / 10;
  const fargLika = a.farg === "" || b.farg === "" ? null : a.farg === b.farg;
  const materialLikhet = a.material.size === 0 || b.material.size === 0
    ? null
    : Math.round(andelGemensamma(a.material, b.material) * 100) / 100;
  const kategoriLika = a.kategori === "" || b.kategori === "" ? null : a.kategori === b.kategori;
  const namnLikhet = Math.round(andelGemensamma(a.modell, b.modell) * 100) / 100;

  let relation: Relation | null = null;
  const fysisktSamma = mattLika && paketLika !== false && viktNara(a.vikt, b.vikt);
  if (fysisktSamma) {
    if (namnLikhet >= (sammaPsin ? NAMN_GRANS_SAMMA_PSIN : NAMN_GRANS_UTAN_PSIN)) {
      relation = fargLika === true ? "samma" : "farg";
    }
  } else if (
    sammaPsin
    && a.matt.length > 0 && b.matt.length > 0 && !mattLika
    && fargLika === true
    && (materialLikhet === null || materialLikhet >= MATERIAL_GRANS)
    && kategoriLika !== false
    && namnLikhet >= NAMN_GRANS_STORLEK
  ) {
    relation = "storlek";
  }

  return {
    sammaPsin, mattLika, paketLika, viktSkillnadPct, fargLika, materialLikhet,
    kategoriLika, namnLikhet, relation,
  };
}

// ---------------------------------------------------------------------------
// Hela sortimentet → familjer

class Mangder {
  private far = new Map<string, string>();
  rot(x: string): string {
    let r = this.far.get(x) ?? x;
    if (r === x) { this.far.set(x, x); return x; }
    r = this.rot(r);
    this.far.set(x, r);
    return r;
  }
  forena(a: string, b: string): void {
    const ra = this.rot(a);
    const rb = this.rot(b);
    if (ra !== rb) this.far.set(ra, rb);
  }
}

interface Sida {
  id: string;
  status: "publicerad" | "utkast";
  wix: WixProduktInfo;
  artiklar: string[];
}

interface Nod {
  nyckel: string;
  rad: AosomRow;
  drag: Drag;
}

export interface FamiljIndata {
  rader: AosomRow[];
  mappningar: ProductMappingRecord[];
  wix: Map<string, WixProduktInfo>;
}

function formateraMatt(t: number[]): string {
  return t.map((x) => String(x).replace(".", ",")).join(" × ");
}

function kort(s: string, max: number): string {
  const t = redigera(s.replace(/\s+/g, " ").trim());
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Hur många grupper av närmast lika mått listan faller i. */
function antalMattGrupper(listor: number[][]): number {
  const grupper: number[][] = [];
  for (const l of listor) {
    if (l.length === 0) continue;
    if (!grupper.some((g) => listorNara(g, l))) grupper.push(l);
  }
  return grupper.length;
}

export function hittaFamiljer(indata: FamiljIndata): FamiljSvar {
  const radPerArtikel = new Map<string, AosomRow>();
  for (const r of indata.rader) if (!radPerArtikel.has(r.sku)) radPerArtikel.set(r.sku, r);

  // Våra sidor. En pensionerad rad är redan avgjord (en dubblett eller ett
  // utkast som blivit färg på en annan sida) och räknas inte.
  const sidor = new Map<string, Sida>();
  let mappningar = 0;
  let utanWixProdukt = 0;
  for (const m of indata.mappningar) {
    if (!isAosomMapping(m) || m.draftStatus === "rejected") continue;
    mappningar++;
    const wix = indata.wix.get(m.wixProductId);
    if (!wix) { utanWixProdukt++; continue; }
    const artiklar = aosomArtiklarPaRaden(m);
    if (artiklar.length === 0) continue;
    const fanns = sidor.get(m.wixProductId);
    if (fanns) {
      for (const a of artiklar) if (!fanns.artiklar.includes(a)) fanns.artiklar.push(a);
      continue;
    }
    sidor.set(m.wixProductId, {
      id: m.wixProductId,
      status: wix.visible ? "publicerad" : "utkast",
      wix,
      artiklar: [...artiklar],
    });
  }

  // Artikel → sida. Samma artikel på två sidor är en dubblett i sig — den
  // kopplas ihop direkt, oavsett vad feeden säger.
  const mangder = new Mangder();
  const dubbletter = new Mangder();
  const sidaPerArtikel = new Map<string, string>();
  let sammaArtikelPaTvaSidor = 0;
  let artiklar = 0;
  let utanFeedrad = 0;
  for (const s of sidor.values()) {
    for (const a of s.artiklar) {
      artiklar++;
      if (!radPerArtikel.has(a)) utanFeedrad++;
      const annan = sidaPerArtikel.get(a);
      if (annan && annan !== s.id) {
        sammaArtikelPaTvaSidor++;
        mangder.forena(`u:${s.id}`, `u:${annan}`);
        dubbletter.forena(`u:${s.id}`, `u:${annan}`);
      } else {
        sidaPerArtikel.set(a, s.id);
      }
    }
  }

  // Noderna: våra artiklar (nyckel = sidan) och feedrader vi inte har men som
  // går att skicka hit (nyckel = raden, bara internt).
  const noder: Nod[] = [];
  let artiklarMedPsin = 0;
  for (const r of indata.rader) {
    const sida = sidaPerArtikel.get(r.sku);
    if (!sida && !isShippableToSe(r)) continue;
    const drag = dragAv(r);
    if (sida && drag.psin) artiklarMedPsin++;
    noder.push({ nyckel: sida ? `u:${sida}` : `f:${r.rowIndex}`, rad: r, drag });
  }

  const perPsin = new Map<string, number[]>();
  const perFysik = new Map<string, number[]>();
  noder.forEach((n, i) => {
    if (n.drag.psin) {
      const l = perPsin.get(n.drag.psin) ?? [];
      l.push(i);
      perPsin.set(n.drag.psin, l);
    }
    if (n.drag.matt.length > 0 || n.drag.paket.length > 0) {
      const k = `${n.drag.matt.join("x")}|${n.drag.paket.join("x")}`;
      const l = perFysik.get(k) ?? [];
      l.push(i);
      perFysik.set(k, l);
    }
  });

  let forStoraGrupper = 0;
  const provade = new Set<string>();
  const kanter: Record<Relation, number> = { farg: 0, samma: 0, storlek: 0 };
  for (const grupp of [...perPsin.values(), ...perFysik.values()]) {
    if (grupp.length < 2) continue;
    if (grupp.length > MAX_GRUPP) { forStoraGrupper++; continue; }
    for (let x = 0; x < grupp.length; x++) {
      for (let y = x + 1; y < grupp.length; y++) {
        const i = Math.min(grupp[x], grupp[y]);
        const j = Math.max(grupp[x], grupp[y]);
        const par = `${i}:${j}`;
        if (provade.has(par)) continue;
        provade.add(par);
        const a = noder[i];
        const b = noder[j];
        if (a.nyckel === b.nyckel) continue;
        const { relation } = jamfor(a.drag, b.drag);
        if (!relation) continue;
        mangder.forena(a.nyckel, b.nyckel);
        if (relation === "samma") dubbletter.forena(a.nyckel, b.nyckel);
        kanter[relation]++;
      }
    }
  }

  // Komponenter.
  const komponenter = new Map<string, Set<string>>();
  const allaNycklar = new Set<string>([...noder.map((n) => n.nyckel), ...[...sidor.keys()].map((id) => `u:${id}`)]);
  for (const k of allaNycklar) {
    const r = mangder.rot(k);
    const l = komponenter.get(r) ?? new Set<string>();
    l.add(k);
    komponenter.set(r, l);
  }

  const dragPerArtikel = new Map<string, Drag>();
  for (const n of noder) dragPerArtikel.set(n.rad.sku, n.drag);

  const familjer: Familj[] = [];
  let ensammaMedSyskonIFeeden = 0;
  for (const nycklar of komponenter.values()) {
    const vara = [...nycklar].filter((k) => k.startsWith("u:")).map((k) => sidor.get(k.slice(2))!).filter(Boolean);
    const ejHosOss = [...nycklar].filter((k) => k.startsWith("f:")).length;
    if (vara.length < 2) {
      // En komponent med en egen sida och feedrader hänger ihop genom minst en
      // kant — noder förenas bara av en relation.
      if (vara.length === 1 && ejHosOss > 0) ensammaMedSyskonIFeeden++;
      continue;
    }
    familjer.push(byggFamilj(vara, ejHosOss, dragPerArtikel, radPerArtikel, dubbletter));
  }

  familjer.sort((a, b) =>
    b.publicerade - a.publicerade
    || b.medlemmar.length - a.medlemmar.length
    || a.medlemmar[0].wixProductId.localeCompare(b.medlemmar[0].wixProductId));

  const perTyp: Record<FamiljTyp, number> = { farg: 0, storlek: 0, farg_storlek: 0, samma: 0 };
  const perLage: Record<FamiljLage, number> = { en_publicerad: 0, bara_utkast: 0, flera_publicerade: 0 };
  let sidorIFamiljer = 0;
  let publiceradeIFamiljer = 0;
  let verktygetIdag = 0;
  let dubblettgrupper = 0;
  for (const f of familjer) {
    perTyp[f.typ]++;
    perLage[f.lage]++;
    sidorIFamiljer += f.medlemmar.length;
    publiceradeIFamiljer += f.publicerade;
    if (f.verktygetIdag) verktygetIdag++;
    dubblettgrupper += f.sammaVara.length;
  }

  return {
    familjer,
    summering: {
      familjer: familjer.length,
      perTyp,
      perLage,
      sidorIFamiljer,
      publiceradeIFamiljer,
      utkastIFamiljer: sidorIFamiljer - publiceradeIFamiljer,
      verktygetIdag,
      dubblettgrupper,
      sammaArtikelPaTvaSidor,
      ensammaMedSyskonIFeeden,
    },
    underlag: {
      feedrader: indata.rader.length,
      mappningar,
      sidor: sidor.size,
      artiklar,
      artiklarMedPsin,
      utanFeedrad,
      utanWixProdukt,
      forStoraGrupper,
      kanter,
    },
  };
}

function byggFamilj(
  vara: Sida[],
  ejHosOss: number,
  dragPerArtikel: Map<string, Drag>,
  radPerArtikel: Map<string, AosomRow>,
  dubbletter: Mangder,
): Familj {
  const varningar: string[] = [];
  const farger = new Set<string>();
  const mattListor: number[][] = [];
  let utanFarg = 0;
  let utanRad = 0;
  const material: Array<Set<string>> = [];

  const medlemmar: FamiljMedlem[] = vara.map((s) => {
    const rader = s.artiklar.map((a) => radPerArtikel.get(a)).filter((r): r is AosomRow => Boolean(r));
    utanRad += s.artiklar.length - rader.length;
    for (const r of rader) {
      const d = dragPerArtikel.get(r.sku);
      if (!d) continue;
      if (d.farg) farger.add(d.farg); else { farger.add("?"); utanFarg++; }
      mattListor.push(d.matt);
      material.push(d.material);
    }
    const forsta = rader[0] ? dragPerArtikel.get(rader[0].sku) : undefined;
    const publicerad = s.status === "publicerad";
    return {
      wixProductId: s.id,
      status: s.status,
      farg: kort([...new Set(rader.map((r) => r.color.trim()).filter(Boolean))].join(" / "), 40),
      matt: forsta ? formateraMatt(forsta.matt) : "",
      saldo: rader.reduce((sum, r) => sum + synligtSaldo(r.qty), 0),
      pris: s.wix.prisMin,
      artiklar: s.artiklar.length,
      namn: publicerad ? kort(s.wix.name, 70) : "",
      slug: publicerad ? kort(s.wix.slug, 90) : "",
    };
  });

  medlemmar.sort((a, b) =>
    (a.status === b.status ? 0 : a.status === "publicerad" ? -1 : 1)
    || a.wixProductId.localeCompare(b.wixProductId));

  const flerFarger = farger.size > 1;
  const flerMatt = antalMattGrupper(mattListor) > 1;
  const typ: FamiljTyp = flerFarger && flerMatt ? "farg_storlek" : flerFarger ? "farg" : flerMatt ? "storlek" : "samma";

  const publicerade = vara.filter((s) => s.status === "publicerad").length;
  const lage: FamiljLage = publicerade === 0 ? "bara_utkast" : publicerade === 1 ? "en_publicerad" : "flera_publicerade";

  // Dubbletter: våra sidor som hänger ihop genom "samma vara"-kanter (eller en
  // delad artikel), grupperade på dubblettmängdens rot.
  const perRot = new Map<string, string[]>();
  for (const s of vara) {
    const r = dubbletter.rot(`u:${s.id}`);
    const l = perRot.get(r) ?? [];
    l.push(s.id);
    perRot.set(r, l);
  }
  const sammaVara = [...perRot.values()].filter((l) => l.length > 1).map((l) => l.sort());

  // Dagens verktyg: en publicerad enkelartikelsida och ett enkelartikelutkast
  // i samma mått och olika, kända färger.
  const enkel = (s: Sida) => s.artiklar.length === 1 ? dragPerArtikel.get(s.artiklar[0]) : undefined;
  const verktygetIdag = vara.some((p) => {
    if (p.status !== "publicerad") return false;
    const dp = enkel(p);
    if (!dp || !dp.farg) return false;
    return vara.some((u) => {
      if (u.status !== "utkast") return false;
      const du = enkel(u);
      return Boolean(du && du.farg && du.farg !== dp.farg && listorNara(dp.matt, du.matt));
    });
  });

  let prisSpannPct: number | null = null;
  if (typ === "farg" || typ === "samma") {
    const priser = medlemmar.map((m) => m.pris).filter((p): p is number => p !== null && p > 0);
    if (priser.length >= 2) {
      const lagst = Math.min(...priser);
      prisSpannPct = Math.round(((Math.max(...priser) - lagst) / lagst) * 100);
      if (prisSpannPct >= PRISSPANN_VARNING_PCT) varningar.push(`priset skiljer ${prisSpannPct} %`);
    }
  }
  if (utanFarg > 0) varningar.push(`färg saknas i feeden på ${utanFarg} artikel${utanFarg === 1 ? "" : "ar"} — jämför bilderna`);
  const kandaMaterial = material.filter((m) => m.size > 0);
  if (typ === "farg" && kandaMaterial.some((m) => andelGemensamma(m, kandaMaterial[0]) < 1)) {
    varningar.push("materialet skiljer — kan vara två modeller, inte två färger");
  }
  if (vara.some((s) => s.artiklar.length > 1)) varningar.push("en sida är redan sammanslagen");
  if (utanRad > 0) varningar.push(`${utanRad} artikel${utanRad === 1 ? "" : "ar"} saknas i feeden just nu`);

  return {
    typ,
    lage,
    publicerade,
    utkast: vara.length - publicerade,
    verktygetIdag,
    medlemmar,
    sammaVara,
    ejHosOss,
    prisSpannPct,
    varningar,
  };
}

/**
 * Diagnos för ett par sidor: vad jämförelsen såg mellan deras första artiklar.
 * För att kalibrera svepet mot par en människa redan granskat — ett känt par som
 * svepet inte kopplar ihop ska gå att felsöka utan att något nummer skrivs ut.
 */
export function diagnosPar(
  indata: FamiljIndata,
  a: string,
  b: string,
): { a: string; b: string; fel?: string; jamforelse?: Jamforelse } {
  const radFor = (id: string): AosomRow | undefined => {
    const m = indata.mappningar.find((x) => x.wixProductId === id && isAosomMapping(x));
    if (!m) return undefined;
    const artikel = aosomArtiklarPaRaden(m)[0];
    return artikel ? indata.rader.find((r) => r.sku === artikel) : undefined;
  };
  const ra = radFor(a);
  const rb = radFor(b);
  // Id:na ekas tillbaka till en publik logg. De ska vara Wix-id, men en
  // människa som klistrar fel sträng ska inte kunna publicera ett nummer.
  const visaA = redigera(a);
  const visaB = redigera(b);
  if (!ra || !rb) {
    return { a: visaA, b: visaB, fel: `${!ra ? visaA : visaB} saknar Aosom-mappning eller feedrad` };
  }
  return { a: visaA, b: visaB, jamforelse: jamfor(dragAv(ra), dragAv(rb)) };
}
