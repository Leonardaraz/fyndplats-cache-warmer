// lib/spec-config.ts
//
// Vilka mått- och egenskapsfilter varje kategori erbjuder, och vad de heter
// där. Kategorin FÖRESLÅR, datan AVGÖR: ett filter visas bara när minst 60 %
// av produkterna i listan har värdet (lib/spec-facets.ts, specOversikt). En
// kategori kan alltså stå med ett filter här som inte syns förrän
// beskrivningarna bär värdet.
//
// VARFÖR PER KATEGORI. Datan finns ofta där den inte hjälper kunden: en
// fåtöljs vikt eller en massagestols effekt står i beskrivningen, men ingen
// väljer fåtölj efter vikt. Listan här är de frågor kunden faktiskt ställer i
// kategorin: sitthöjd på stolar, bredd på hyllor, volym på vattenkokare,
// ålder på leksaker.
//
// ÄRVS NEDÅT. En underkategori utan egen rad får sin huvudkategoris filter.
// Ordningen i listan är ordningen i panelen.
//
// Listor som spänner över hela sortimentet (/alla-produkter, /rea, /populara,
// sökresultaten) får inga måttfilter: en bredd som gäller soffor och
// vattenkokare samtidigt säger ingenting.
//
// Ren modul utan importer utöver typerna, så node --test kör den direkt.

import type { FacettDef, Nyckel } from "./spec-facets";

/** En nyckel, eller en nyckel med kategorins eget namn på filtret. */
type Rad = (Nyckel | [Nyckel, string])[];

const STOLAR: Rad = ["sh", "b", "ml", "m"];
const BORD: Rad = ["b", "d", "h", "m"];
const SKAP: Rad = ["b", "h", "d", "m"];
const TAKTALT: Rad = [["b", "Längd"], ["d", "Bredd"], "h", "m"];
const BURAR: Rad = [["b", "Längd"], ["d", "Bredd"], "h", "m"];
const APPARATER: Rad = ["w", "l", "b", "h"];
const HOJD: Rad = ["h", "b", "m"];
const BARNFORDON: Rad = ["a", "ml", "m"];

const KATEGORIER: Record<string, Rad> = {
  // ── Hem & Inredning ──
  "hem-inredning": ["b", "h", "d", "m"],
  "förvaring-städ": ["b", "h", "d", "ml", "m"],
  "dekoration-prydnad": HOJD,
  "verktyg-hemmafix": ["w", "b", "h", "m"],
  "hemtextil-badrum": ["b", "h", "m"],
  "kalas-fest": ["h", "b", "m"],
  "badrumsskap": SKAP,
  "julgranar": [["h", "Höjd"], ["b", "Diameter"], "m"],
  "juldekoration": HOJD,
  "halloweendekoration": HOJD,
  "belysning": ["h", "w", "m"],
  "golvlampor": ["h", "w", "m"],
  "konstvaxter": HOJD,
  "hushållsapparater": APPARATER,
  "speglar": [["h", "Höjd"], "b", "m"],
  "badrumsspeglar": [["h", "Höjd"], "b", "m"],
  "verktygsvagnar-verktygslador": ["b", "h", "d", "ml", "m"],
  "elkaminer": ["w", "b", "h"],
  "varmeflaktar": ["w", "h"],
  "tvattkorgar": ["l", "h", "m"],
  "gnistskydd": ["b", "h", "m"],
  "elementskydd": ["b", "h", "m"],

  // ── Möbler ──
  "mobler": ["b", "d", "h", "sh", "ml", "m"],
  "fatoljer": STOLAR,
  "kontorsstolar": STOLAR,
  "massagestolar": STOLAR,
  "baddfatoljer": STOLAR,
  "snurrfatoljer": STOLAR,
  "oronlappsfatoljer": STOLAR,
  "pallar": ["sh", "ml", "m"],
  "sittpuffar-fotpallar": ["h", "b", "m"],
  "matbord-stolar": ["b", "d", "h", "sh", "m"],
  "matgrupper": ["b", "m"],
  "soffor-baddsoffor": ["b", "d", "sh", "m"],
  "soffbord-smabord": BORD,
  "sidobord": BORD,
  "nattduksbord": BORD,
  "barbord": BORD,
  "skrivbord": ["b", "d", "h", "ml", "m"],
  "hornskrivbord": ["b", "d", "h", "m"],
  "tv-bankar": BORD,
  "sangar-sovrum": ["b", "d", "h", "m"],
  "skoskap-skobankar": SKAP,
  "byraer": SKAP,
  "bokhyllor": ["b", "h", "d", "ml", "m"],
  "sideboards-vitrinskap": SKAP,
  "kladhangare-hallmobler": SKAP,
  "rumsavdelare": ["b", "h", "m"],

  // ── Trädgård & Utemöbler ──
  "trädgård-utemöbler": ["b", "d", "h", "m"],
  "vaxthus-odling": TAKTALT,
  "solskydd-paviljonger": TAKTALT,
  "redskapsbodar-forrad": TAKTALT,
  "garagetalt": TAKTALT,
  "skarmtak-entretak": ["b", "d", "m"],
  "utemobler": ["b", "sh", "ml", "m"],
  "grill-utekok": ["b", "h", "m"],
  "tradgardsdekor-belysning": HOJD,
  "odlingslador": ["b", "d", "h", "m"],
  "blomstall-vaxthyllor": SKAP,
  "vedstall-vedbodar": SKAP,
  "eldkorgar-eldstader": [["b", "Diameter"], "h", "m"],
  "terrassvärmare-infravärmare": ["w", "h"],
  "utelek-spel": ["a", "b", "m"],

  // ── Husdjur ──
  "husdjur": BURAR,
  "klostrad": [["h", "Höjd"], ["b", "Bredd"], "ml", "m"],
  "katthus": BURAR,
  "burar-kläder-tillbehör": BURAR,
  "kaninburar-marsvinsburar": BURAR,
  "hamsterburar-gnagarburar": BURAR,
  "hundburar": BURAR,
  "hundkojor": BURAR,
  "honshus-honsgardar": BURAR,
  "valphagar-hundhagar": BURAR,
  "terrarier": BURAR,
  "hundvagnar": ["ml", "kg", "m"],
  "hundbaddar-hundsoffor": [["b", "Längd"], ["d", "Bredd"], "m"],
  "kattlador": ["b", "h", "m"],
  "mat-vattenskålar": ["l", "m"],
  "selar-koppel-transport": ["ml", "m"],
  "lek-bädd-tillbehör": ["b", "h", "m"],

  // ── Barn & Familj ──
  "barn-familj": ["a", "ml", "m"],
  "leksaker-spel": ["a", "m"],
  "baby-småbarn": ["a", "ml", "m"],
  "elbilar-for-barn": BARNFORDON,
  "motorcyklar-for-barn": BARNFORDON,
  "sparkcyklar-for-barn": BARNFORDON,
  "gunghastar-gungdjur": BARNFORDON,
  "barnmobler": ["a", "h", "ml", "m"],
  "leksakskok": ["a", "h", "m"],
  "sandlador": ["b", "m"],

  // ── Sport & Fritid ──
  "sport-fritid": ["ml", "kg", "m"],
  "träning-gym": ["ml", "kg", "m"],
  "traningsbankar": ["ml", "kg", "m"],
  "motionscyklar": ["ml", "kg", "m"],
  "hantlar-hantelset": ["kg", "m"],
  "boxningssackar": ["kg", "h", "m"],
  "friluftsliv-resa": ["kg", "m"],
  "bil-cykel": ["w", "ml", "kg", "m"],

  // ── Kök & Husgeråd ──
  "kök-matlagning": ["w", "l", "b", "h", "m"],
  "köksmaskiner-apparater": APPARATER,
  "miniugnar-airfryers": APPARATER,
  "vattenkokare-brodrostar": ["l", "w"],
  "soptunnor": ["l", "b", "h", "m"],
  "koksoar-koksvagnar": BORD,
  "serveringsvagnar-rullvagnar": BORD,
  "vinstall-vinkylar": ["b", "h", "m"],
  "köksredskap-tillbehör": ["m"],
  "servering-glas": ["m"],

  // ── Elektronik ──
  "elektronik": ["w", "m"],
  "dator-gaming": ["ml", "b", "m"],
  "projektordukar": ["b"],

  // ── Skönhet & Hälsa ──
  "skönhet-hälsa": ["ml", "w", "m"],
  "massage-återhämtning": ["ml", "w", "m"],
  "massagebankar": ["ml", "b", "kg"],
};

/** Listor över hela sortimentet: inga måttfilter. */
const UTAN = new Set(["all-products", "rea", "populara", "ovrigt"]);

/**
 * Filtren kategorin erbjuder. `foraldrar` är kategorins förfäder, närmast
 * först — en underkategori utan egen rad ärver den närmaste som har en.
 */
export function facetterFor(slug: string, foraldrar: readonly string[] = []): FacettDef[] {
  if (UTAN.has(slug)) return [];
  const rad = KATEGORIER[slug] ?? foraldrar.map((f) => KATEGORIER[f]).find(Boolean);
  if (!rad) return [];
  return rad.map((r): FacettDef => (Array.isArray(r) ? { nyckel: r[0], namn: r[1] } : { nyckel: r, namn: "" }));
}

/** Alla slugs med egen rad — testet håller dem ärliga mot katalogen. */
export const KONFIGURERADE = Object.keys(KATEGORIER);
