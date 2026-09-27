// lib/spec-facets.ts
//
// Produktens mått och egenskaper som filter: bredd, djup, höjd, sitthöjd,
// maxlast, vikt, effekt, volym, ålder och material.
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
};

export type IntervallNyckel = "b" | "d" | "h" | "sh" | "ml" | "kg" | "w" | "l" | "a";
export type Nyckel = IntervallNyckel | "m";

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
};

/**
 * Materialklasserna, med de ord i beskrivningen som räknas till dem. En
 * produkt kan höra till flera ("stål och MDF" = metall och trä).
 */
export const MATERIAL: { kod: string; namn: string; slug: string; ord: RegExp }[] = [
  { kod: "t", namn: "Trä", slug: "tra", ord: /\b(trä(?:et|skiva|stomme)?|massivt? trä|ek|furu|bambu|mdf|spånskiva|akacia|gran|plywood|teak|valnöt|björk|bok|paulownia|trälook)\b/ },
  { kod: "m", namn: "Metall", slug: "metall", ord: /\b(stål|rostfritt|metall|järn|gjutjärn|aluminium|alu|krom|förzinkad|galvaniserad|galvad|mässing)\b/ },
  { kod: "p", namn: "Plast", slug: "plast", ord: /\b(plast|pp|pe|hdpe|abs|polypropen|polyeten|pvc|akryl|polykarbonat|nylon|eva)\b/ },
  { kod: "y", namn: "Tyg", slug: "tyg", ord: /\b(tyg(?:et)?|polyester|sammet|linne|bomull|textil|oxford|velour|chenille|teddy|bouclé|mikrofiber|filt|mesh|nät)\b/ },
  { kod: "k", namn: "Konstläder", slug: "konstlader", ord: /\b(konstläder|pu-läder|pu läder|läderlook|läder)\b/ },
  { kod: "r", namn: "Rotting", slug: "rotting", ord: /\b(rotting|konstrotting|polyrotting|rattan|korgflätad)\b/ },
  { kod: "g", namn: "Glas", slug: "glas", ord: /\b(glas|härdat glas)\b/ },
  { kod: "s", namn: "Sten & keramik", slug: "sten", ord: /\b(keramik|porslin|marmor|sten|betong|terrakotta)\b/ },
];

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

  return Object.keys(spec).length ? spec : undefined;
}

// ── Filtren ─────────────────────────────────────────────────────────────────

/** Produktens intervall på en nyckel, eller null när värdet saknas. */
export function intervall(spec: Spec | undefined, k: IntervallNyckel): [number, number] | null {
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

/** Har produkten något av de valda materialen? */
export function harMaterial(spec: Spec | undefined, koder: string): boolean {
  if (!spec?.m) return false;
  for (const k of koder) if (spec.m.includes(k)) return true;
  return false;
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

/** Ett filter som ska visas: ett reglage eller en rad material. */
export type SpecFacett =
  | { nyckel: IntervallNyckel; namn: string; enhet: string; skala: SpecSkala; hist: SpecStapel[] }
  | { nyckel: "m"; namn: string; val: [string, number][] };

/** Ett filter kategorin erbjuder, med kategorins namn på det. */
export type FacettDef = { nyckel: Nyckel; namn: string };

/** Så stor andel av listan måste ha värdet för att filtret ska visas. */
export const MIN_ANDEL = 0.6;

/**
 * Filtren som ska visas för listan. Kategorin föreslår (lib/spec-config.ts),
 * datan avgör: ett filter visas bara när minst MIN_ANDEL av produkterna har
 * värdet och värdena skiljer sig åt. Annars hade kunden kunnat filtrera bort
 * halva sortimentet utan att förstå varför.
 */
export function specOversikt(items: readonly { spec?: Spec }[], defs: readonly FacettDef[]): SpecFacett[] {
  if (!items.length) return [];
  const ut: SpecFacett[] = [];
  for (const def of defs) {
    if (def.nyckel === "m") {
      const antal = new Map<string, number>();
      let med = 0;
      for (const p of items) {
        if (!p.spec?.m) continue;
        med++;
        for (const k of p.spec.m) antal.set(k, (antal.get(k) ?? 0) + 1);
      }
      const val = MATERIAL.filter((m) => (antal.get(m.kod) ?? 0) >= 2).map((m): [string, number] => [m.kod, antal.get(m.kod)!]);
      if (med >= MIN_ANDEL * items.length && val.length >= 2) ut.push({ nyckel: "m", namn: def.namn || FACETTER.m.namn, val });
      continue;
    }
    const k = def.nyckel;
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
