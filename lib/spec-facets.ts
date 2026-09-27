// lib/spec-facets.ts
//
// Produktens mått och egenskaper som filter: bredd, djup, höjd, sitthöjd,
// maxlast, vikt, effekt, volym, ålder och material, och sedan 2026-09-27 även
// klädsel, djur, bränsle, form, placering, antal (lådor,
// sittplatser, våningar, sängbredd) och egenskaper (hjul, höj- och sänkbar,
// vattenavvisande, UV-skydd, LED, batteri, solcell, fjärrkontroll, timer).
//
// VARFÖR DEN FINNS (Leonard 2026-09-27: "alla kategorier borde ha relevanta
// filter"). Listsidorna kunde bara filtrera på pris, färg, lager och rea. Men
// den som letar en fåtölj vill ha rätt sitthöjd, den som letar en hylla rätt
// bredd, och den som letar en vattenkokare rätt volym.
//
// VARIFRÅN VÄRDENA KOMMER. Wix har inga strukturerade fält för detta. Värdena
// står i produktbeskrivningen, som spec-rader ("Mått: 82 × 35 × 76 cm",
// "Maxlast: 30 kg") eller som tabellrader. Poleringen skriver dem i ett fast
// format, se docs/seo-polish-runbook.md. Uppmätt på hela katalogen 2026-09-27
// (3 783 produkter): material 82 %, vikt 61 %, mått 60 %, maxlast 42 %. Effekt,
// volym och ålder finns där de hör hemma (kök 28 % och 56 %, barn 50 %).
//
// TOLKNINGEN ÄR HELLRE TOM ÄN FEL. Ett värde som inte går att läsa entydigt
// lämnas bort. En produkt utan värde försvinner bara ur listan när just det
// filtret används, medan ett fel värde hade fått den att dyka upp på fel ställe.
//   · Kartongens mått ("Paketmått") läses aldrig som produktens.
//   · "82 × 35 × 76 cm" utan förklaring är bredd × djup × höjd, butikens
//     standardordning. Står axlarna utskrivna ("(B × D × H)", "(bredd × djup ×
//     höjd)", "600L × 300B × 197H") följs de.
//   · Två tal utan förklaring ("60 × 180 cm") är tvetydiga: spegel, matta
//     eller växthus. Då sparas bara det första, som bredd.
//   · Justerbar höjd ("73–89 cm") sparas som ett intervall. Stolen passar då
//     både den som vill ha 75 och den som vill ha 85.
//
// Ren modul utan importer: node --test kör den direkt, och samma funktioner
// räknar på servern (lib/list-pages.ts) och i webbläsaren (ShopBrowser).

/** Ett mått: ett värde, eller ett intervall för något som går att ställa in. */
export type Varde = number | [number, number];

/**
 * Det som skickas per produkt. Korta nycklar med flit: fältet följer med
 * varje produkt i kategorilistorna.
 */
export type Spec = {
  /** Bredd (första horisontella måttet), cm. */
  b?: Varde;
  /** Djup, cm. */
  d?: Varde;
  /** Höjd, cm. */
  h?: Varde;
  /** Sitthöjd, cm. */
  sh?: Varde;
  /** Maxlast, kg. */
  ml?: number;
  /** Produktens vikt, kg. */
  kg?: number;
  /** Effekt, W. */
  w?: number;
  /** Volym, liter. */
  l?: number;
  /** Rekommenderad ålder i år, [från, till]. 99 = ingen övre gräns. */
  a?: [number, number];
  /** Materialkoder, en bokstav per material (se MATERIAL). */
  m?: string;
  /** Antal lådor. */
  ld?: Varde;
  /** Sittplatser ("för sex till åtta" = [6, 8]). */
  sp?: Varde;
  /** Våningar eller hyllplan. */
  vn?: Varde;
  /** Sängens (madrassens) bredd, cm: 90, 140, 180 … */
  sb?: number;
  /** Klädsel, djur, bränsle, form, placering, egenskaper: en bokstav per val
   *  (se VAL). */
  ky?: string;
  dj?: string;
  br?: string;
  fo?: string;
  pl?: string;
  eg?: string;
};

export type IntervallNyckel = "b" | "d" | "h" | "sh" | "ml" | "kg" | "w" | "l" | "a";
/** Antal: små heltal som väljs som knappar ("4 lådor"), inte med reglage. */
export type AntalNyckel = "ld" | "sp" | "vn" | "sb";
/** Egenskaper som bokstavskoder: material, klädsel, djur … */
export type KodNyckel = "m" | "ky" | "dj" | "br" | "fo" | "pl" | "eg";
/** Allt som väljs med knappar. */
export type ValNyckel = KodNyckel | AntalNyckel;
export type Nyckel = IntervallNyckel | ValNyckel;

const ANTAL_NYCKLAR: readonly string[] = ["ld", "sp", "vn", "sb"];
export const arAntal = (k: Nyckel): k is AntalNyckel => ANTAL_NYCKLAR.includes(k);
export const arIntervall = (k: Nyckel): k is IntervallNyckel => !arAntal(k) && !(k in VAL);

/** Filtrens standardnamn och enhet. Kategorin kan döpa om (lib/spec-config.ts). */
export const FACETTER: Record<Nyckel, { namn: string; enhet: string; param: string }> = {
  b: { namn: "Bredd", enhet: "cm", param: "bredd" },
  d: { namn: "Djup", enhet: "cm", param: "djup" },
  h: { namn: "Höjd", enhet: "cm", param: "hojd" },
  sh: { namn: "Sitthöjd", enhet: "cm", param: "sitthojd" },
  ml: { namn: "Maxlast", enhet: "kg", param: "maxlast" },
  kg: { namn: "Vikt", enhet: "kg", param: "vikt" },
  w: { namn: "Effekt", enhet: "W", param: "effekt" },
  l: { namn: "Volym", enhet: "liter", param: "volym" },
  a: { namn: "Ålder", enhet: "år", param: "alder" },
  m: { namn: "Material", enhet: "", param: "material" },
  ky: { namn: "Klädsel", enhet: "", param: "kladsel" },
  dj: { namn: "Djur", enhet: "", param: "djur" },
  br: { namn: "Bränsle", enhet: "", param: "bransle" },
  fo: { namn: "Form", enhet: "", param: "form" },
  pl: { namn: "Placering", enhet: "", param: "placering" },
  eg: { namn: "Egenskaper", enhet: "", param: "egenskaper" },
  ld: { namn: "Lådor", enhet: "", param: "lador" },
  sp: { namn: "Sittplatser", enhet: "", param: "sittplatser" },
  vn: { namn: "Våningar", enhet: "", param: "vaningar" },
  sb: { namn: "Sängbredd", enhet: "cm", param: "sangbredd" },
};

/** Ingen bokstav eller siffra (även å, ä, ö, é) före respektive efter. */
const FORE = String.raw`(?<![\p{L}\p{N}_])`;
const EFTER = String.raw`(?![\p{L}\p{N}_])`;

/**
 * Ett mönster där \b räknar å, ä, ö och é som bokstäver. JavaScripts egen \b
 * gör inte det, så /\bträ\b/ hittade aldrig "Material: trä" och /\båtta/
 * aldrig "åtta lådor". Ett \b före ett ord blir "ingen bokstav före", ett
 * efter "ingen bokstav efter": en kontroll i stället för två.
 */
function sv(re: RegExp): RegExp {
  // Följs \b av något som börjar ett ord (en bokstav, en siffra, en grupp
  // eller en klass) står det först; annars sist.
  const kalla = re.source.replace(/\\b(?=([\s\S]{0,3}))/g, (_, efter: string) =>
    /^(?:[\p{L}\p{N}[]|\\[dw]|\((?!\?[=!<]))/u.test(efter) ? FORE : EFTER);
  return new RegExp(kalla, re.flags.includes("u") ? re.flags : re.flags + "u");
}

/**
 * Materialklasserna, med de ord i beskrivningen som räknas till dem. En
 * produkt kan höra till flera ("stål och MDF" = metall och trä).
 */
export const MATERIAL: { kod: string; namn: string; slug: string; ord: RegExp }[] = [
  { kod: "t", namn: "Trä", slug: "tra", ord: sv(/\b(trä(?!ning|dgård)[a-zåäöé]*|massivt? trä|ek|furu|bambu|mdf|spånskiva|akacia|gran|plywood|teak|valnöt|björk|bok|paulownia|trälook)\b/) },
  { kod: "m", namn: "Metall", slug: "metall", ord: sv(/\b(stål|rostfritt|metall|järn|gjutjärn|aluminium|alu|krom|förzinkad|galvaniserad|galvad|mässing)\b/) },
  { kod: "p", namn: "Plast", slug: "plast", ord: sv(/\b(plast|pp|pe|hdpe|abs|polypropen|polyeten|pvc|akryl|polykarbonat|nylon|eva)\b/) },
  { kod: "y", namn: "Tyg", slug: "tyg", ord: sv(/\b(tyg(?:et)?|polyester|sammet|linne|bomull|textil|oxford|velour|chenille|teddy|bouclé|mikrofiber|filt|mesh|nät)\b/) },
  { kod: "k", namn: "Konstläder", slug: "konstlader", ord: sv(/\b(konstläder|pu-läder|pu läder|läderlook|läder)\b/) },
  { kod: "r", namn: "Rotting", slug: "rotting", ord: sv(/\b(rotting|konstrotting|polyrotting|rattan|korgflätad)\b/) },
  { kod: "g", namn: "Glas", slug: "glas", ord: sv(/\b(glas|härdat glas)\b/) },
  { kod: "s", namn: "Sten & keramik", slug: "sten", ord: sv(/\b(keramik|porslin|marmor|sten|betong|terrakotta)\b/) },
];

/** Ett val i en knappgrupp. `ord` är de ord i texten som räknas till det. */
export type Kod = { kod: string; namn: string; slug: string; ord?: RegExp };

/**
 * Knappgrupperna med bokstavskoder. Orden läses i gemener, utom LED som bara
 * räknas med versaler ("led" är också en led i ett armstöd).
 */
export const VAL: Record<KodNyckel, Kod[]> = {
  m: MATERIAL,
  ky: [
    { kod: "s", namn: "Sammet", slug: "sammet", ord: sv(/sammet|velour|velvet/) },
    { kod: "m", namn: "Manchester", slug: "manchester", ord: sv(/manchester/) },
    { kod: "b", namn: "Bouclé & teddy", slug: "boucle", ord: sv(/bouclé|boucle|teddy/) },
    { kod: "c", namn: "Chenille", slug: "chenille", ord: sv(/chenille/) },
    { kod: "l", namn: "Linne", slug: "linne", ord: sv(/\blinne|linnelook|linnetyg/) },
    { kod: "k", namn: "Konstläder", slug: "konstlader", ord: sv(/konstläder|pu-läder|pu läder|läderlook/) },
    { kod: "n", namn: "Nätväv", slug: "natvav", ord: sv(/\bmesh|nätrygg|nätväv|nättyg|nätsits/) },
  ],
  dj: [
    { kod: "h", namn: "Hund", slug: "hund", ord: sv(/\bhund|\bvalp/) },
    { kod: "k", namn: "Katt", slug: "katt", ord: sv(/\bkatt|klös(?:träd|tunna|pelare|torn|möbel|bräda|matta|stolpe)/) },
    { kod: "g", namn: "Kanin & gnagare", slug: "kanin-gnagare", ord: sv(/kanin|marsvin|hamster|gnagar|smådjur|chinchilla|\bdegu|\bråttor?\b|\bmöss\b|\biller/) },
    { kod: "o", namn: "Höns & ankor", slug: "hons", ord: sv(/\bhöns|\bkyckling|\bvaktel|\bank(?:a|or|hus)\b/) },
    { kod: "f", namn: "Fågel", slug: "fagel", ord: sv(/\bfågel|\bfåglar|papegoj|undulat|kanariefågel/) },
    { kod: "a", namn: "Fisk", slug: "fisk", ord: sv(/akvari|\bfisk/) },
    { kod: "r", namn: "Reptil & sköldpadda", slug: "reptil", ord: sv(/terrari|reptil|sköldpadd|\bödl/) },
  ],
  br: [
    { kod: "k", namn: "Kol", slug: "kol", ord: sv(/\bkol\b|kolgrill|träkol|grillkol|brikett/) },
    { kod: "v", namn: "Ved", slug: "ved", ord: sv(/\bved\b|\bveden\b|vedeldad|vedugn|vedspis/) },
    { kod: "g", namn: "Gasol", slug: "gasol", ord: sv(/gasol|gasgrill|\bgas\b|propan|butan/) },
    { kod: "e", namn: "El", slug: "el", ord: sv(/elgrill|\belektrisk|eldriven|\b230 ?v\b|infravärm/) },
    { kod: "p", namn: "Pellets", slug: "pellets", ord: sv(/pellets/) },
    { kod: "b", namn: "Bioetanol", slug: "bioetanol", ord: sv(/etanol/) },
  ],
  fo: [
    { kod: "r", namn: "Rund", slug: "rund" },
    { kod: "o", namn: "Oval", slug: "oval" },
    { kod: "k", namn: "Kvadratisk", slug: "kvadratisk" },
    { kod: "e", namn: "Rektangulär", slug: "rektangular" },
  ],
  pl: [
    { kod: "v", namn: "Vägghängd", slug: "vagghangd", ord: sv(/vägghängd|väggmonter|väggfäst|vägghylla|väggskåp|väggspegel|väggmodell|väggkamin|väggvärmare|hängs på väggen|monteras på väggen|sätts upp på väggen|skruvas (?:fast )?(?:upp )?i väggen/) },
    { kod: "f", namn: "Fristående", slug: "fristaende", ord: sv(/fristående|golvstående|golvmodell|står på golvet|golvspegel|stående spegel|står fritt|står på egna ben/) },
  ],
  eg: [
    { kod: "h", namn: "Med hjul", slug: "hjul", ord: sv(/\b(?:på|med) (?:[a-zåäö-]+ ){0,2}hjul\b|\b(?:två|tre|fyra|fem|sex|åtta|\d+) (?:[a-zåäö]+[- ])?hjul\b|\brullar på\b|\blåsbara hjul|\bhjulen\b|\brullvagn|\brullbord/) },
    { kod: "j", namn: "Höj- och sänkbar", slug: "hoj-sankbar", ord: sv(/höj- och sänkbar|höj och sänkbar|höjdjusterbar|justerbar höjd|ställbar höjd|höjdinställbar/) },
    { kod: "v", namn: "Vattenavvisande", slug: "vattenavvisande", ord: sv(/vattentät|vattenavvisande|regntät|tål regn|\bipx[4-8]\b|\bip[4-6][4-8]\b/) },
    { kod: "u", namn: "UV-skydd", slug: "uv-skydd", ord: sv(/\buv[- ]?(?:skydd|beständig|behandl|tålig|resistent|stabil|50)|\bupf ?\d|skyddar mot uv/) },
    { kod: "l", namn: "LED", slug: "led", ord: sv(/\bLED\b/) },
    { kod: "b", namn: "Batteridriven", slug: "batteri", ord: sv(/batteridriv|batterier\b|\bbatteri\b|uppladdningsbar|laddningsbar|litiumbatteri|batteritid|batterifack|sladdlös|\b(?:aa|aaa)-batteri/) },
    { kod: "s", namn: "Solcell", slug: "solcell", ord: sv(/solcell|soldriv|solpanel/) },
    { kod: "f", namn: "Fjärrkontroll", slug: "fjarrkontroll", ord: sv(/fjärrkontroll/) },
    { kod: "t", namn: "Timer", slug: "timer", ord: sv(/\btimer|timmarstimer|tidur/) },
  ],
};


// ── Beskrivningen som nyckel/värde ──────────────────────────────────────────

const ENTITETER: Record<string, string> = {
  amp: "&", nbsp: " ", lt: "<", gt: ">", quot: '"', apos: "'", times: "×",
  ndash: "–", mdash: "—", ouml: "ö", auml: "ä", aring: "å", Ouml: "Ö", Auml: "Ä", Aring: "Å", deg: "°", oslash: "ø", Oslash: "Ø",
};

function avkoda(s: string): string {
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (hel, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : hel;
    }
    return ENTITETER[e] ?? hel;
  });
}

const utanTaggar = (s: string) => avkoda(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/**
 * Beskrivningens spec-rader som nyckel → värde, nycklar i gemener. Tabellrader
 * (`<td>Mått</td><td>…</td>`) och textrader (`Mått: …`) läses båda; första
 * förekomsten vinner.
 */
export function specRader(html: string): Map<string, string> {
  const rader = new Map<string, string>();
  const satt = (k: string, v: string) => {
    const nyckel = k.trim().replace(/:$/, "").trim().toLowerCase();
    const varde = v.trim();
    if (nyckel && varde && nyckel.length <= 40 && !rader.has(nyckel)) rader.set(nyckel, varde);
  };
  for (const [, k, v] of html.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    satt(utanTaggar(k), utanTaggar(v));
  }
  const text = avkoda(
    html
      .replace(/<(br|\/p|\/li|\/div|\/h\d|\/tr)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
  for (const rad of text.split("\n")) {
    const m = /^\s*[•·\-–]?\s*([A-ZÅÄÖ][\wåäöÅÄÖ .()/-]{1,38}?)\s*:\s*(\S.*)$/.exec(rad);
    if (m) satt(m[1], m[2]);
  }
  return rader;
}

// ── Tal och mått ────────────────────────────────────────────────────────────

const TAL = String.raw`\d+(?:[.,]\d+)?`;
const tal = (s: string) => Number(s.replace(",", "."));
const ENHET: Record<string, number> = { mm: 0.1, cm: 1, m: 100 };

/** "73–89" → [73, 89], "45" → 45. */
function lasVarde(s: string, faktor: number): Varde | null {
  const m = new RegExp(`^(${TAL})(?:\\s*[–-]\\s*(${TAL}))?$`).exec(s.trim());
  if (!m) return null;
  const lo = tal(m[1]) * faktor;
  const hi = m[2] ? tal(m[2]) * faktor : lo;
  if (!(lo > 0) || !(hi >= lo)) return null;
  return hi === lo ? runda(lo) : [runda(lo), runda(hi)];
}

const runda = (n: number) => Math.round(n * 10) / 10;

/** Ett mått rimligt för en vara i butiken, i cm. */
const rimligtMatt = (v: Varde) => (Array.isArray(v) ? v : [v]).every((x) => x >= 0.5 && x <= 3000);

type Axel = "b" | "d" | "h" | "o";

/** En axelbokstav eller ett axelord → axel. L (längd) är det första
 *  horisontella måttet, alltså butikens "bredd". */
function axelAv(ord: string): Axel | null {
  const o = ord.toLowerCase().replace(/\./g, "");
  if (o === "b" || o === "bredd" || o === "w") return "b";
  if (o === "l" || o === "längd") return "b";
  if (o === "d" || o === "djup" || o === "t" || o === "djupet") return "d";
  if (o === "h" || o === "höjd") return "h";
  if (o === "ø" || o === "diameter" || o === "dia") return "o";
  return null;
}

type Matt = Partial<Record<"b" | "d" | "h", Varde>>;

/**
 * Ett måttvärde → bredd, djup, höjd. Läser bara den FÖRSTA måttgruppen i
 * värdet ("Ø38 × 90 cm, Ø43 × 120 cm" är tre storlekar i ett set).
 */
export function lasMatt(varde: string): Matt | null {
  // "L245 x B200 x H198 cm" → "245L × 200B × 198H cm": bokstaven efter talet,
  // och × mellan måtten oavsett om de skrivs x, X eller *.
  const s = varde
    .replace(/(^|[\s(×xX*])([LBDHT])\s?(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?)(?=\s*(?:[xX×*]|cm|mm|m\b))/g, "$1$3$2")
    .replace(/([\dLBDHTlbdht])\s*[xX*]\s*(?=[\dØø])/g, "$1 × ")
    .replace(/\s+/g, " ");
  const grupp = new RegExp(
    String.raw`((?:[Øø]\s*)?${TAL}(?:\s*[–-]\s*${TAL})?\s*(?:[LBDHTlbdht]\b)?(?:\s*(?:mm|cm|m)\b)?(?:\s*×\s*(?:[Øø]\s*)?${TAL}(?:\s*[–-]\s*${TAL})?\s*(?:[LBDHTlbdht]\b)?(?:\s*(?:mm|cm|m)\b)?){0,2})\s*(mm|cm|m)\b(\s*\([^)]*\))?`,
  ).exec(s);
  if (!grupp) return null;
  const faktor = ENHET[grupp[2]];
  const delar = grupp[1].split("×").map((d) => d.trim());
  const legend = grupp[3]
    ? grupp[3].replace(/[()]/g, "").split(/\s*[×x]\s*/).map((w) => axelAv(w.trim()))
    : null;

  const varden: { v: Varde; axel: Axel | null }[] = [];
  for (const del of delar) {
    const m = new RegExp(String.raw`^([Øø])?\s*(${TAL}(?:\s*[–-]\s*${TAL})?)\s*([LBDHTlbdht])?\s*(?:mm|cm|m)?$`).exec(del);
    if (!m) return null;
    const v = lasVarde(m[2], faktor);
    if (v === null || !rimligtMatt(v)) return null;
    varden.push({ v, axel: m[1] ? "o" : m[3] ? axelAv(m[3]) : null });
  }

  // Står det flera mått i värdet men bara ett gick att läsa är det bättre att
  // inte gissa än att kalla ett av dem bredd.
  if (varden.length < 2 && /\d[^\d×xX*]{0,12}[x×*][^\d]{0,12}\d/.test(varde)) return null;

  const ut: Matt = {};
  const lagg = (axel: Axel, v: Varde) => {
    if (axel === "o") {
      if (ut.b === undefined) ut.b = v;
      if (ut.d === undefined) ut.d = v;
    } else if (ut[axel] === undefined) ut[axel] = v;
  };

  const harBokstav = varden.some((x) => x.axel && x.axel !== "o");
  if (harBokstav) {
    // "600L × 300B × 197H": står både L och B är B det andra horisontella måttet.
    const harL = /\d\s*L\b/i.test(grupp[1]);
    varden.forEach((x, i) => {
      const bokstav = /([LBDHTlbdht])\s*(?:mm|cm|m)?$/.exec(delar[i])?.[1]?.toUpperCase();
      if (bokstav === "B" && harL) lagg("d", x.v);
      else if (x.axel) lagg(x.axel, x.v);
    });
  } else if (legend && legend.length === varden.length && legend.every((a) => a)) {
    const harL = /\b(l|längd)\b/i.test(grupp[3] ?? "");
    varden.forEach((x, i) => {
      const ord = grupp[3]!.replace(/[()]/g, "").split(/\s*[×x]\s*/)[i].trim().toLowerCase();
      if ((ord === "b" || ord === "bredd") && harL) lagg("d", x.v);
      else lagg(legend[i]!, x.v);
    });
  } else if (varden.length === 3) {
    lagg("b", varden[0].v);
    lagg("d", varden[1].v);
    lagg("h", varden[2].v);
  } else if (varden.length === 2 && varden[0].axel === "o") {
    lagg("o", varden[0].v);
    lagg("h", varden[1].v);
  } else if (varden[0].axel === "o") {
    lagg("o", varden[0].v);
  } else {
    // Två (eller ett) tal utan förklaring: bara det första är säkert.
    lagg("b", varden[0].v);
  }
  return Object.keys(ut).length ? ut : null;
}

/** "45 cm", "45–55 cm", "0,5 m" → cm. */
function lasCm(s: string | undefined): Varde | null {
  if (!s) return null;
  const m = new RegExp(`(${TAL}(?:\\s*[–-]\\s*${TAL})?)\\s*(mm|cm|m)\\b`).exec(s);
  if (!m) return null;
  const v = lasVarde(m[1], ENHET[m[2]]);
  return v !== null && rimligtMatt(v) ? v : null;
}

/** Första "N kg" (eller "N g") i värdet, i kg. */
function lasKg(s: string | undefined): number | null {
  if (!s) return null;
  const m = new RegExp(`(${TAL})\\s*(kg|g)\\b`).exec(s);
  if (!m) return null;
  const v = tal(m[1]) * (m[2] === "g" ? 0.001 : 1);
  return v > 0 && v < 10000 ? runda(v) : null;
}

function lasEffekt(s: string): number | null {
  const m = new RegExp(`(${TAL})\\s*(kW|W)\\b(?!h)`).exec(s);
  if (!m) return null;
  const v = tal(m[1]) * (m[2] === "kW" ? 1000 : 1);
  return v > 0 && v < 100000 ? Math.round(v) : null;
}

function lasVolym(s: string, versalL: boolean): number | null {
  // Versalt L bara i namnet (där "5 L" betyder liter). "200L × 75B" är en
  // längd, därför aldrig L som följs av ett ×.
  const m = new RegExp(`(${TAL})\\s*(liter|L${versalL ? "" : "|l"})\\b(?!\\s*[×x])`).exec(s);
  if (!m) return null;
  const v = tal(m[1]);
  return v > 0 && v < 100000 ? runda(v) : null;
}

/** "3–8 år", "12–60 månader", "från 3 år", "3+ år" → [från, till] i år. */
export function lasAlder(s: string | undefined): [number, number] | null {
  if (!s) return null;
  const t = s.toLowerCase();
  const spann = /(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)\s*(år|månader|mån)\b/.exec(t);
  if (spann) {
    const f = spann[3] === "år" ? 1 : 1 / 12;
    const lo = runda(tal(spann[1]) * f);
    const hi = runda(tal(spann[2]) * f);
    return hi > lo && hi <= 99 ? [lo, hi] : null;
  }
  const fran = /(?:från\s*)?(\d+(?:[.,]\d+)?)\s*(?:\+|år\s*(?:och\s*uppåt|\+))|från\s*(\d+(?:[.,]\d+)?)\s*(år|månader|mån)\b/.exec(t);
  if (fran) {
    const lo = fran[1] !== undefined ? tal(fran[1]) : tal(fran[2]) * (fran[3] === "år" ? 1 : 1 / 12);
    return lo >= 0 && lo < 99 ? [runda(lo), 99] : null;
  }
  return null;
}

/** Rader som beskriver en del av varan eller förpackningen, aldrig helheten. */
const DELAR = /paket|kartong|förpackning|fotpall|pall\b|sits|rygg|stoppning|dyna|kudde|låda|hylla|skiva|ben\b|armstöd|fack|dörr|lucka|spegel|madrass|sitthöjd|innermått|öppning|ingång/;

/** Varutyper där ett ensamt mått i produktnamnet är höjden. */
const HOJD_I_NAMNET = /^(?:konstgjord\s+|smal\s+)?(?:tall|gran|julgran|klösträd|klöstunna|klöspelare|golvlampa|konstgjord växt|palm)/i;

/** "sitthöjd 50 cm", "sitthöjden är 45–52 cm" inne i en rad. */
const SITTHOJD = /sitthöjd(?:en)?\s*(?:är|på|:)?\s*(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*(?:mm|cm|m)\b)/i;

const MATT_NYCKLAR = ["mått", "yttermått", "totalmått", "produktmått", "mått (b × d × h)", "storlek", "dimensioner", "mått monterad", "monterad"];
const MAXLAST_NYCKLAR = ["maxlast", "bärighet", "bärförmåga", "maxbelastning", "max belastning", "max. belastning", "max vikt", "maxvikt", "belastning", "max användarvikt", "användarvikt"];
const MATERIAL_NYCKLAR = ["material", "stomme", "klädsel", "ram", "duk", "skiva", "överdrag", "tyg", "bordsskiva", "ben", "sits"];

/**
 * Produktens filtervärden ur namn och beskrivning. undefined när inget gick att
 * läsa — då skickas inget fält alls.
 */
export function lasSpec(namn: string, beskrivning: string): Spec | undefined {
  const rad = specRader(beskrivning || "");
  const spec: Spec = {};

  let matt: Matt | null = null;
  for (const k of MATT_NYCKLAR) {
    const v = rad.get(k);
    if (v && (matt = lasMatt(v))) break;
  }
  // Rader som bär produktens eget namn i stället för "Mått" ("Fåtölj: 74 × 82 ×
  // 89 cm"). Delar och kartong räknas inte, och bara ett mått med tre tal duger.
  if (!matt) {
    for (const [k, v] of rad) {
      if (DELAR.test(k)) continue;
      const m = lasMatt(v);
      if (m && m.b !== undefined && m.d !== undefined && m.h !== undefined) { matt = m; break; }
    }
  }
  // Namnet bara när det bär minst två mått ("Kaninhus 122 × 93,5 cm"). Ett
  // ensamt tal där är för ofta en del av varan: "bred sits på 79 cm".
  if (!matt && /\d\s*[×xX]\s*[\dØø]/.test(namn)) matt = lasMatt(namn);
  // Varor där ett ensamt mått i namnet alltid är höjden: "Julgran 183 cm",
  // "Klösträd 240–260 cm". Diametern står då i löptexten ("110 cm diameter").
  if (!matt && HOJD_I_NAMNET.test(namn)) {
    const h = lasCm(/(\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*cm)\b/.exec(namn)?.[1]);
    if (h) {
      matt = { h };
      const text = beskrivning.replace(/<[^>]+>/g, " ");
      const dia = lasCm(/(\d+(?:[.,]\d+)?\s*cm)\s*(?:i\s*)?diameter/i.exec(text)?.[1] ?? /diameter\s*(?:på\s*)?(\d+(?:[.,]\d+)?\s*cm)/i.exec(text)?.[1]);
      if (dia) { matt.b = dia; matt.d = dia; }
    }
  }
  const b = matt?.b ?? lasCm(rad.get("bredd")) ?? lasCm(rad.get("längd"));
  const d = matt?.d ?? lasCm(rad.get("djup"));
  const h = matt?.h ?? lasCm(rad.get("höjd")) ?? lasCm(rad.get("total höjd"));
  if (b) spec.b = b;
  if (d) spec.d = d;
  if (h) spec.h = h;
  const sh = lasCm(rad.get("sitthöjd")) ?? lasCm(SITTHOJD.exec([...rad.values()].join(" \n "))?.[1]);
  if (sh) spec.sh = sh;

  for (const k of MAXLAST_NYCKLAR) {
    const v = lasKg(rad.get(k));
    if (v) { spec.ml = v; break; }
  }
  const kg = lasKg(rad.get("vikt") ?? rad.get("nettovikt") ?? rad.get("produktvikt"));
  if (kg) spec.kg = kg;

  const w = lasEffekt(rad.get("effekt") ?? rad.get("total effekt") ?? rad.get("märkeffekt") ?? "") ?? lasEffekt(namn);
  if (w) spec.w = w;
  const l = lasVolym(rad.get("volym") ?? rad.get("kapacitet") ?? rad.get("tankvolym") ?? "", false) ?? lasVolym(namn, true);
  if (l) spec.l = l;

  const a = lasAlder(rad.get("rekommenderad ålder") ?? rad.get("ålder") ?? rad.get("ålder från")) ?? lasAlder(/\d+\s*[–-]\s*\d+\s*(?:år|månader)/.exec(namn)?.[0]);
  if (a) spec.a = a;

  const materialText = MATERIAL_NYCKLAR.map((k) => rad.get(k) ?? "").join(" ").toLowerCase();
  if (materialText.trim()) {
    const koder = MATERIAL.filter((m) => m.ord.test(materialText)).map((m) => m.kod).join("");
    if (koder) spec.m = koder;
  }

  const mattRad = MATT_NYCKLAR.map((k) => rad.get(k) ?? "").join(" ");
  lasEgenskaper(namn, beskrivning || "", rad, spec, mattRad);

  return Object.keys(spec).length ? spec : undefined;
}

// ── Egenskaper ur texten ────────────────────────────────────────────────────
//
// Klädsel, djur, bränsle, form, placering, antal och egenskaper står sällan som
// spec-rader. De läses ur produktens EGEN text: namnet, spec-raderna och
// beskrivningens avsnitt om produkten. Aldrig ur "Vanliga frågor", "Passar
// inte den här?", "Fler …" eller länkar, som ofta handlar om en annan produkt
// ("Har du ett höj- och sänkbart bord …", "takspänt klösträd i grått").
//
// En träff med "inte", "utan", "ej" … strax före räknas inte: "Fast underrede,
// inte hjul", "utan batteri".

/** Avsnitt som handlar om annat än produkten själv. */
const ANDRAS_AVSNITT = /vanliga frågor|passar inte|^fler\b|andra utföranden|andra storlekar|liknande|jämför|^se även|^mer (?:från|i)\b/i;

/**
 * Produktens egen text som satser, med originalets versaler: ingressen,
 * punktlistorna och rubrikerna. Brödtexten i övrigt räknas
 * inte, för där jämförs det ofta med annat ("motpolen till våra höj- och
 * sänkbara bord", "då ska du välja en höj- och sänkbar i stället").
 */
export function egenText(html: string, forsta = ingress(html)): string[] {
  const egen = egenHtml(html);
  // Punkterna och rubrikerna, en per rad.
  const bitar = [...egen.matchAll(/<(li|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]).join("\n");
  const text = forsta + "\n" + avkoda(bitar.replace(/<[^>]+>/g, " "));
  return text
    .split(/[.!?;]+(?=\s|$)|\n+/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Beskrivningen utan länkar och utan avsnitten om annat än produkten
 * ("Vanliga frågor", "Fler …"), som klipps från sin rubrik fram till nästa.
 */
function egenHtml(html: string): string {
  const utanLankar = (html || "").replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " ");
  let egen = "";
  let fran = 0;
  let hoppa = false;
  for (const m of utanLankar.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)) {
    if (!hoppa) egen += utanLankar.slice(fran, m.index);
    hoppa = ANDRAS_AVSNITT.test(utanTaggar(m[1]));
    fran = m.index ?? 0;
  }
  if (!hoppa) egen += utanLankar.slice(fran);
  return egen;
}

/** Beskrivningens första stycke: produkten med egna ord. */
function ingress(html: string): string {
  for (const [, inre] of (html || "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = utanTaggar(inre);
    if (t.length >= 40) return t;
  }
  return "";
}

/** Nekande ord strax före träffen, inom samma sats och efter sista kommat. */
const NEKAT = sv(/\b(?:inte|utan|ej|ingen|inga|inget|saknar|varken|har du|om du har|till ditt|jämfört med|i stället för|våra|välj|välja|väljer)\b/i);
const I_STALLET = sv(/^[^,.!?;\n]{0,20}\bi stället\b/i);
function nekad(text: string, index: number, slut = index): boolean {
  const fore = text.slice(Math.max(0, index - 30), index);
  const grans = Math.max(fore.lastIndexOf(","), fore.lastIndexOf("\n"), fore.lastIndexOf("."), fore.lastIndexOf(";"));
  if (NEKAT.test(grans >= 0 ? fore.slice(grans + 1) : fore)) return true;
  // "… en höj- och sänkbar i stället": ett råd om en annan vara.
  return I_STALLET.test(text.slice(slut));
}

/** "Nyckel: värde" där värdet säger nej ("inget", "nej", "saknas"). */
const NEJ_RAD = sv(/^[^:]{1,40}:\s*(?:.*\b(?:inget|ingen|inga|utan|kräver inte|behöver inte|saknas)\b|nej\b)/i);

const GLOBALA = new Map<RegExp, RegExp>();
const globalt = (ord: RegExp) => {
  let re = GLOBALA.get(ord);
  if (!re) GLOBALA.set(ord, (re = new RegExp(ord.source, ord.flags.includes("g") ? ord.flags : ord.flags + "g")));
  return re;
};

/**
 * Träffarna i en text med en sats per rad, utan de nekade. Hela texten söks
 * på en gång i stället för sats för sats: det är samma svar och en bråkdel av
 * tiden, som räknas eftersom tolkningen körs på hela katalogen.
 */
function* traffar(text: string, ord: RegExp): Generator<{ index: number; slut: number; sats: string; iSatsen: number }> {
  for (const m of text.matchAll(globalt(ord))) {
    const index = m.index ?? 0;
    const slut = index + m[0].length;
    if (nekad(text, index, slut)) continue;
    const start = text.lastIndexOf("\n", index - 1) + 1;
    const stopp = text.indexOf("\n", slut);
    yield { index, slut, sats: text.slice(start, stopp < 0 ? undefined : stopp), iSatsen: index - start };
  }
}

/** Satserna på var sin rad: punkt, semikolon och radbrytning skiljer. */
const satsvis = (t: string) => t.replace(/[.!?;]+(?=\s|$)|\n+/g, "\n");

/** Koderna vars ord finns i texten (utan nekande ord före, inte i en nej-rad). */
function koderI(text: string, val: readonly Kod[]): string {
  const t = satsvis(text.toLowerCase());
  let ut = "";
  for (const v of val) {
    if (!v.ord) continue;
    for (const h of traffar(t, v.ord)) {
      if (NEJ_RAD.test(h.sats)) continue;
      ut += v.kod;
      break;
    }
  }
  return ut;
}

/** Den första källan som ger något vinner: namnet före raderna före ingressen. */
function forstaKoder(kallor: readonly string[], val: readonly Kod[]): string {
  for (const k of kallor) {
    const koder = k ? koderI(k, val) : "";
    if (koder) return koder;
  }
  return "";
}

const radText = (rad: Map<string, string>, nycklar: readonly string[]) =>
  nycklar.map((k) => rad.get(k) ?? "").filter(Boolean).join(". ");

const ORDTAL: Record<string, number> = { en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, tolv: 12 };
const TALORD = String.raw`(\d{1,2}|en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|tolv)`;
/** Två eller fler: "en … lådor" är aldrig ett antal ("en verktygsvagn med lådor"). */
const FLERA = String.raw`(\d{1,2}|två|tre|fyra|fem|sex|sju|åtta|nio|tio|tolv)`;
/** Upp till två beskrivande ord mellan talet och saken ("tre stora lådor"),
 *  men inte en ny fras ("två skåp och lådor"). */
const ADJ = String.raw`(?:(?!(?:med|och|i|på|för|som|till|eller|av|under|över)\b)[a-zåäö]+ ){0,2}`;
const tolkaTal = (s: string) => ORDTAL[s.toLowerCase()] ?? Number(s);
const SPANN = String.raw`(?:\s*(?:till|–|-)\s*${TALORD})?`;

/** Första antal (eller spann) som mönstret ger i någon källa, inom gränserna. */
function forstaAntal(kallor: readonly string[], monster: readonly RegExp[], lagst: number, hogst: number): Varde | null {
  for (const k of kallor) {
    if (!k) continue;
    const t = k.toLowerCase();
    for (const re of monster) {
      const m = re.exec(t);
      // "… där en tresitsare inte får plats": ett nej efter talet.
      if (!m || nekad(t, m.index) || /^[^,.;]{0,25}\b(?:inte|ej)\b/.test(t.slice(m.index + m[0].length))) continue;
      const tal = m.slice(1).filter((x) => x !== undefined).map(tolkaTal);
      if (!tal.length || tal.some((x) => !Number.isFinite(x))) continue;
      const lo = tal[0];
      const hi = tal[1] ?? lo;
      if (lo < lagst || hi > hogst || hi < lo) continue;
      return hi === lo ? lo : [lo, hi];
    }
  }
  return null;
}

/** En rad som bara bär talet ("Antal lådor: 5", "Hyllplan: 4 st"). */
function radAntal(rad: Map<string, string>, nycklar: readonly string[], lagst: number, hogst: number): number | null {
  for (const k of nycklar) {
    const m = /^\s*(\d{1,2})(?!\s*(?:cm|mm|kg|m\b|×|x\b))/.exec(rad.get(k) ?? "");
    if (m && Number(m[1]) >= lagst && Number(m[1]) <= hogst) return Number(m[1]);
  }
  return null;
}

const LADOR = [
  sv(new RegExp(String.raw`\b${FLERA}[ -]${ADJ}[a-zåäö]*lådor\b`)),
  sv(new RegExp(String.raw`\b${FLERA}-lådig`)),
];
const LADOR_SUMMA = sv(new RegExp(String.raw`\b${FLERA} [a-zåäö]+ och ${FLERA}[ -]${ADJ}[a-zåäö]*lådor\b`));
const EN_LADA = sv(/\b(?:med|och) (?:en )?låda\b/);

const SITTPLATSER = [
  // "tresits", "3-sits", "tresitssoffa" — men inte "två sitsdynor".
  sv(new RegExp(String.raw`\b${TALORD}[- ]?sits(?!dyn|kudd|höjd|djup|bredd|yta)`)),
  sv(new RegExp(String.raw`\bplats för ${TALORD}${SPANN}`)),
  sv(new RegExp(String.raw`\b${TALORD}${SPANN} (?:personer|sittplatser)\b`)),
  sv(new RegExp(String.raw`\bför ${TALORD}${SPANN}\b(?!\s*(?:år|kg|kilo|cm|mm|m\b|tum|liter|l\b|hund|katt|barn|månad|st\b|meter|watt|w\b))`)),
];
/** "Matgrupp … och fyra stolar": bara i namn på bord och grupper, inte
 *  "hörnsoffa med två fotpallar". */
const SITTPLATSER_NAMN = sv(new RegExp(String.raw`\b(?:med|och|\+) ${TALORD} (?:[a-zåäö]+ )?(?:stolar|fåtöljer)\b`));
const GRUPP = /matgrupp|grupp|\bset\b|bord/;

const VANINGAR = [
  sv(new RegExp(String.raw`\b${FLERA}[ -]${ADJ}(?:våningar|våningsplan|plan|nivåer|etage|hyllor|hyllplan)\b`)),
  sv(new RegExp(String.raw`\b${FLERA}-vånings`)),
];

const SANGBREDD = sv(/\b(70|80|90|105|120|135|140|150|160|180|200)\s*(?:cm\s*)?[×x]\s*(?:190|195|200|210)\b|\b(?:190|195|200|210)\s*(?:cm\s*)?[×x]\s*(70|80|90|105|120|135|140|150|160|180)\b/);

/** Ord som betyder att formen varken är rund eller rak. */
const OKAND_FORM = sv(/halvrund|halvcirkel|njurform|hjärtform|\bl-form|hörn|båg|välvd|oregelbunden|asymmetrisk|organisk|kiselsten|vågform|blomform|stjärn|sexkant|åttkant|triangel|trekant/);
/** Samma sak i löptexten, där "hörn" och "båge" oftast handlar om rummet. */
const OKAND_FORM_TEXT = sv(/halvrund|halvcirkel|njurform|hjärtform|bågform|välvd|oregelbunden|asymmetrisk|organisk|kiselsten|sexkant|åttkant|trekant|triangel/);
/** Ett formord om varan i ingressen: "en rund pall", "rektangulär skiva". */
const FORMORD = sv(/\b(rund|runt|runda|oval|ovalt|ovala|kvadratisk|kvadratiskt|fyrkantig|fyrkantigt|rektangulär|rektangulärt)(?: [a-zåäö]+)? (?:bord|skiva|bordsskiva|spegel|spegelglas|matbord|soffbord|sidobord|glasskiva|topp|ram|pall|puff|fotpall|eldkorg|korg)\b/);
/** Varor där formen är en fråga: bord, speglar, puffar, eldkorgar. Inte stolar. */
const HAR_FORM = /bord|spegel|puff|fotpall|eldkorg|eldstad|fyrfat|matta|bricka/;
/** … men inte stolar, lampor eller en studsmatta ("Bordslampa", "Fåtölj med fotpall"). */
const UTAN_FORM = /stol|fåtölj|lampa|lampor|hängmatta|studsmatta|soffa/;

/**
 * Klädsel, djur, bränsle, form, placering, antal och egenskaper. `matt` är
 * `spec` bär redan måtten, som formen på bord utan formord läses ur;
 * `mattRad` är måttradens text (Ø betyder rund).
 */
function lasEgenskaper(namn: string, html: string, rad: Map<string, string>, spec: Spec, mattRad: string): void {
  const n = namn.toLowerCase();
  const ingr = ingress(html);
  // Spec-tabellens rader läses som "nyckel: värde". Inte specRaders textrader:
  // där blir varje mening med ett kolon en rad, också "Andra
  // uppresningsfåtöljer: … modellen med hjul".
  const tabell = [...egenHtml(html).matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)]
    .map(([, k, v]) => `${utanTaggar(k)}: ${utanTaggar(v)}`);
  const satser = [...egenText(html, ingr), ...tabell];

  const ky = forstaKoder([namn, radText(rad, ["klädsel", "material", "tyg", "överdrag", "sits", "sitsmaterial", "stoppning"]), ingr], VAL.ky);
  if (ky) spec.ky = ky;
  const dj = forstaKoder([namn, radText(rad, ["passar för", "lämplig för", "djur", "för"]), ingr], VAL.dj);
  if (dj) spec.dj = dj;
  // Bränsle bara på det som eldar: ett vedställ drivs inte med ved.
  const eldar = /grill|eldkorg|eldstad|fyrfat|eldbord|kamin|värmare|ugn|plancha|brännare|spis|marschall|fackla|rökare/.test(n);
  const br = eldar ? forstaKoder([namn, radText(rad, ["bränsle", "drivmedel", "energikälla", "värmekälla", "gastyp", "strömförsörjning", "typ"]), ingr], VAL.br) : "";
  if (br) spec.br = br;

  // Placering: tippskyddet som fästs i väggen gör inte ett klösträd vägghängt.
  const utanTipp = (t: string) => t.split(/[.!?;\n]+/).filter((s) => !/tipp|förank|säkra|väggfäste för/i.test(s)).join(". ");
  const pl = forstaKoder([namn, radText(rad, ["placering", "montering", "installation"]), utanTipp(ingr)], VAL.pl)
    || (/\bvägg (?:eller|och) golv|\bgolv (?:eller|och) vägg/.test(n) ? "vf" : "");
  if (pl) spec.pl = pl;

  // Form: ord i namnet, sedan Ø i måttet, sedan ett formord om skivan eller
  // spegeln i ingressen, sist måtten själva (lika bredd och djup = kvadratisk).
  let fo = "";
  if (HAR_FORM.test(n) && !UTAN_FORM.test(n) && !OKAND_FORM.test(n)) {
    if (/\brund(?:a|t)?\b|\brunt\b|ø/.test(n)) fo += "r";
    if (/\boval/.test(n)) fo += "o";
    if (/kvadratisk|fyrkantig/.test(n)) fo += "k";
    if (/rektangulär|avlång/.test(n)) fo += "e";
    if (!fo && (/ø/i.test(mattRad) || rad.has("diameter"))) fo = "r";
    if (!fo) {
      const m = FORMORD.exec(ingr.toLowerCase());
      if (m && !OKAND_FORM_TEXT.test(ingr.toLowerCase())) fo = /^run/.test(m[1]) ? "r" : /^oval/.test(m[1]) ? "o" : /^(kvad|fyrk)/.test(m[1]) ? "k" : "e";
    }
    if (!fo && !OKAND_FORM_TEXT.test(ingr.toLowerCase())) {
      if (typeof spec.b === "number" && typeof spec.d === "number" && spec.h !== undefined) fo = spec.b === spec.d ? "k" : "e";
      // En spegel mäts i bredd × höjd: "Badrumsspegel LED 80 × 60 cm".
      else if (/spegel/.test(n)) {
        const m = /(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*cm/.exec(n);
        if (m) fo = m[1] === m[2] ? "k" : "e";
      }
    }
  }
  if (fo) spec.fo = fo;

  // Egenskaperna: varje egenskap för sig, i namnet eller i den egna texten.
  // Namnet står på första raden.
  const egen = [namn, ...satser].map((x) => x.replace(/\n/g, " ")).join("\n");
  const egenGemener = egen.toLowerCase();
  let eg = "";
  for (const v of VAL.eg) {
    // LED läses med versaler: "led" är också en led i ett armstöd.
    const text = v.kod === "l" ? egen : egenGemener;
    for (const h of traffar(text, v.ord!)) {
      const t = h.sats.toLowerCase();
      // En rad vars värde säger nej: "Batteri: tutan kräver inget batteri".
      if (NEJ_RAD.test(t)) continue;
      if (v.kod === "h" && /löphjul|stödhjul|motionshjul|springhjul|hamsterhjul|hjulenhet/.test(t)) continue;
      // Batterierna till fjärrkontrollen gör inte lampan batteridriven.
      if (v.kod === "b" && /startbatteri|bilbatteri|fordonsbatteri|batteriet i bilen|fjärrkontroll/.test(t)) continue;
      // "Två AAA-batterier ingår ej" hos en vara med fjärrkontroll gäller oftast den.
      if (v.kod === "b" && /(?:ingår|medföljer) (?:inte|ej)/.test(t) && egenGemener.includes("fjärrkontroll")) continue;
      if (v.kod === "f" && /fjärrkontroll(?:en)? (?:ingår|medföljer) (?:inte|ej)|(?:för|till) (?:en |din |tv:ns )?fjärrkontroll|fjärrkontrollhållare/.test(t)) continue;
      if (v.kod === "j") {
        // Höj- och sänkbar bara när det är varan själv som beskrivs: i namnet
        // eller först i en punkt eller rad ("Höjdjusterbar med gasfjäder", "En
        // höjdjusterbar skrivbordsstol"), inte mitt i en mening om något annat
        // ("… för dig som sitter vid ett höj- och sänkbart skrivbord").
        if (h.index >= namn.length && h.iSatsen > 16) continue;
        // "Höjdjusterbart styre", "höjdjusterbara fötter": en del, inte varan.
        if (/^\S*\s+(?:\S+\s+)?(?:hyllplan|hylla|hyllor|fötter|fot|ben|styre|sadel|nackstöd|armstöd|ryggstöd|handtag|stödben|pinnar|dusch|arm|lampa|lampan|bakvagn|bygel)/.test(t.slice(h.iSatsen + (h.slut - h.index) - 1))) continue;
      }
      eg += v.kod;
      break;
    }
  }
  // En solcellslampa har ett batteri men drivs av solen.
  if (eg.includes("s") && eg.includes("b") && !/batteri|aa-/.test(n)) eg = eg.replace("b", "");
  if (eg) spec.eg = eg;

  // "två små och två breda lådor" = fyra.
  const summa = LADOR_SUMMA.exec(n);
  const ld = (summa ? tolkaTal(summa[1]) + tolkaTal(summa[2]) : null) ?? forstaAntal([namn], LADOR, 2, 24) ?? radAntal(rad, ["antal lådor", "lådor"], 1, 24)
    ?? forstaAntal([ingr], LADOR, 2, 24) ?? (EN_LADA.test(n) ? 1 : null);
  if (ld !== null) spec.ld = ld;
  const sp = forstaAntal([namn], GRUPP.test(n) ? [SITTPLATSER_NAMN, ...SITTPLATSER] : SITTPLATSER, 2, 20)
    ?? radAntal(rad, ["sittplatser", "antal sittplatser", "antal personer"], 1, 20)
    ?? forstaAntal([ingr], SITTPLATSER, 2, 20);
  if (sp !== null) spec.sp = sp;
  const vn = forstaAntal([namn], VANINGAR, 2, 12)
    ?? radAntal(rad, ["våningar", "antal våningar", "nivåer", "antal nivåer", "antal hyllplan", "antal hyllor", "hyllplan"], 2, 12)
    ?? forstaAntal([ingr], VANINGAR, 2, 12);
  if (vn !== null) spec.vn = vn;

  const sb = SANGBREDD.exec([namn, radText(rad, ["liggyta", "madrass", "madrassmått", "sängmått", "bäddmått", "bädd", "sovyta", "liggmått", "bäddyta", "madrasstorlek"]), ingr].join(" | ").toLowerCase());
  if (sb) spec.sb = Number(sb[1] ?? sb[2]);
}

// ── Filtren ─────────────────────────────────────────────────────────────────

/** Produktens intervall på en nyckel, eller null när värdet saknas. */
export function intervall(spec: Spec | undefined, k: IntervallNyckel | AntalNyckel): [number, number] | null {
  const v = spec?.[k];
  if (v === undefined) return null;
  return Array.isArray(v) ? [v[0], v[1]] : [v, v];
}

/**
 * Passar produkten det valda intervallet? Ett inställbart värde passar om
 * någon del av det ligger inom urvalet. Saknas värdet passar produkten inte.
 */
export function inomIntervall(spec: Spec | undefined, k: IntervallNyckel, lo: number, hi: number): boolean {
  const v = intervall(spec, k);
  return v !== null && v[1] >= lo && v[0] <= hi;
}

/**
 * Passar produkten valen i en knappgrupp? Material, klädsel, djur … är ELLER
 * ("trä eller metall"), egenskaperna OCH ("med hjul och höj- och sänkbar").
 * Ett antal är "4" eller "8+"; ett spann ("för sex till åtta") passar varje
 * antal det täcker. Saknas värdet passar produkten inte.
 */
export function passarVal(spec: Spec | undefined, k: ValNyckel, valda: readonly string[], och: boolean): boolean {
  if (!valda.length) return true;
  if (arAntal(k)) {
    const v = intervall(spec, k);
    if (!v) return false;
    return valda.some((kod) => {
      const plus = kod.endsWith("+");
      const n = Number(plus ? kod.slice(0, -1) : kod);
      return plus ? v[1] >= n : v[0] <= n && v[1] >= n;
    });
  }
  const koder = spec?.[k];
  if (!koder) return false;
  return och ? valda.every((x) => koder.includes(x)) : valda.some((x) => koder.includes(x));
}

/** Skalan för ett intervallreglage. Samma form som prisets (lib/price-range). */
export type SpecSkala = { min: number; max: number; step: number; openTop: boolean };

function stegFor(span: number): number {
  if (span <= 12) return 0.5;
  if (span <= 30) return 1;
  if (span <= 80) return 2;
  if (span <= 200) return 5;
  if (span <= 500) return 10;
  if (span <= 1500) return 25;
  if (span <= 4000) return 50;
  return 100;
}

/**
 * Reglagets skala ur listans värden, eller null när ett reglage inte hjälper
 * någon: för få värden, för lite spridning. Svansen kapas som på priset, så att
 * en enda 400 cm-paviljong inte trycker ihop alla hyllor i vänsterkanten.
 */
export function specSkala(varden: readonly number[]): SpecSkala | null {
  const v = varden.filter((x) => Number.isFinite(x) && x >= 0).sort((a, z) => a - z);
  if (v.length < 8) return null;
  if (new Set(v).size < 4) return null;
  const lagst = v[0];
  const hogst = v[v.length - 1];
  if (hogst <= lagst) return null;
  const tak = v[Math.min(v.length - 1, Math.round(0.95 * (v.length - 1)))];
  const topp = hogst / Math.max(tak, 1e-9) >= 1.5 ? tak : hogst;
  const step = stegFor(topp - lagst);
  const min = Math.floor(lagst / step) * step;
  let max = Math.ceil(topp / step) * step;
  if (max - min < step * 2) max = Math.ceil(hogst / step) * step;
  if (max - min < step * 2) return null;
  return { min: runda(min), max: runda(max), step, openTop: hogst > max };
}

/** En stapel bakom reglaget. Samma form som prisets HistStapel. */
export type SpecStapel = { h: number; mid: number; over: boolean };

const FACK = 30;
const HOJD = 40;

/** Fördelningen bakom reglaget. Inställbara värden räknas på sin mitt. */
export function specHistogram(varden: readonly number[], skala: SpecSkala | null): SpecStapel[] {
  if (!skala) return [];
  const w = (skala.max - skala.min) / FACK;
  const antal = new Array<number>(FACK).fill(0);
  for (const x of varden) antal[Math.min(FACK - 1, Math.max(0, Math.floor((x - skala.min) / w)))] += 1;
  const topp = Math.max(1, ...antal);
  return antal.map((n, i) => ({
    h: n ? Math.max(3, Math.round(Math.sqrt(n / topp) * HOJD)) : 2,
    mid: Math.round((skala.min + (i + 0.5) * w) * 100) / 100,
    over: i === FACK - 1 && skala.openTop,
  }));
}

/** Ett val i en knappgrupp som skickas till webbläsaren. */
export type Val = { kod: string; namn: string; slug: string };

/** Ett filter som ska visas: ett reglage eller en knappgrupp. */
export type SpecFacett =
  | { nyckel: IntervallNyckel; namn: string; enhet: string; skala: SpecSkala; hist: SpecStapel[] }
  | { nyckel: ValNyckel; namn: string; och: boolean; val: Val[] };

/**
 * Ett filter kategorin erbjuder, med kategorins namn på det. `koder` begränsar
 * en knappgrupp till de val som hör hemma i kategorin (egenskaperna "hj" =
 * hjul och höj- och sänkbar på skrivbord).
 */
export type FacettDef = { nyckel: Nyckel; namn: string; koder?: string };

/** Så stor andel av listan måste ha värdet för att ett reglage ska visas. */
export const MIN_ANDEL = 0.6;
/**
 * Samma sak för en knappgrupp. Lägre, eftersom knappen säger vad den väljer:
 * den som trycker "Sammet" ser sammetsfåtöljerna, och en fåtölj vars text inte
 * nämner klädseln saknas bara där. Ett reglage ser däremot ut att täcka allt.
 */
export const MIN_ANDEL_VAL = 0.4;
/** Egenskaper visas när minst så många produkter har dem … */
const MIN_EGENSKAP = 3;
/** … och inte nästan alla: "Med hjul" bland kontorsstolar väljer ingenting. */
const MAX_ANDEL_EGENSKAP = 0.9;
/** Högst så många antal-knappar; den sista blir "N+" när det finns fler. */
const MAX_ANTAL_KNAPPAR = 6;

/** Knapparna för ett antal ("2", "3", "4", "5+") och hur många som har värdet. */
function antalVal(items: readonly { spec?: Spec }[], k: AntalNyckel): { val: Val[]; med: number } {
  const antal = new Map<number, number>();
  let med = 0;
  for (const p of items) {
    const v = intervall(p.spec, k);
    if (!v) continue;
    med++;
    // Ett spann räknas på varje antal det täcker; sängbredden bara på sitt värde.
    if (k === "sb") antal.set(v[0], (antal.get(v[0]) ?? 0) + 1);
    else for (let n = Math.round(v[0]); n <= Math.min(Math.round(v[1]), v[0] + 20); n++) antal.set(n, (antal.get(n) ?? 0) + 1);
  }
  const tal = [...antal].filter(([, c]) => c >= 2).map(([n]) => n).sort((a, b) => a - b).slice(0, MAX_ANTAL_KNAPPAR);
  const enhet = FACETTER[k].enhet ? ` ${FACETTER[k].enhet}` : "";
  // Finns det fler än sista knappen visar (också en ensam byrå med tio lådor)
  // blir den "N+", annars går de aldrig att välja. Sängbredden är exakta mått.
  const sista = tal[tal.length - 1];
  const plus = k !== "sb" && [...antal.keys()].some((n) => n > sista);
  const val: Val[] = tal.map((n) => (plus && n === sista
    ? { kod: `${n}+`, namn: `${n}+${enhet}`, slug: `${n}-plus` }
    : { kod: String(n), namn: `${n}${enhet}`, slug: String(n) }));
  return { val, med };
}

/** En knappgrupp för listan, eller null när den inte hjälper någon. */
function valOversikt(items: readonly { spec?: Spec }[], def: FacettDef): SpecFacett | null {
  const k = def.nyckel as ValNyckel;
  const namn = def.namn || FACETTER[k].namn;
  if (arAntal(k)) {
    const { val, med } = antalVal(items, k);
    return val.length >= 2 && med >= MIN_ANDEL_VAL * items.length ? { nyckel: k, namn, och: false, val } : null;
  }
  const antal = new Map<string, number>();
  let med = 0;
  for (const p of items) {
    const koder = p.spec?.[k];
    if (!koder) continue;
    med++;
    for (const c of koder) antal.set(c, (antal.get(c) ?? 0) + 1);
  }
  const tillatna = VAL[k].filter((v) => !def.koder || def.koder.includes(v.kod));
  const val = (lagst: number, hogst = Infinity): Val[] => tillatna
    .filter((v) => (antal.get(v.kod) ?? 0) >= lagst && (antal.get(v.kod) ?? 0) <= hogst)
    .map((v) => ({ kod: v.kod, namn: v.namn, slug: v.slug }));
  if (k === "eg") {
    const eg = val(MIN_EGENSKAP, MAX_ANDEL_EGENSKAP * items.length);
    return eg.length ? { nyckel: k, namn, och: true, val: eg } : null;
  }
  const andel = k === "m" ? MIN_ANDEL : MIN_ANDEL_VAL;
  const v = val(2);
  return v.length >= 2 && med >= andel * items.length ? { nyckel: k, namn, och: false, val: v } : null;
}

/**
 * Filtren som ska visas för listan. Kategorin föreslår (lib/spec-config.ts),
 * datan avgör: ett reglage visas bara när minst MIN_ANDEL av produkterna har
 * värdet och värdena skiljer sig åt, en knappgrupp vid MIN_ANDEL_VAL och minst
 * två val (egenskaperna: ett val som minst tre har). Annars hade kunden kunnat filtrera bort
 * halva sortimentet utan att förstå varför.
 */
export function specOversikt(items: readonly { spec?: Spec }[], defs: readonly FacettDef[]): SpecFacett[] {
  if (!items.length) return [];
  const ut: SpecFacett[] = [];
  for (const def of defs) {
    if (!arIntervall(def.nyckel)) {
      const f = valOversikt(items, def);
      if (f) ut.push(f);
      continue;
    }
    const k = def.nyckel as IntervallNyckel;
    // Staplarna ritas på värdets mitt; åldern på sin nedre gräns ("från 3
    // år"), eftersom "3 år och uppåt" saknar en mitt.
    const punkter: number[] = [];
    const skalvarden: number[] = [];
    for (const p of items) {
      const v = intervall(p.spec, k);
      if (!v) continue;
      if (k === "a") {
        punkter.push(v[0]);
        skalvarden.push(v[0]);
        if (v[1] < 99) skalvarden.push(v[1]);
      } else {
        punkter.push((v[0] + v[1]) / 2);
        skalvarden.push((v[0] + v[1]) / 2);
      }
    }
    if (punkter.length < MIN_ANDEL * items.length) continue;
    const skala = specSkala(skalvarden);
    if (!skala) continue;
    ut.push({ nyckel: k, namn: def.namn || FACETTER[k].namn, enhet: FACETTER[k].enhet, skala, hist: specHistogram(punkter, skala) });
  }
  return ut;
}

/** Bara de nycklar kategorin använder — resten skickas inte till webbläsaren. */
export function specFor(spec: Spec | undefined, nycklar: ReadonlySet<Nyckel>): Spec | undefined {
  if (!spec) return undefined;
  let ut: Spec | undefined;
  for (const k of Object.keys(spec) as Nyckel[]) {
    if (!nycklar.has(k)) continue;
    (ut ??= {})[k] = spec[k] as never;
  }
  return ut;
}

// ── Avläsning och URL ───────────────────────────────────────────────────────

/** "45", "45,5" — svensk decimal, inga onödiga nollor. */
export function formatTal(n: number): string {
  const r = Math.round(n * 10) / 10;
  const [hel, dec] = String(r).split(".");
  const grupperad = hel.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return dec ? `${grupperad},${dec}` : grupperad;
}

/** Etiketten för ett valt intervall: "40–120 cm", "Under 80 cm", "Från 2 000 W". */
export function specEtikett(lo: number, hi: number, skala: SpecSkala, enhet: string): string {
  const botten = lo <= skala.min;
  const toppen = hi >= skala.max;
  const e = enhet ? ` ${enhet}` : "";
  if (botten && toppen) return "Alla";
  if (botten) return `Upp till ${formatTal(hi)}${e}`;
  if (toppen) return `Från ${formatTal(lo)}${e}`;
  return `${formatTal(lo)}–${formatTal(hi)}${e}`;
}

/** Intervallet i URL:en: "40-120", "under-80", "over-2000". Tom = inget filter. */
export function specSlug(lo: number, hi: number, skala: SpecSkala): string {
  const botten = lo <= skala.min;
  const toppen = hi >= skala.max;
  const t = (n: number) => String(Math.round(n * 10) / 10);
  if (botten && toppen) return "";
  if (botten) return `under-${t(hi)}`;
  if (toppen) return `over-${t(lo)}`;
  return `${t(lo)}-${t(hi)}`;
}

/** URL-värdet → handtagens läge på skalan. Skräp eller utanför = hela skalan. */
export function lasSpecSlug(slug: string | null | undefined, skala: SpecSkala): [number, number] {
  const hela: [number, number] = [skala.min, skala.max];
  if (!slug) return hela;
  const n = String.raw`(\d{1,6}(?:\.\d)?)`;
  let lo = skala.min;
  let hi = skala.max;
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`^under-${n}$`).exec(slug))) hi = Number(m[1]);
  else if ((m = new RegExp(`^over-${n}$`).exec(slug))) lo = Number(m[1]);
  else if ((m = new RegExp(`^${n}-${n}$`).exec(slug))) { lo = Number(m[1]); hi = Number(m[2]); }
  else return hela;
  const snap = (v: number) => Math.min(Math.max(Math.round(v / skala.step) * skala.step, skala.min), skala.max);
  lo = snap(lo);
  hi = snap(hi);
  return lo < hi ? [lo, hi] : hela;
}

/** Övre gräns att filtrera på: toppläget betyder "och uppåt". */
export function specOvre(hi: number, skala: SpecSkala): number {
  return hi >= skala.max ? Infinity : hi;
}

/** Undre gräns: bottenläget betyder "och nedåt", så inget under skalan faller bort. */
export function specUndre(lo: number, skala: SpecSkala): number {
  return lo <= skala.min ? -Infinity : lo;
}
