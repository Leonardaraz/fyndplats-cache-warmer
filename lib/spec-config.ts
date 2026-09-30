// lib/spec-config.ts
//
// Vilka mått- och egenskapsfilter varje kategori erbjuder, och vad de heter
// där. Kategorin FÖRESLÅR, datan AVGÖR: ett reglage visas bara när minst 60 %
// av produkterna i listan har värdet, material också 60 %, övriga knappgrupper
// 40 % (lib/spec-facets.ts, specOversikt). En kategori kan alltså stå med ett filter här som inte syns
// förrän beskrivningarna bär värdet.
//
// VARFÖR PER KATEGORI. Datan finns ofta där den inte hjälper kunden: en
// fåtöljs vikt eller en massagestols effekt står i beskrivningen, men ingen
// väljer fåtölj efter vikt. Listan här är de frågor kunden faktiskt ställer i
// kategorin: sitthöjd på stolar, bredd på hyllor, volym på vattenkokare,
// ålder på leksaker.
//
// NYCKLARNA ÄR BUTIKENS SLUGAR, inte Wix. Sajten bygger kategoriadressen ur
// namnet med asciiSlug (lib/category-slug.ts): "Köksmaskiner & apparater" blir
// koksmaskiner-apparater, "Förvaring & organisering" forvaring-organisering.
// Wix egen slug ("köksmaskiner-apparater", "förvaring-städ") matchar aldrig,
// och så gick 16 kategorier utan filter första kvällen (2026-09-27).
// spec-config.test.ts fäller en nyckel med å, ä, ö eller andra tecken.
//
// ÄRVS NEDÅT. En underkategori utan egen rad får sin huvudkategoris filter.
// Ordningen i listan är ordningen i panelen.
//
// Listor som spänner över hela sortimentet (/alla-produkter, /rea, /populara,
// sökresultaten) får inga måttfilter: en bredd som gäller soffor och
// vattenkokare samtidigt säger ingenting.
//
// Ren modul utan importer utöver typerna, så node --test kör den direkt.

import type { FacettDef, KodNyckel, Nyckel } from "./spec-facets";

/**
 * En nyckel, en nyckel med kategorins eget namn på filtret, eller en
 * knappgrupp begränsad till vissa val: "eg:hj" = egenskaperna hjul och höj-
 * och sänkbar. Egenskaper som inte hör hemma i kategorin visas då inte, även
 * om en produkt där har dem (en timer på en massagefåtölj bland möblerna).
 */
type Rad = (Nyckel | `${KodNyckel}:${string}` | [Nyckel, string])[];

// Egenskaperna (lib/spec-facets.ts, VAL.eg): h hjul, j höj- och sänkbar,
// v vattenavvisande, u UV-skydd, l LED, b batteri, s solcell, f fjärrkontroll,
// t timer.
const STOLAR: Rad = ["sh", "b", "ml", "ky", "m"];
const BORD: Rad = ["b", "d", "h", "fo", "m"];
const SKAP: Rad = ["b", "h", "d", "m"];
const TAKTALT: Rad = [["b", "Längd"], ["d", "Bredd"], "h", "eg:vu", "m"];
const BURAR: Rad = [["b", "Längd"], ["d", "Bredd"], "h", "m"];
const SMADJURSBURAR: Rad = [["b", "Längd"], ["d", "Bredd"], "h", "vn", "m"];
const APPARATER: Rad = ["w", "l", "b", "h", "eg:ft"];
const PYNT: Rad = ["h", "b", "eg:lbst", "m"];
const BARNFORDON: Rad = ["a", "ml", "eg:f", "m"];
const VAGNAR: Rad = ["b", "d", "h", "eg:h", "m"];
const SPEGLAR: Rad = [["h", "Höjd"], "b", "fo", "pl", "eg:l", "m"];
const DJURTILLBEHOR: Rad = ["dj", "b", "h", "m"];

const KATEGORIER: Record<string, Rad> = {
  // ── Hem & Inredning ──
  "hem-inredning": ["b", "h", "d", "m"],
  "forvaring-organisering": ["b", "h", "d", "ml", "eg:h", "m"],
  "dekoration-prydnad": PYNT,
  "verktyg-hemmafix": ["w", "b", "h", "m"],
  "badrum-hemtextil": ["b", "h", "m"],
  "kalas-fest": PYNT,
  "badrumsskap": ["b", "h", "d", "pl", "eg:l", "m"],
  "julgranar": [["h", "Höjd"], ["b", "Diameter"], "eg:lb", "m"],
  "juldekoration": PYNT,
  "halloweendekoration": PYNT,
  "belysning": ["h", "w", "eg:bsft", "m"],
  "golvlampor": ["h", "w", "eg:bft", "m"],
  "konstvaxter": ["h", "b", "eg:lu", "m"],
  "hushallsapparater": APPARATER,
  "speglar": SPEGLAR,
  "badrumsspeglar": SPEGLAR,
  "verktygsvagnar-verktygslador": ["b", "h", "d", "ml", "ld", "eg:h", "m"],
  "elkaminer": ["w", "b", "h", "pl", "eg:ft"],
  "varmeflaktar": ["w", "h", "pl", "eg:ft"],
  "tvattkorgar": ["l", "h", "eg:h", "m"],
  "gnistskydd": ["b", "h", "m"],
  "elementskydd": ["b", "h", "m"],

  // ── Möbler ──
  "mobler": ["b", "d", "h", "sh", "ml", "eg:hj", "m"],
  "fatoljer": STOLAR,
  "kontorsstolar": STOLAR,
  "massagestolar": [...STOLAR, "eg:ft"],
  "baddfatoljer": STOLAR,
  "snurrfatoljer": STOLAR,
  "oronlappsfatoljer": STOLAR,
  "pallar": ["sh", "ml", "ky", "eg:hj", "m"],
  "sittpuffar-fotpallar": ["h", "b", "fo", "ky", "m"],
  "matbord-stolar": ["b", "d", "h", "sh", "sp", "fo", "ky", "m"],
  "matgrupper": ["b", "sp", "fo", "m"],
  "soffor-baddsoffor": ["b", "d", "sh", "sp", "ky", "m"],
  "soffbord-smabord": [...BORD, "ld", "eg:hjlf"],
  "sidobord": [...BORD, "eg:hj"],
  "nattduksbord": [...BORD, "ld", "eg:l"],
  "barbord": [...BORD, "eg:j"],
  "skrivbord": ["b", "d", "h", "ml", "ld", "eg:hjl", "m"],
  "hornskrivbord": ["b", "d", "h", "eg:jl", "m"],
  "tv-bankar": ["b", "d", "h", "ld", "eg:hlf", "m"],
  "sangar-sovrum": ["sb", "b", "d", "h", "ky", "m"],
  "skoskap-skobankar": SKAP,
  "byraer": ["b", "h", "d", "ld", "m"],
  "bokhyllor": ["b", "h", "d", ["vn", "Hyllplan"], "ml", "pl", "m"],
  "sideboards-vitrinskap": ["b", "h", "d", "ld", "eg:l", "m"],
  "kladhangare-hallmobler": ["b", "h", "d", "pl", "m"],
  "rumsavdelare": ["b", "h", "m"],

  // ── Trädgård & Utemöbler ──
  "tradgard-utemobler": ["b", "d", "h", "eg:vus", "m"],
  "vaxthus-odling": TAKTALT,
  "solskydd-paviljonger": TAKTALT,
  "redskapsbodar-forrad": TAKTALT,
  "garagetalt": TAKTALT,
  "skarmtak-entretak": ["b", "d", "m"],
  "utemobler": ["b", "sh", "ml", "sp", "eg:vu", "m"],
  "grill-utekok": ["br", "b", "h", "eg:h", "m"],
  "tradgardsdekor-belysning": ["h", "b", "eg:lbs", "m"],
  "odlingslador": ["b", "d", "h", "m"],
  "blomstall-vaxthyllor": ["b", "h", "d", ["vn", "Hyllplan"], "m"],
  "vedstall-vedbodar": SKAP,
  "eldkorgar-eldstader": [["b", "Diameter"], "h", "fo", "m"],
  "terrassvarmare-infravarmare": ["w", "h", "br"],
  "utelek-spel": ["a", "b", "m"],

  // ── Husdjur ──
  "husdjur": ["dj", ["b", "Längd"], ["d", "Bredd"], "h", "m"],
  "klostrad": [["h", "Höjd"], ["b", "Bredd"], "vn", "ml", "m"],
  "katthus": SMADJURSBURAR,
  "burar-klader-tillbehor": ["dj", ["b", "Längd"], ["d", "Bredd"], "h", "m"],
  "kaninburar-marsvinsburar": SMADJURSBURAR,
  "hamsterburar-gnagarburar": SMADJURSBURAR,
  "hundburar": [...BURAR, "eg:h"],
  "hundkojor": BURAR,
  "honshus-honsgardar": SMADJURSBURAR,
  "valphagar-hundhagar": BURAR,
  "terrarier": BURAR,
  "hundvagnar": ["ml", "kg", "m"],
  "hundbaddar-hundsoffor": [["b", "Längd"], ["d", "Bredd"], "m"],
  "kattlador": ["b", "h", "m"],
  "mat-vattenskalar": ["dj", "l", "m"],
  "selar-koppel-transport": ["dj", "ml", "m"],
  "lek-tillbehor-for-husdjur": DJURTILLBEHOR,

  // ── Barn & Familj ──
  "barn-familj": ["a", "ml", "eg:bf", "m"],
  "leksaker-spel": ["a", "eg:bf", "m"],
  "baby-smabarn": ["a", "ml", "eg:b", "m"],
  "elbilar-for-barn": BARNFORDON,
  "motorcyklar-for-barn": BARNFORDON,
  "sparkcyklar-for-barn": ["a", "ml", "m"],
  "gunghastar-gungdjur": ["a", "ml", "eg:b", "m"],
  "barnmobler": ["a", "h", "ml", "eg:j", "m"],
  "leksakskok": ["a", "h", "eg:b", "m"],
  "sandlador": ["b", "m"],

  // ── Sport & Fritid ──
  "sport-fritid": ["ml", "kg", "m"],
  "traning-gym": ["ml", "kg", "m"],
  "traningsbankar": ["ml", "kg", "m"],
  "motionscyklar": ["ml", "kg", "m"],
  "hantlar-hantelset": ["kg", "m"],
  "boxningssackar": ["kg", "h", "m"],
  "friluftsliv-resa": ["kg", "eg:vus", "m"],
  "bil-cykel": ["w", "ml", "kg", "eg:bl", "m"],

  // ── Kök & Husgeråd ──
  "kok-husgerad": ["w", "l", "b", "h", "eg:t", "m"],
  "koksmaskiner-apparater": APPARATER,
  "miniugnar-airfryers": APPARATER,
  "vattenkokare-brodrostar": ["l", "w"],
  "soptunnor": ["l", "b", "h", "eg:h", "m"],
  "koksoar-koksvagnar": VAGNAR,
  "serveringsvagnar-rullvagnar": VAGNAR,
  "vinstall-vinkylar": ["b", "h", "eg:l", "m"],
  "koksredskap-tillbehor": ["m"],
  "servering-glas": ["m"],

  // ── Elektronik (dold i Wix sedan 2026-09-30; raderna står kvar för gamla länkar) ──
  "elektronik-tillbehor": ["w", "eg:bf", "m"],
  "dator-gaming": ["ml", "b", "eg:l", "m"],
  "projektordukar": ["b", "eg:f"],

  // ── Kategoriflytten 2026-09-30 ──
  // Nya underkategorier med egen fråga, och de två nya avdelningarna. De nya
  // under Möbler, Hem och Husdjur som saknas här ärver sin förälder.
  "gamingstolar": STOLAR,
  "garderober-kladstall": SKAP,
  "smart-hem-sakerhet": ["w", "eg:bsf", "m"],
  "tvatt-stad": ["w", "l", "b", "h", "eg:h", "m"],
  "kyl-frys": ["l", "b", "h", "m"],
  "spel-bordsspel": ["b", "h", "m"],
  "bollsport": ["b", "h", "m"],
  "hobby-musik": ["b", "h", "m"],
  "jul-hogtider": PYNT,
  "verktyg-fordon": ["kg", "b", "h", "ml", "m"],
  "bil-slap": ["kg", "w", "b", "m"],
  "elbilsladdning-solenergi": ["w", "m"],

  // ── Skönhet & Hälsa ──
  "skonhet-halsa": ["ml", "w", "eg:bt", "m"],
  "massage-aterhamtning": ["ml", "w", "eg:bft", "m"],
  "massagebankar": ["ml", "b", "kg"],
};

/** Listor över hela sortimentet: inga måttfilter. */
const UTAN = new Set(["all-products", "alla-produkter", "rea", "populara", "ovrigt"]);

/**
 * Filtren kategorin erbjuder. `foraldrar` är kategorins förfäder, närmast
 * först — en underkategori utan egen rad ärver den närmaste som har en.
 */
export function facetterFor(slug: string, foraldrar: readonly string[] = []): FacettDef[] {
  if (UTAN.has(slug)) return [];
  const rad = KATEGORIER[slug] ?? foraldrar.map((f) => KATEGORIER[f]).find(Boolean);
  if (!rad) return [];
  return rad.map((r): FacettDef => {
    if (Array.isArray(r)) return { nyckel: r[0], namn: r[1] };
    const [nyckel, koder] = r.split(":") as [Nyckel, string | undefined];
    return koder ? { nyckel, namn: "", koder } : { nyckel, namn: "" };
  });
}

/** Alla slugs med egen rad — testet håller dem ärliga mot katalogen. */
export const KONFIGURERADE = Object.keys(KATEGORIER);
