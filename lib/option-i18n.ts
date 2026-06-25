// Svensk översättning av produktalternativ (option-namn + choice-värden).
//
// VARFÖR detta finns på frontend och inte i Wix:
// Wix Stores V3 lagrar choice-värdena (t.ex. "Blue", "EU Plug") som immutable
// fält — API:t vägrar byta namn på dem (det skulle kräva att man raderar +
// återskapar varje val, vilket ger nya choiceId:n och bryter varianter + lagda
// ordrar). Värdena importeras från AliExpress och är ofta engelska. Den enda
// säkra vägen att visa svenska är därför att översätta VISNINGSsträngen här,
// medan den interna matchningen (variantId, colorOf, variantbilder) fortsatt
// körs på det engelska RÅvärdet. Detta täcker hela sajten + alla framtida
// importer automatiskt. (Wix-kassan visar fortfarande råvärdet — Wix-låsning.)
//
// Designprincip: gradvis nedbrytning. Okända värden lämnas oförändrade, så en
// missad term blir kvar på engelska i stället för att bli fel.

// Värden som ska LÄMNAS som de är (enligt Leonards val):
//  - telefonmodeller (officiella modellnamn)
//  - tryckt text / ord-berlocker (texten står PÅ produkten)
const KEEP_AS_IS = new Set([
  "love", "hope", "luck", "loyalty", "happiness", "serenity", "hidden",
  "hehe", "ququ", "zizi", "dada", "baba", "sisi", "duoduo", "tofee", "original",
]);

// Hela fraser (gemener som nyckel) → svensk översättning. För uttryck som inte
// bryts ned token-för-token på ett bra sätt.
const PHRASES: Record<string, string> = {
  // färgnyanser
  "sky blue": "Himmelsblå", "skyblue": "Himmelsblå", "deep blue": "Mörkblå",
  "army green": "Armégrön", "light gray": "Ljusgrå", "light grey": "Ljusgrå",
  "reddish brown": "Rödbrun", "rose red": "Rosenröd", "long rose red": "Lång rosenröd",
  "ginger yellow": "Ingefärsgul", "sakula pink": "Körsbärsrosa", "leather pink": "Läderrosa",
  "pink-green": "Rosa-grön", "purple-green": "Lila-grön", "d white": "Vit",
  "random color 1 pc": "Slumpmässig färg, 1 st",
  // smaker
  "lychee berry": "Litchibär", "chestnut cocoa": "Kastanj & kakao",
  "green grape": "Gröna druvor", "sesame bean": "Sesam & böna",
  "sea salt coconut": "Havssalt & kokos", "soymilk": "Sojamjölk", "coffee": "Kaffe",
  // leksaker / set / maskiner
  "coffe machine": "Kaffemaskin", "ice cream machine": "Glassmaskin",
  "adventure suit": "Äventyrsdräkt", "makeup set": "Sminkset", "kitchen set": "Köksset",
  "kitchen utensils": "Köksredskap", "doctor toy with box": "Doktorsleksak med låda",
  "doctor toy no box": "Doktorsleksak utan låda", "farm stacking toy": "Stapelleksak bondgård",
  "baby monitor": "Babyvakt", "with dual light": "Med dubbelt ljus",
  "bunny pacifier chain": "Napphållare kanin", "chicken leg": "Kycklingben",
  "gym": "Gym", "gym 1": "Gym 1", "gym with tent": "Gym med tält",
  "gym with pendent": "Gym med hänge", "gym with pendent 2": "Gym med hänge 2",
  "touchscreen model": "Pekskärmsmodell",
  // instrument
  "rain tube": "Regnrör", "moon castanets": "Kastanjetter, måne",
  "squirrel maracas": "Maracas, ekorre", "leaf maracas": "Maracas, löv",
  "triangle bell": "Triangel", "knock drum": "Knacktrumma",
  "eighth xylophone": "Xylofon (8 toner)", "five xylophone": "Xylofon (5 toner)",
  "seven xylophone": "Xylofon (7 toner)",
  // form / antal
  "s-shaped": "S-formad", "y-shaped": "Y-formad", "1 tunnels": "1 tunnel",
  "4 tunnels": "4 tunnlar", "5 pc cup": "5 koppar", "5 pc set": "5-delars set",
  "4pc sets": "4-delars set", "9pc cup set": "9-delars koppset",
  "10pc cup set": "10-delars koppset",
  // kontakttyper
  "eu plug": "EU-kontakt", "us plug": "USA-kontakt", "uk plug": "UK-kontakt",
  "au plug": "AU-kontakt", "type-c to usb-a": "Type-C till USB-A",
  "type-c to type-c": "Type-C till Type-C",
  // kameror / set / mysteri (Npc/Npcs är tvetydigt — exakta fraser är säkrast)
  "1pc 8mp poe camera": "1 st 8MP POE-kamera", "1pcs 5mp poe camera": "1 st 5MP POE-kamera",
  "2pcs 5mp poe camera": "2 st 5MP POE-kamera", "2pcs 8mp poe camera": "2 st 8MP POE-kamera",
  "3pcs 5mp poe camera": "3 st 5MP POE-kamera", "3pcs 8mp poe camera": "3 st 8MP POE-kamera",
  "5pc sets 1": "5-delars set 1", "5pc sets 2": "5-delars set 2", "5pc sets 3": "5-delars set 3",
  "5pc sets 4": "5-delars set 4", "5pc sets 5": "5-delars set 5", "5pc sets 6": "5-delars set 6",
  "1 st mysteri box": "1 st mysterieask", "6 st mysteri box": "6 st mysterieask",
};

// Enstaka engelska ord → svenska. Tillämpas token-för-token på det som blir kvar
// efter fras-matchning. Nyckel i gemener.
const WORDS: Record<string, string> = {
  // färger
  blue: "blå", green: "grön", red: "röd", black: "svart", grey: "grå", gray: "grå",
  pink: "rosa", purple: "lila", yellow: "gul", white: "vit", brown: "brun",
  bown: "brun", // vanlig AliExpress-stavfel
  // djur
  lion: "lejon", elephant: "elefant", rabbit: "kanin", tiger: "tiger", cow: "ko",
  penguin: "pingvin", fox: "räv", squirrel: "ekorre", skunk: "skunk",
  raccoon: "tvättbjörn", koala: "koala", monkey: "apa", pig: "gris",
  crocodile: "krokodil", duck: "anka", bone: "ben", carrot: "morot", cloud: "moln",
  // instrument / mat
  drum: "trumma", trumpet: "trumpet", maracas: "maracas", castanets: "kastanjetter",
  xylophone: "xylofon", doughnut: "munk", watermelon: "vattenmelon", coffee: "kaffe",
  camera: "kamera",
  // storlek / övrigt
  large: "stor", small: "liten", camouflage: "kamouflage",
  // sammanbindande / beskrivande
  with: "med", without: "utan", and: "och", to: "till", for: "för",
  pcs: "st", pc: "st", model: "modell", long: "lång", deep: "mörk", light: "ljus",
  dark: "mörk", set: "set", sets: "set",
};

// ── Tum → cm ───────────────────────────────────────────────────────────────
// Lägg till en cm-konvertering efter ett tum-mått, för svensk visning.
//   "62 tum"        → "62 tum (157 cm)"
//   "62-65 tum"     → "62-65 tum (157-165 cm)"   (intervall, delad enhet)
// 1 tum = 2.54 cm, avrundat till närmaste hela cm (Math.round).
//
// Robust + idempotent enligt filens nedbrytnings-filosofi:
//  - Hittas inget tum-mått lämnas strängen oförändrad (kastar aldrig).
//  - Innehåller strängen redan "cm" (oavsett versaler) returneras den ORÖRD
//    (aldrig dubbel-konvertering) — täcker katalogens "42x42 tum (≈107 × 107 cm)".
//  - "tum" matchas BARA som fristående enhetstoken direkt efter ett tal, aldrig
//    inuti ett annat ord ("tumme" = thumb lämnas i fred) och aldrig utan tal före.
//  - Dimensioner (NxN / "N tum x N tum" m.fl.) lämnas helt orörda — att
//    konvertera en enda axel vore vilseledande, och katalogens dimensionsvärden
//    bär redan sin egen (≈ … cm).
const INCH_TO_CM = 2.54;

function inchToCm(numStr: string): number | null {
  // Decimaltecken kan vara punkt ELLER komma ("65.5" / "15,6").
  const n = parseFloat(numStr.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * INCH_TO_CM) : null;
}

export function appendCmToInch(s: string): string {
  const str = typeof s === "string" ? s : "";
  if (!str) return s;

  // Idempotent: redan en cm-siffra någonstans → rör inget.
  if (/cm/i.test(str)) return str;

  // Enhetstoken: svenska "tum", engelska "inch"/"in", eller tum-symbolen (").
  const UNIT = String.raw`(?:tum|inch|in|")`;
  // Mått: heltal eller decimal (punkt eller komma).
  const NUM = String.raw`\d+(?:[.,]\d+)?`;
  // Intervall-separator: bindestreck, tankstreck, em-streck, figurstreck eller
  // minustecken (alla varianter av "–"), valfria mellanslag runt.
  const RANGE_SEP = String.raw`\s*[-–—‒−]\s*`;

  // Tal (+ valfritt intervall) → valfritt enskilt mellanslag → enhet, där enheten
  // är en fristående token (inte följd av bokstav/siffra, så "tumme" missas).
  const re = new RegExp(
    `(${NUM})(?:(${RANGE_SEP})(${NUM}))?(\\s?)(${UNIT})(?![\\p{L}\\d])`,
    "iu",
  );
  const m = re.exec(str);
  if (!m) return str;

  // Hoppa över DIMENSIONER (NxN, "N x N tum", "N tum x N tum" …): att konvertera
  // bara en axel vore vilseledande → lämna hela strängen orörd.
  if (/[\d.,]["']?\s*[x×]\s*["']?[\d.,]/i.test(str)) return str;
  const afterIdx = m.index + m[0].length;
  if (/^\s*[x×]\s*\d/i.test(str.slice(afterIdx))) return str;

  // "in" som antal, inte tum: "4 in 1 …" (token-gränsen släpper igenom "in 1").
  if (m[5].toLowerCase() === "in" && /^\s+\d/.test(str.slice(afterIdx))) {
    return str;
  }

  const cm1 = inchToCm(m[1]);
  if (cm1 === null) return str;

  let cmText: string;
  if (m[3] !== undefined) {
    const cm2 = inchToCm(m[3]);
    if (cm2 === null) return str;
    cmText = `${cm1}-${cm2} cm`;
  } else {
    cmText = `${cm1} cm`;
  }

  return `${str.slice(0, afterIdx)} (${cmText})${str.slice(afterIdx)}`;
}

function capLike(src: string, translated: string): string {
  // Behåll ursprungstokenens versal-mönster (första bokstav).
  if (src && src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}

function looksLikeKeep(s: string): boolean {
  const t = s.trim();
  if (/iphone|ipad|airpods/i.test(t)) return true;        // telefonmodeller
  if (KEEP_AS_IS.has(t.toLowerCase())) return true;        // ord-berlocker
  if (/^[A-Z]{2,}\d/.test(t)) return true;                 // koder typ KID110, B88168
  if (/^(km-|f5 |b6ac|imax|msss|f\d{6,})/i.test(t)) return false; // koder MED färgord → låt token-steget ta färgen
  return false;
}

/** Översätt ett enskilt choice-värde till svenska (visning). Råvärdet ska INTE
 *  skickas hit förrän all intern matchning/bildhydrering är klar. */
export function swedishChoiceValue(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return raw;
  if (looksLikeKeep(raw)) return appendCmToInch(raw);

  const phrase = PHRASES[raw.toLowerCase()];
  if (phrase) return appendCmToInch(phrase);

  // Token-för-token: dela på mellanslag och bindestreck men behåll separatorerna.
  let touched = false;
  const out = raw.split(/([\s-]+)/).map((tok) => {
    if (/^[\s-]+$/.test(tok) || tok === "") return tok;
    const hit = WORDS[tok.toLowerCase()];
    if (hit) { touched = true; return capLike(tok, hit); }
    return tok;
  }).join("");
  // Sista steget (efter all svensk översättning): lägg på cm efter tum-mått.
  return appendCmToInch(touched ? out : raw);
}

// Option-NAMN: nästan alla är redan svenska i katalogen; bara ett fåtal engelska.
const OPTION_NAMES: Record<string, string> = {
  "color": "Färg", "colour": "Färg", "size": "Storlek", "input/output": "In/Ut",
  "socket standard": "Uttagsstandard", "länd": "Längd",
};

/** Översätt option-namnet (t.ex. "Color" → "Färg"). Pass-through för svenska. */
export function swedishOptionName(name: string): string {
  const raw = (name || "").trim();
  return OPTION_NAMES[raw.toLowerCase()] || raw;
}
