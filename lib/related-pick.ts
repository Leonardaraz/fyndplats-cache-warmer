// lib/related-pick.ts
//
// Ren urvalslogik för "Liknande produkter" och varukorgens förslag — ingen
// JSON/IO-import, så den är enhetstestbar direkt (lib/related-products.test.ts
// och lib/kundvagn-forslag.test.ts).
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
export function categoryWeights(all: { collectionIds?: string[] }[]): Map<string, number> {
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
// "Lek & Tillbehör för husdjur" och flera andra husdjurskategorier blandar
// djurslagen. Mätt 2026-10-08: 118 produktsidor föreslog ett annat djurslag,
// till exempel kattsängar under en hundsäng eller ett akvarium under en
// kattlåda. Ett förslag som nämner ett annat djur, och inte produktens, tas
// bort. Neutrala varor ("husdjurstrappa") står kvar.
//
// Hund och katt räknas bara i ordets början, så att "skattkista" inte blir en
// katt, och "hundtandsmönster" är ett tygmönster. Agilityset är hundvaror
// (alla 14 i katalogen 2026-10-08). Klösträd och andra klösmöbler är
// kattvaror även när namnet inte säger katt (76 av 92 gör det inte).
// Smådjuren räknas också inne i ett sammansatt ord ("Dvärghamsterbur"). För
// reptiler och fiskar matchas bara ordstammar som katalogen använder för
// själva djurvarorna ("Glasterrarium", "Nanoakvarium"): "fisk" hade också
// tagit ett fiskespö, ett fiskrensbord och en fiskformad leksak.
const DJURSLAG: Array<[string, RegExp]> = [
  ["hund", /(^|[^\p{L}])(hund(?!tand)\p{L}*|valp\p{L}*)|agility/iu],
  ["katt", /(^|[^\p{L}])katt\p{L}*|klös/iu],
  ["smådjur", /kanin|hamster|marsvin|gnagar|chinchilla|smådjur/iu],
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
//
// Minnet har två platser: produktsidan räknar på hela katalogen och
// varukorgens förslag på de varor som kan föreslås (kundvagnsForslag). Hamnar
// båda på samma instans hade en enda plats byggts om varje gång de turades om.
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

/** Det likhetsdatan läser ur en vara. */
type LikhetsVara = { slug: string; name: string; collectionIds?: string[] };

function fingeravtryck(all: LikhetsVara[]): string {
  let h = 0;
  for (const p of all) {
    h = hasha(h, p.slug || "");
    h = hasha(h, p.name || "");
    for (const c of p.collectionIds || []) h = hasha(h, c);
    h = (Math.imul(h, 31) + 2) | 0;
  }
  return `${all.length}:${h}`;
}

const MINNESPLATSER = 2;
const minnen: Array<{ lista: LikhetsVara[]; nyckel: string; data: Likhetsdata }> = [];

export function likhetsdata(all: LikhetsVara[]): Likhetsdata {
  let i = minnen.findIndex((m) => m.lista === all);
  if (i < 0) {
    const nyckel = fingeravtryck(all);
    i = minnen.findIndex((m) => m.nyckel === nyckel);
    if (i < 0) {
      minnen.unshift({ lista: all, nyckel, data: byggLikhetsdata(all) });
      minnen.length = Math.min(minnen.length, MINNESPLATSER);
      return minnen[0].data;
    }
    minnen[i].lista = all;
  }
  // Senast använd först, så den som använts minst nyligen får ge plats.
  const [m] = minnen.splice(i, 1);
  minnen.unshift(m);
  return m.data;
}

function byggLikhetsdata(all: LikhetsVara[]): Likhetsdata {
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
  return {
    idf,
    vektorer,
    djur,
    universal: universalCollectionIds(all),
    kategorivikt: categoryWeights(all),
  };
}

/** Hur lika två produktnamn är som varor, 0–1. */
export function typLikhet(a: string, b: string, d: Likhetsdata): number {
  return cosinus(vektor(a, d.idf), vektor(b, d.idf));
}

// Produktens sparade vektor, eller en uträknad för en produkt som saknas i katalogen.
function vektorFor(x: LikhetsVara, d: Likhetsdata): Map<string, number> {
  return d.vektorer.get(x.slug) ?? vektor(x.name, d.idf);
}

// Som typLikhet, men för två produkter och med katalogens sparade vektorer.
function produktLikhet(a: LikhetsVara, b: LikhetsVara, d: Likhetsdata): number {
  return cosinus(vektorFor(a, d), vektorFor(b, d));
}

// Under TYP_GOLV är likheten slump (ett gemensamt "vatt" i "vattentät" och
// "vattenavskiljare") och räknas som noll. SAMMA_TYP är gränsen för samma
// sorts vara, som testerna och mätningarna räknar med. NARA_DUBBLETT är samma
// vara i en annan färg eller storlek. Över VARIATION liknar två förslag
// varandra för mycket för att stå bredvid varandra.
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
 *   • två nästan likadana förslag trängs inte.
 * Kan returnera färre än `limit` (anroparen visar blocket först vid två).
 *
 * Alla platser går till liknande varor, som rubriken lovar. En tvingad sista
 * plats för "något annat ur samma kategorier" prövades och togs bort
 * 2026-10-08 (Leonards beslut). Den valde utan att veta vad som hör ihop, så
 * två knästolar fick en rumsavdelare. I ett stickprov på 40 sidor gjorde den
 * förslagen sämre på tre och bättre på en. Varor som hör ihop, som stolar
 * till ett bord, hör hemma i en egen rad med egen rubrik.
 */
export function pickRelated(p: Product, all: Product[], limit = 4): Product[] {
  const d = likhetsdata(all);
  const vek = (x: Product) => vektorFor(x, d);
  const djurFor = (x: Product) => d.djur.get(x.slug) ?? djurslag(x.name);
  const pv = vek(p);
  const pd = djurFor(p);
  // Försäljningen ändras varje dag, så den läses här och inte ur minnet.
  let maxPop = 1;
  for (const x of all) if ((x.popularity || 0) > maxPop) maxPop = x.popularity || 0;

  type Kandidat = { x: Product; v: Map<string, number>; typ: number; poang: number };
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
    kandidater.push({ x, v, typ, poang: bas * (1 + TYPVIKT * typ) });
  }

  const valda: Kandidat[] = [];
  let dubbletter = 0;
  const basta = (tillatDubblett: boolean): Kandidat | null => {
    let best: Kandidat | null = null;
    let bastaPoang = 0;
    for (const k of kandidater) {
      if (valda.includes(k)) continue;
      if (k.typ >= NARA_DUBBLETT && dubbletter >= 1 && !tillatDubblett) continue;
      let damp = 1;
      for (const o of valda) if (cosinus(k.v, o.v) >= VARIATION) damp *= 0.4;
      const poang = k.poang * damp;
      if (!best || poang > bastaPoang) { best = k; bastaPoang = poang; }
    }
    return best;
  };
  while (valda.length < limit) {
    // Hellre en färgvariant till än ett tomt förslag: de släpps in sist.
    const k = basta(false) ?? basta(true);
    if (!k) break;
    if (k.typ >= NARA_DUBBLETT) dubbletter++;
    valda.push(k);
  }
  return valda.map((k) => k.x);
}

// ── Varukorgens förslag ─────────────────────────────────────────────────────
//
// Varor som kompletterar det som ligger i varukorgen.
//
// Förut visades samma åtta varor för alla, oavsett varukorg: Wix-etiketten
// "Bestseller" först, sedan bildbetyget, spritt över avdelningarna. Rubriken
// var "Andra köpte också", men vi har ingen data om vad som köps tillsammans,
// så rubriken påstod något urvalet inte byggde på. Förslagen kunde dessutom
// kosta mer än hela varukorgen (en soffa för 7 359 kr i en varukorg på
// 4 876 kr, Leonards skärmdump 2026-10-08).
//
// Nu utgår förslagen från varorna i varukorgen. Reglerna nedan säger vilka
// sorters varor som kompletterar en viss sorts vara, till exempel kontorsstolar
// till ett skrivbord och nattduksbord till en säng. De läser namnets huvud,
// där produkttypen står. Kategorierna räckte inte: "Matbord & stolar" blandar
// bord, matstolar och barstolar, så matstolar fick barstolar, och en
// massagestol fick en barnpall ur "Sittpuffar & fotpallar" (stickprov på 30
// varukorgar 2026-10-08). En vara utan regel ger inga förslag. Hellre inga
// förslag än slumpade.

// Ett ord som börjar på något av alternativen: "matstol" träffar "matstolar"
// men inte "barstolar".
const ordborjan = (alt: string) => new RegExp(`(?:^|[^\\p{L}])(?:${alt})`, "iu");
// Ett helt ord: "grill" träffar inte "grilltält".
const helaOrd = (alt: string) => new RegExp(`(?:^|[^\\p{L}])(?:${alt})(?![\\p{L}])`, "iu");

export type Komplement = { vara: RegExp; passar: RegExp[] };

/**
 * Vilka sorters varor som kompletterar en viss sorts vara, bäst först. `vara`
 * prövas mot huvudet i namnet på varan i varukorgen, `passar` mot förslagets.
 * Mönstren är smala med flit, för de gäller i hela katalogen: en golvlampa
 * till en fåtölj ligger i en annan avdelning än fåtöljen. Ett mönster utan
 * träffar ger inga förslag, inget fel.
 */
export const KOMPLEMENT: Komplement[] = [
  // Möbler
  { vara: ordborjan("matbord|köksbord|klaffbord"), passar: [ordborjan("matstol|köksstol|stolar"), ordborjan("sideboard|skänk|vitrinskåp")] },
  { vara: ordborjan("matstol|köksstol"), passar: [ordborjan("matbord|köksbord|klaffbord")] },
  { vara: ordborjan("matgrupp"), passar: [ordborjan("sideboard|skänk|vitrinskåp")] },
  { vara: ordborjan("sideboard|skänk|vitrinskåp"), passar: [ordborjan("väggspegel")] },
  { vara: ordborjan("barbord|bardisk|köksö"), passar: [ordborjan("barstol|barpall")] },
  { vara: ordborjan("barstol|barpall"), passar: [ordborjan("barbord|bardisk")] },
  { vara: helaOrd("skrivbord|hörnskrivbord|datorbord|gamingbord"), passar: [ordborjan("kontorsstol|skrivbordsstol|gamingstol|knästol|chefsstol|ritstol|arbetsstol"), ordborjan("hurts|skrivarställ")] },
  { vara: ordborjan("kontorsstol|skrivbordsstol|gamingstol|knästol|chefsstol|ritstol|arbetsstol"), passar: [helaOrd("skrivbord|hörnskrivbord|datorbord|gamingbord"), ordborjan("hurts")] },
  { vara: helaOrd("säng|sängram|dubbelsäng|enkelsäng|kontinentalsäng|våningssäng"), passar: [ordborjan("nattduksbord"), ordborjan("madrass"), ordborjan("sänggavel|sängbänk")] },
  { vara: ordborjan("nattduksbord"), passar: [ordborjan("byrå")] },
  { vara: ordborjan("byrå"), passar: [ordborjan("nattduksbord"), ordborjan("väggspegel|helkroppsspegel|golvspegel")] },
  { vara: ordborjan("garderob|tyggarderob|klädskåp|klädställ"), passar: [ordborjan("skohylla|skoställ|skoskåp|skobänk"), ordborjan("helkroppsspegel|golvspegel|väggspegel")] },
  { vara: ordborjan("skoskåp|skobänk|skohylla|skoställ"), passar: [ordborjan("väggspegel|helkroppsspegel"), ordborjan("klädhängare|hallmöbel|paraplyställ")] },
  { vara: ordborjan("hallmöbel|klädhängare"), passar: [ordborjan("skoskåp|skobänk|skohylla|skoställ"), ordborjan("väggspegel")] },
  { vara: ordborjan("soffa|bäddsoffa|hörnsoffa|modulsoffa|\\p{L}*sitssoffa"), passar: [ordborjan("soffbord|satsbord"), ordborjan("sidobord"), ordborjan("fotpall|sittpuff"), ordborjan("golvlampa")] },
  { vara: ordborjan("\\p{L}*fåtölj|gungstol|massagestol"), passar: [ordborjan("fotpall|sittpuff"), ordborjan("sidobord|satsbord"), ordborjan("golvlampa")] },
  { vara: ordborjan("soffbord|satsbord"), passar: [ordborjan("sidobord"), ordborjan("fotpall|sittpuff")] },
  { vara: ordborjan("sidobord"), passar: [ordborjan("golvlampa"), ordborjan("fotpall|sittpuff")] },
  { vara: ordborjan("tv-bänk|tvbänk"), passar: [ordborjan("soffbord|satsbord")] },
  { vara: ordborjan("bokhylla|barnbokhylla|kubhylla"), passar: [ordborjan("golvlampa")] },
  // Hem & Inredning, Kök
  { vara: ordborjan("badrumsskåp|tvättställsskåp|spegelskåp|medicinskåp"), passar: [ordborjan("badrumsspegel"), ordborjan("tvättkorg|tvättsorterare"), ordborjan("badrumshylla|duschpall")] },
  { vara: ordborjan("badrumsspegel"), passar: [ordborjan("badrumsskåp|tvättställsskåp"), ordborjan("badrumshylla")] },
  { vara: ordborjan("tvättkorg|tvättsorterare"), passar: [ordborjan("torkställ|torkvagn")] },
  { vara: ordborjan("golvlampa"), passar: [ordborjan("sidobord")] },
  { vara: ordborjan("vattenkokare"), passar: [ordborjan("brödrost")] },
  { vara: ordborjan("brödrost"), passar: [ordborjan("vattenkokare")] },
  // Trädgård
  { vara: ordborjan("\\p{L}*växthus|foliehus|drivbänk|odlingstunnel"), passar: [ordborjan("odlingslåda|odlingsbord|pallkrage"), ordborjan("blomställ|växthylla"), ordborjan("slangvinda|bevattning|vattentunna|vattenkanna")] },
  { vara: ordborjan("odlingslåda|odlingsbord|pallkrage"), passar: [ordborjan("miniväxthus|drivbänk|odlingstunnel"), ordborjan("slangvinda|bevattning|vattentunna|vattenkanna")] },
  { vara: helaOrd("kolgrill|gasolgrill|klotgrill|pelletsgrill|elgrill|grill"), passar: [ordborjan("grilltält|grillskydd|grillöverdrag|grillverktyg|grillbestick")] },
  { vara: ordborjan("trädgårdsbord|bistroset|trädgårdsgrupp|loungegrupp|utemöbel|soffgrupp"), passar: [ordborjan("parasoll"), ordborjan("skyddsöverdrag|möbelskydd"), ordborjan("bänkdyna|dyna")] },
  { vara: ordborjan("trädgårdsbänk"), passar: [ordborjan("bänkdyna|dyna"), ordborjan("skyddsöverdrag")] },
  { vara: ordborjan("solsäng|solstol|vilstol"), passar: [ordborjan("parasoll"), ordborjan("dyna")] },
  { vara: ordborjan("eldkorg|eldskål|eldstad|utomhuseldstad"), passar: [ordborjan("vedställ|vedkorg|vedbod"), ordborjan("eldstadsverktyg")] },
  { vara: ordborjan("vedställ|vedkorg|vedbod"), passar: [ordborjan("eldkorg|eldskål|eldstad"), ordborjan("eldstadsverktyg")] },
  // Husdjur. Djurslaget avgör sedan: en hundkoja får aldrig en kattvara.
  { vara: ordborjan("hundkoja|hundbur|hundhage|valphage|hundgrind"), passar: [ordborjan("hundbädd|hundsäng|hundsoffa|hundmadrass"), ordborjan("matskål|vattenskål|foderskål|matstation|foderautomat|vattenfontän")] },
  { vara: ordborjan("hundbädd|hundsäng|hundsoffa"), passar: [ordborjan("matskål|vattenskål|foderskål|matstation|foderautomat|vattenfontän"), ordborjan("hundtrappa|husdjurstrappa")] },
  { vara: ordborjan("klösträd|klöstorn|klöstunna|klöspelare|katthus|kattorn|väggklösträd|takspänt"), passar: [ordborjan("kattlåda"), ordborjan("kattleksak|kattunnel|kattsäng|kattbädd"), ordborjan("vattenfontän|foderautomat|matskål")] },
  { vara: ordborjan("kattlåda"), passar: [ordborjan("vattenfontän|foderautomat|matskål|matstation"), ordborjan("kattleksak|kattunnel|klösbräda")] },
  { vara: ordborjan("hönshus|hönsgård|hönsrastgård"), passar: [ordborjan("hönsrede|värpholk")] },
  // Barn
  { vara: ordborjan("barnbord|barnskrivbord"), passar: [ordborjan("barnstol|barnpall")] },
  // Sport & Fritid
  { vara: ordborjan("träningsbänk"), passar: [ordborjan("hantel|hantlar|hexhantel|skivstång|viktskiva")] },
  { vara: ordborjan("hantel|hantlar|hexhantel"), passar: [ordborjan("träningsbänk"), ordborjan("träningsmatta|gymmatta")] },
  { vara: ordborjan("motionscykel|crosstrainer|löpband|roddmaskin|stepper"), passar: [ordborjan("träningsmatta|gymmatta")] },
  { vara: ordborjan("boxningssäck|punchingboll"), passar: [ordborjan("boxsäcksställ")] },
  { vara: helaOrd("tält|familjetält|tunneltält|kupoltält|campingtält|lufttält"), passar: [ordborjan("sovsäck|liggunderlag|luftmadrass"), ordborjan("campingstol|campingbord|fältsäng")] },
  { vara: ordborjan("campingstol"), passar: [ordborjan("campingbord"), ordborjan("fältsäng|sovsäck|liggunderlag")] },
  { vara: ordborjan("campingbord"), passar: [ordborjan("campingstol"), ordborjan("fältsäng|sovsäck|liggunderlag")] },
  { vara: ordborjan("fältsäng"), passar: [ordborjan("sovsäck|liggunderlag"), ordborjan("campingstol|campingbord")] },
  // Jul
  { vara: helaOrd("julgran|snögran|plastgran|konstgran|gran|granar"), passar: [ordborjan("julgransfot|julgransstativ|julgranskrage|julgransmatta"), ordborjan("ljusslinga|julbelysning")] },
  { vara: ordborjan("jultomte|tomte|snögubbe|pepparkaksgubbe|julby|adventskalender"), passar: [ordborjan("ljusslinga|julbelysning")] },
  // Verktyg
  { vara: ordborjan("verktygsvagn|verktygslåda|verktygsskåp|verkstadsvagn|verkstadsbänk|arbetsbänk"), passar: [ordborjan("verktygssats|verktygsset|hylsnyckel|bitsats"), ordborjan("arbetsbock")] },
];

// Ett förslag får kosta högst 1,5 gånger varan det kompletterar. Upp till
// 60 % av dess pris räknas fullt, sedan sjunker poängen, så tillbehör och
// billigare kompletteringar kommer först.
const MAX_PRISKVOT = 1.5;
const FULLT_UPP_TILL = 0.6;
// Mönstrets plats i regeln: det första är det självklara.
const PLATSVIKT = [1, 0.85, 0.7, 0.55];

function prisfaktor(forslag: number, vara: number): number {
  if (!forslag || !vara || forslag <= 0 || vara <= 0) return 1;
  const kvot = forslag / vara;
  if (kvot > MAX_PRISKVOT) return 0;
  return kvot <= FULLT_UPP_TILL ? 1 : 1 / (1 + (kvot - FULLT_UPP_TILL) * 1.5);
}

/** Det varukorgens förslag läser ur en vara. En hel Product passar, och så gör
 *  det smala underlaget som förslagsrutten cachar (lib/kundvagn-underlag.ts). */
export type ForslagsVara = Pick<Product, "id" | "slug" | "name" | "priceNum" | "inStock" | "img"> & {
  popularity?: number;
  imageScore?: number;
};

// Alla regler i två uttryck: en vara som någon regel gäller för, och en sort
// som någon regel föreslår.
const NAGON_VARA = new RegExp(KOMPLEMENT.map((r) => `(?:${r.vara.source})`).join("|"), "iu");
const NAGOT_FORSLAG = new RegExp(KOMPLEMENT.flatMap((r) => r.passar).map((re) => `(?:${re.source})`).join("|"), "iu");

/** En vara som kan föreslås: i lager, med bild och av en sort som någon regel föreslår. */
function kanForeslas(x: ForslagsVara): boolean {
  return x.inStock && !!x.img && NAGOT_FORSLAG.test(huvud(x.name));
}

/**
 * Det förslagen behöver ur katalogen: varorna som en regel gäller för och
 * varorna som kan föreslås, ungefär hälften av katalogen. Förslagsrutten
 * cachar den här listan (lib/kundvagn-underlag.ts), och kundvagnsForslag ger
 * samma svar ur den som ur hela katalogen.
 */
export function forslagsUnderlag<T extends ForslagsVara>(all: T[]): T[] {
  return all.filter((x) => NAGON_VARA.test(huvud(x.name)) || kanForeslas(x));
}

/**
 * Upp till `limit` varor som kompletterar varukorgen, bäst först.
 *   • bara varor i lager med bild, aldrig något som redan ligger i varukorgen,
 *   • bara sorters varor som KOMPLEMENT kopplar till en vara i varukorgen, och
 *     inget den varan redan har med sig ("med fotpall", "med två stolar"),
 *   • aldrig samma sorts vara som varan själv (det vore ett alternativ, inte en
 *     komplettering),
 *   • aldrig ett annat djurslag än varan det kompletterar,
 *   • högst 1,5 gånger varans pris, billigare först, försäljningen som
 *     skiljelinje.
 * Första varvet tar en vara per sort och delar platserna mellan de varor i
 * varukorgen som har en regel. Blir platser över fylls de i ett andra varv.
 * Två förslag som liknar varandra för mycket (tre klaffbord) visas aldrig
 * samtidigt.
 *
 * Svaret blir detsamma ur hela katalogen och ur forslagsUnderlag. Likheten
 * mellan förslagen och försäljningens skala räknas bland varorna som kan
 * föreslås, och en vara utan regel tar ingen plats.
 */
export function kundvagnsForslag<T extends ForslagsVara>(varukorgensId: string[], all: T[], limit = 3): T[] {
  if (limit <= 0) return [];
  const ids = new Set(varukorgensId);
  // Per vara i varukorgen: vilka sorter som passar (med vikt), och vilka
  // mönster som beskriver varan själv.
  const regler = all
    .filter((p) => ids.has(p.id))
    .map((a) => {
      const h = huvud(a.name);
      const passar: Array<{ re: RegExp; vikt: number }> = [];
      const egen: RegExp[] = [];
      for (const r of KOMPLEMENT) {
        if (!r.vara.test(h)) continue;
        egen.push(r.vara);
        r.passar.forEach((re, i) => {
          if (!re.test(a.name)) passar.push({ re, vikt: PLATSVIKT[Math.min(i, PLATSVIKT.length - 1)] });
        });
      }
      return { a, passar, egen, djur: djurslag(a.name) };
    })
    .filter((r) => r.passar.length > 0);
  if (!regler.length) return [];

  const korpus = all.filter(kanForeslas);
  const d = likhetsdata(korpus);
  let maxPop = 1;
  for (const x of korpus) if ((x.popularity || 0) > maxPop) maxPop = x.popularity || 0;

  type Kandidat = { x: T; ankare: number; sort: RegExp; poang: number };
  const kandidater: Kandidat[] = [];
  const sedda = new Set<string>();
  for (const x of korpus) {
    if (ids.has(x.id) || sedda.has(x.slug)) continue;
    sedda.add(x.slug);
    const h = huvud(x.name);
    const xDjur = djurslag(x.name);
    const boost = 1 + 0.5 * ((x.popularity || 0) / maxPop) + 0.05 * ((x.imageScore || 0) / 100);
    let bast: Kandidat | null = null;
    for (let i = 0; i < regler.length; i++) {
      const r = regler[i];
      if (r.egen.some((re) => re.test(h)) || djurslagKrockar(r.djur, xDjur)) continue;
      for (const { re, vikt } of r.passar) {
        if (!re.test(h)) continue;
        const poang = vikt * prisfaktor(x.priceNum, r.a.priceNum) * boost;
        if (poang > 0 && (!bast || poang > bast.poang)) bast = { x, ankare: i, sort: re, poang };
      }
    }
    if (bast) kandidater.push(bast);
  }
  kandidater.sort((a, b) => b.poang - a.poang || a.x.slug.localeCompare(b.x.slug));

  const perAnkare = Math.max(1, Math.ceil(limit / regler.length));
  const antal = new Map<number, number>();
  const sorter = new Set<RegExp>();
  const valda: T[] = [];
  for (const forsta of [true, false]) {
    for (const k of kandidater) {
      if (valda.length >= limit) break;
      if (valda.includes(k.x)) continue;
      if (forsta && ((antal.get(k.ankare) ?? 0) >= perAnkare || sorter.has(k.sort))) continue;
      if (valda.some((v) => produktLikhet(v, k.x, d) >= VARIATION)) continue;
      valda.push(k.x);
      antal.set(k.ankare, (antal.get(k.ankare) ?? 0) + 1);
      sorter.add(k.sort);
    }
  }
  return valda;
}
