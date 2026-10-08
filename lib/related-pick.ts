// lib/related-pick.ts
//
// Ren urvalslogik för "Liknande produkter" — inga sidoeffekter, ingen JSON/IO-import,
// så den är enhetstestbar direkt (lib/related-products.test.ts).
//
// Den AI-kuraterade kartan (data/related-products.json, 9 juli 2026) är borttagen
// 2026-10-08. Den täckte 386 av 3 883 produktsidor och valdes ur en katalog på
// ~420 produkter, så den kände inte till 90 % av dagens sortiment.

import type { Product } from "./products";

// ── Meningsfullt kategori-överlapp ──────────────────────────────────────────
// Wix-katalogen har en "All Products"-kategori som sitter på VARENDA produkt
// (audit 2026-07: den täckte alla 420 produkter). En sådan universell kategori
// bär ingen relevanssignal — utan att exkludera den "delar" varje produkt kategori
// med varenda annan, så fallback-överlappet kunde dra in en helt orelaterad produkt
// (mätt: produkter i små kategorier fick ett irrelevant 4:e förslag). Vi hittar
// universella kategorier DYNAMISKT (täcker ≥90 % av katalogen) och räknar dem inte
// som "samma kategori". Robust: finns ingen sådan kategori exkluderas inget.
/** Läser bara collectionIds, så signaturen kräver inte mer än så — listsidorna
 *  skickar en smalare ListProduct (se lib/products.ts) och ska kunna anropa den. */
export function universalCollectionIds(all: { collectionIds?: string[] }[]): Set<string> {
  const uni = new Set<string>();
  if (all.length < 20) return uni;
  const count = new Map<string, number>();
  for (const p of all) for (const c of p.collectionIds || []) count.set(c, (count.get(c) || 0) + 1);
  const threshold = all.length * 0.9;
  for (const [c, n] of count) if (n >= threshold) uni.add(c);
  return uni;
}

/** Antal MENINGSFULLA (icke-universella) kategorier som två produkter delar. */
export function sharedCategoryCount(a: Product, b: Product, universal: Set<string>): number {
  const bs = new Set((b.collectionIds || []).filter((c) => !universal.has(c)));
  let n = 0;
  for (const c of a.collectionIds || []) if (!universal.has(c) && bs.has(c)) n++;
  return n;
}

// ── Merchandiser-signaler (gratis: allt kommer ur Wix-produktdatan) ──────────
//
// Urvalet rankade förr på ENBART antal delade kategorier. Det gör att en
// produkt i "Hem & Inredning" (hundratals varor) ser exakt likadan ut som en i
// "Badrum & Hemtextil" (ett fåtal) — och att en skruvmejsel för 79 kr kan
// föreslås under en möbel för 3 000 kr. Kategorins sällsynthet, prispassning,
// produkttyp och variation räknas fram ur data vi redan har — gratis, för
// varje produkt, utan att en genererad ögonblicksbild kan bli inaktuell.

/**
 * Kategorisärskiljning som vikt: en kategori som få produkter delar bär mycket
 * mer signal än en som halva katalogen ligger i (klassisk IDF). Det ersätter
 * "räkna delade kategorier", där alla kategorier vägde lika mycket.
 *
 * Behöver INTE kategoriträdet — sällsyntheten mäts direkt i katalogen, så en
 * underkategori får automatiskt högre vikt än sin förälder.
 */
export function categoryWeights(all: Product[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const p of all) for (const c of p.collectionIds || []) freq.set(c, (freq.get(c) || 0) + 1);
  const w = new Map<string, number>();
  for (const [c, n] of freq) w.set(c, Math.log((all.length + 1) / (n + 1)) + 1);
  return w;
}

/**
 * Prispassning, 1.0 = perfekt. Mäter KVOT, inte krondifferens — "many times its
 * price" i merchandiser-prompten är multiplikativt: 200 vs 400 kr är samma
 * felsteg som 2 000 vs 4 000. Upp till 1,5× är gratis (normal prisspridning
 * inom en kategori), därefter faller den mjukt. Saknat pris → neutral (1.0),
 * så en produkt utan prisdata aldrig straffas.
 */
export function priceFit(a: number | undefined, b: number | undefined): number {
  if (!a || !b || a <= 0 || b <= 0) return 1;
  const ratio = Math.max(a, b) / Math.min(a, b);
  return 1 / (1 + Math.max(0, ratio - 1.5) / 2);
}

// ── Produkttyp ───────────────────────────────────────────────────────────────
//
// Mätt 2026-10-08 på hela katalogen (3 985 produkter): 60 % av produktsidorna
// visade inget förslag av samma sorts vara. Namnlikheten användes bara för att
// TRYCKA NER det som liknade produkten, så i en bred kategori som
// "Trädgårdsskötsel & Bevattning" fick en kompostbehållare en knäpall, en
// slangvinda och snökäppar, medan katalogens andra kompostbehållare hamnade
// längre ner. Nu är produkttypen en relevanssignal.
//
// Likheten räknas på bokstavsfyrgram, inte på hela ord. Svenskan sätter ihop
// och böjer: "barstol" och "barstolar", "kattlåda" och "kattlådsskåp" är olika
// ord men nästan samma fyrgram. Namnets början (före "–", komma eller
// med/i/för …) väger tre gånger så mycket, för det är där produkttypen står.
// Fyrgrammen viktas på sällsynthet (IDF), så "hopfällbar", som finns överallt,
// gör inte en arbetsbänk och en bardisk lika (granskningen 2026-08-15).

// Färgord stryks som hela ord efter uppdelningen. Ett reguljärt uttryck med \b
// hade missat "grå" och "blå": \b räknar inte å, ä och ö som bokstäver.
const FARGORD = new Set([
  "svart", "svarta", "vit", "vitt", "vita", "grå", "grått", "gråa", "ljusgrå", "mörkgrå",
  "beige", "brun", "brunt", "bruna", "blå", "blått", "blåa", "grön", "grönt", "gröna",
  "röd", "rött", "röda", "rosa", "gul", "gult", "gula", "orange", "lila", "cremevit",
  "gräddvit", "krämvit", "naturfärgad", "ekfärg", "valnöt", "antracit", "silver", "guld",
  "guldfärgad", "turkos", "marinblå", "mörkblå", "ljusblå", "kaffebrun", "senapsgul", "taupe",
]);
const STOPPORD = new Set(["med", "och", "för", "till", "som", "utan", "eller", "två", "tre", "fyra", "fem", "sex", "pack", "set", "bär", "från", "inne", "ute", "hög", "bred", "lång"]);

/** Namnets ord utan färger, siffror och mått. Det som är kvar beskriver varan. */
export function typord(name: string): string[] {
  return (name || "")
    .toLowerCase()
    .replace(/[0-9]+([,.][0-9]+)?/g, " ")
    .split(/[^a-zà-öø-ÿ]+/i)
    .filter((t) => t.length >= 3 && !STOPPORD.has(t) && !FARGORD.has(t));
}

/** Namnets huvuddel: det som står före första tankstreck, komma eller
 *  "med/i/för/till/som/utan/på". Där står produkttypen ("Barstolar 2-pack",
 *  "Takväska vattentät"); resten är egenskaper. */
export function huvud(name: string): string {
  const s = name || "";
  const m = /\s[–—-]\s|,|\s(med|i|för|till|som|utan|på)\s/i.exec(s);
  return m ? s.slice(0, m.index) : s;
}

const HUVUDVIKT = 3;

function fyrgram(name: string): Map<string, number> {
  const m = new Map<string, number>();
  const lagg = (text: string, vikt: number) => {
    for (const w of typord(text)) {
      const s = ` ${w} `;
      for (let i = 0; i + 4 <= s.length; i++) {
        const g = s.slice(i, i + 4);
        m.set(g, (m.get(g) || 0) + vikt);
      }
    }
  };
  lagg(name, 1);
  lagg(huvud(name), HUVUDVIKT - 1);
  return m;
}

function vektor(name: string, idf: Map<string, number>): Map<string, number> {
  const v = new Map<string, number>();
  for (const [g, tf] of fyrgram(name)) {
    const x = tf * (idf.get(g) ?? 0);
    if (x > 0) v.set(g, x);
  }
  return v;
}

function cosinus(a: Map<string, number>, b: Map<string, number>): number {
  let d = 0, na = 0, nb = 0;
  for (const [g, x] of a) {
    na += x * x;
    const y = b.get(g);
    if (y) d += x * y;
  }
  for (const y of b.values()) nb += y * y;
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}

// ── Djurslag ─────────────────────────────────────────────────────────────────
// "Lek & Tillbehör för husdjur" och flera andra husdjurskategorier blandar hund
// och katt. Mätt 2026-10-08: 105 produktsidor föreslog ett annat djurslag, till
// exempel kattsängar under en hundsäng. Ett förslag som nämner ett annat djur,
// och inte produktens, tas bort. Neutrala varor ("husdjurstrappa") står kvar.
// "hundtandsmönster" är ett tygmönster, inte en hund.
//
// Terrarier, sköldpaddshus och akvarier räknas också: utan dem fick kattlådor
// och hundburar ett akvarium. Där matchas bara ordstammar som katalogen
// använder för själva djurvarorna ("Glasterrarium", "Nanoakvarium"). "fisk"
// hade också tagit ett fiskespö, ett fiskrensbord och en fiskformad leksak.
const DJURSLAG: Array<[string, RegExp]> = [
  ["hund", /(^|[^\p{L}])(hund(?!tand)\p{L}*|valp\p{L}*)/iu],
  ["katt", /(^|[^\p{L}])katt\p{L}*/iu],
  ["smådjur", /(^|[^\p{L}])(kanin|hamster|marsvin|gnagar|chinchilla|smådjur)\p{L}*/iu],
  ["fågel", /(^|[^\p{L}])(fågel|fåglar|undulat|papeg)\p{L}*/iu],
  ["höns", /(^|[^\p{L}])(höns|hönor|kyckling)\p{L}*/iu],
  ["reptil", /terrari|reptil|sköldpaddshus/iu],
  ["fisk", /akvari/iu],
];

/** Vilka djurslag ett produktnamn nämner. Tomt för de flesta varor. */
export function djurslag(name: string): Set<string> {
  const s = new Set<string>();
  for (const [slag, re] of DJURSLAG) if (re.test(name || "")) s.add(slag);
  return s;
}

function djurslagKrockar(a: Set<string>, b: Set<string>): boolean {
  if (!a.size || !b.size) return false;
  for (const x of a) if (b.has(x)) return false;
  return true;
}

// ── Katalogens likhetsdata, byggd en gång per katalog ────────────────────────
// Fyrgrammens IDF och varje produkts vektor tar ~0,4 s för 4 000 produkter.
// Byggs de vid varje produktsida blir varje rendering så mycket dyrare, så de
// sparas mellan anropen så länge katalogen är densamma.
//
// getProducts() håller katalogen i modulen så länge instansen lever, så samma
// lista kommer tillbaka vid varje rendering och känns igen direkt. Listan får
// därför inte ändras på plats. En ny lista, till exempel efter en omhämtning,
// jämförs på ett fingeravtryck (~2 ms) som ändras när en produkt läggs till,
// tas bort, byter adress, namn eller kategorier. Det räknas på tecknen, inte på
// längderna: Wix kategori-id är alla 36 tecken, så en produkt som flyttats till
// en annan kategori hade annars sett likadan ut. En produkt som ändå saknas
// räknas fram när den behövs. Pris, lager och försäljning läses vid varje
// anrop och ingår inte här.
export type Likhetsdata = {
  idf: Map<string, number>;
  vektorer: Map<string, Map<string, number>>;
  djur: Map<string, Set<string>>;
  universal: Set<string>;
  kategorivikt: Map<string, number>;
};

function hasha(h: number, s: string): number {
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return (Math.imul(h, 31) + 1) | 0; // avgränsare, så "ab"+"c" ≠ "a"+"bc"
}

function fingeravtryck(all: Product[]): string {
  let h = 0;
  for (const p of all) {
    h = hasha(h, p.slug || "");
    h = hasha(h, p.name || "");
    for (const c of p.collectionIds || []) h = hasha(h, c);
    h = (Math.imul(h, 31) + 2) | 0;
  }
  return `${all.length}:${h}`;
}

let minne: { lista: Product[]; nyckel: string; data: Likhetsdata } | null = null;

export function likhetsdata(all: Product[]): Likhetsdata {
  if (minne && minne.lista === all) return minne.data;
  const nyckel = fingeravtryck(all);
  if (minne && minne.nyckel === nyckel) {
    minne.lista = all;
    return minne.data;
  }
  const df = new Map<string, number>();
  for (const p of all) for (const g of fyrgram(p.name).keys()) df.set(g, (df.get(g) || 0) + 1);
  const idf = new Map<string, number>();
  for (const [g, n] of df) idf.set(g, Math.log((all.length + 1) / (n + 1)));
  const vektorer = new Map<string, Map<string, number>>();
  const djur = new Map<string, Set<string>>();
  for (const p of all) {
    vektorer.set(p.slug, vektor(p.name, idf));
    djur.set(p.slug, djurslag(p.name));
  }
  const data: Likhetsdata = {
    idf,
    vektorer,
    djur,
    universal: universalCollectionIds(all),
    kategorivikt: categoryWeights(all),
  };
  minne = { lista: all, nyckel, data };
  return data;
}

/** Hur lika två produktnamn är som varor, 0–1. */
export function typLikhet(a: string, b: string, d: Likhetsdata): number {
  return cosinus(vektor(a, d.idf), vektor(b, d.idf));
}

// Under TYP_GOLV är likheten slump (ett gemensamt "vatt" i "vattentät" och
// "vattenavskiljare") och räknas som noll. SAMMA_TYP är samma sorts vara.
// NARA_DUBBLETT är samma vara i en annan färg eller storlek.
const TYPVIKT = 2.5;
const TYP_GOLV = 0.15;
export const SAMMA_TYP = 0.35;
export const NARA_DUBBLETT = 0.9;
const VARIATION = 0.6;

/**
 * "Liknande produkter" för produktsidan, bäst först:
 *   • bara varor i lager, aldrig produkten själv, aldrig samma vara två gånger,
 *   • rankat på delade kategorier (viktade på sällsynthet), prispassning och
 *     produkttyp, med försäljningen som lätt skiljelinje,
 *   • inget förslag som nämner ett annat djurslag än produkten,
 *   • samma vara i en annan färg eller storlek får en plats, fler bara om
 *     inget annat finns,
 *   • två nästan likadana förslag trängs inte, och är de första förslagen
 *     alla samma sorts vara går sista platsen till något annat ur samma
 *     kategorier, till exempel ett tillbehör.
 * Kan returnera färre än `limit` (anroparen visar blocket först vid två).
 */
export function pickRelated(p: Product, all: Product[], limit = 4): Product[] {
  const d = likhetsdata(all);
  const vek = (x: Product) => d.vektorer.get(x.slug) ?? vektor(x.name, d.idf);
  const djurFor = (x: Product) => d.djur.get(x.slug) ?? djurslag(x.name);
  const pv = vek(p);
  const pd = djurFor(p);
  // Försäljningen ändras varje dag, så den läses här och inte ur minnet.
  let maxPop = 1;
  for (const x of all) if ((x.popularity || 0) > maxPop) maxPop = x.popularity || 0;

  type Kandidat = { x: Product; v: Map<string, number>; typ: number; bas: number; poang: number };
  const kandidater: Kandidat[] = [];
  const sedda = new Set<string>([p.slug]);
  for (const x of all) {
    if (!x.inStock || sedda.has(x.slug)) continue;
    sedda.add(x.slug);
    const xs = new Set((x.collectionIds || []).filter((c) => !d.universal.has(c)));
    let affinitet = 0;
    for (const c of p.collectionIds || []) if (!d.universal.has(c) && xs.has(c)) affinitet += d.kategorivikt.get(c) || 1;
    if (affinitet <= 0) continue;
    if (djurslagKrockar(pd, djurFor(x))) continue;
    const v = vek(x);
    const r = cosinus(pv, v);
    const typ = r >= TYP_GOLV ? r : 0;
    // Popularitet är verklig försäljning (90 dagar). Den ska skilja mellan
    // likvärdiga kandidater, inte köra över relevansen.
    const boost = 1 + 0.2 * ((x.popularity || 0) / maxPop) + 0.05 * ((x.imageScore || 0) / 100);
    const bas = affinitet * priceFit(p.priceNum, x.priceNum) * boost;
    kandidater.push({ x, v, typ, bas, poang: bas * (1 + TYPVIKT * typ) });
  }

  const valda: Kandidat[] = [];
  let dubbletter = 0;
  const basta = (blanda: boolean, tillatDubblett: boolean): Kandidat | null => {
    let best: Kandidat | null = null;
    let bastaPoang = 0;
    for (const k of kandidater) {
      if (valda.includes(k)) continue;
      if (k.typ >= NARA_DUBBLETT && dubbletter >= 1 && !tillatDubblett) continue;
      if (blanda && (k.typ >= SAMMA_TYP || valda.some((o) => cosinus(k.v, o.v) >= SAMMA_TYP))) continue;
      let damp = 1;
      for (const o of valda) if (cosinus(k.v, o.v) >= VARIATION) damp *= 0.4;
      const poang = (blanda ? k.bas : k.poang) * damp;
      if (!best || poang > bastaPoang) { best = k; bastaPoang = poang; }
    }
    return best;
  };
  while (valda.length < limit) {
    const blanda = valda.length === limit - 1 && valda.length >= 2 && valda.every((o) => o.typ >= SAMMA_TYP);
    // Hellre en färgvariant till än ett tomt förslag: de släpps in sist.
    const k = (blanda ? basta(true, false) : null) ?? basta(false, false) ?? basta(false, true);
    if (!k) break;
    if (k.typ >= NARA_DUBBLETT) dubbletter++;
    valda.push(k);
  }
  return valda.map((k) => k.x);
}
