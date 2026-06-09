// Deterministisk svensk översättning av variantaxlar ("Color", "Size") och
// vanliga variantvärden ("Red", "Black") vid import. INGA AI-anrop — ren
// uppslagstabell, $0 kostnad. Fallback är alltid råvärdet, så en okänd axel/
// värde lämnas oförändrad (ingen risk att tappa data).
//
// Två lookup-tabeller:
//   AXIS_TRANSLATIONS  — optionsnamn (axlar). Fullt match efter kolon-strip.
//   VALUE_TRANSLATIONS — optionsvärden. Fullt match, annars första-ord-match.
//
// Universella värden (S/M/L/XL, antal, mått som "10cm") lämnas avsiktligt
// oöversatta — de saknas i tabellen och faller därför tillbaka på råvärdet.

export const AXIS_TRANSLATIONS: Record<string, string> = {
  color: "Färg",
  colour: "Färg",
  size: "Storlek",
  sizes: "Storlek",
  material: "Material",
  pattern: "Mönster",
  style: "Stil",
  styles: "Stil",
  length: "Längd",
  width: "Bredd",
  height: "Höjd",
  diameter: "Diameter",
  thickness: "Tjocklek",
  capacity: "Kapacitet",
  volume: "Volym",
  quantity: "Antal",
  count: "Antal",
  number: "Antal",
  pcs: "Antal",
  pack: "Förpackning",
  package: "Förpackning",
  bundle: "Paket",
  set: "Set",
  type: "Typ",
  model: "Modell",
  version: "Version",
  variant: "Variant",
  shape: "Form",
  weight: "Vikt",
  voltage: "Spänning",
  power: "Effekt",
  wattage: "Effekt",
  effect: "Effekt",
  plug: "Kontakt",
  "plug type": "Kontakttyp",
  socket: "Uttag",
  shipping: "Frakt",
  "ships from": "Skickas från",
  "ship from": "Skickas från",
  origin: "Ursprung",
  flavor: "Smak",
  flavour: "Smak",
  taste: "Smak",
  scent: "Doft",
  fragrance: "Doft",
  design: "Design",
  edition: "Utgåva",
  specification: "Specifikation",
  spec: "Specifikation",
  option: "Alternativ",
  options: "Alternativ",
  bust: "Byst",
  waist: "Midja",
  hip: "Höft",
  hips: "Höft",
  gender: "Kön",
  age: "Ålder",
  season: "Säsong",
  connector: "Anslutning",
  interface: "Anslutning",
  memory: "Minne",
  storage: "Lagring",
  resolution: "Upplösning",
  finish: "Finish",
  texture: "Textur",
  feature: "Egenskap",
};

export const VALUE_TRANSLATIONS: Record<string, string> = {
  // --- Färger ---
  red: "Röd",
  blue: "Blå",
  black: "Svart",
  white: "Vit",
  green: "Grön",
  yellow: "Gul",
  pink: "Rosa",
  purple: "Lila",
  violet: "Lila",
  orange: "Orange",
  brown: "Brun",
  grey: "Grå",
  gray: "Grå",
  silver: "Silver",
  gold: "Guld",
  golden: "Guld",
  beige: "Beige",
  navy: "Marinblå",
  "navy blue": "Marinblå",
  turquoise: "Turkos",
  cyan: "Turkos",
  mint: "Mintgrön",
  "mint green": "Mintgrön",
  rose: "Rosé",
  ivory: "Elfenben",
  khaki: "Khaki",
  burgundy: "Vinröd",
  wine: "Vinröd",
  "wine red": "Vinröd",
  coffee: "Kaffebrun",
  champagne: "Champagne",
  transparent: "Transparent",
  clear: "Transparent",
  multicolor: "Flerfärgad",
  multicolour: "Flerfärgad",
  colorful: "Flerfärgad",
  "light blue": "Ljusblå",
  "dark blue": "Mörkblå",
  "sky blue": "Himmelsblå",
  "royal blue": "Kungsblå",
  "light pink": "Ljusrosa",
  "hot pink": "Cerise",
  "light green": "Ljusgrön",
  "dark green": "Mörkgrön",
  "army green": "Armégrön",
  "light grey": "Ljusgrå",
  "light gray": "Ljusgrå",
  "dark grey": "Mörkgrå",
  "dark gray": "Mörkgrå",
  "rose gold": "Roséguld",
  "light purple": "Ljuslila",
  "dark purple": "Mörklila",
  // --- Material ---
  cotton: "Bomull",
  wool: "Ull",
  silk: "Siden",
  linen: "Linne",
  polyester: "Polyester",
  nylon: "Nylon",
  plastic: "Plast",
  metal: "Metall",
  leather: "Läder",
  "pu leather": "PU-läder",
  "genuine leather": "Äkta läder",
  suede: "Mocka",
  wood: "Trä",
  bamboo: "Bambu",
  glass: "Glas",
  ceramic: "Keramik",
  rubber: "Gummi",
  silicone: "Silikon",
  "stainless steel": "Rostfritt stål",
  steel: "Stål",
  iron: "Järn",
  aluminum: "Aluminium",
  aluminium: "Aluminium",
  copper: "Koppar",
  brass: "Mässing",
  velvet: "Sammet",
  canvas: "Kanvas",
  denim: "Denim",
  acrylic: "Akryl",
  // --- Vanliga adjektiv/övrigt ---
  small: "Liten",
  medium: "Mellan",
  large: "Stor",
  "extra large": "Extra stor",
  default: "Standard",
  standard: "Standard",
  classic: "Klassisk",
  round: "Rund",
  square: "Fyrkantig",
  oval: "Oval",
  matte: "Matt",
  glossy: "Blank",
  men: "Herr",
  women: "Dam",
  unisex: "Unisex",
  kids: "Barn",
  child: "Barn",
  adult: "Vuxen",
  summer: "Sommar",
  winter: "Vinter",
  spring: "Vår",
  autumn: "Höst",
  fall: "Höst",
  // Sverige-tema (dyker upp i AE-titlar för svenska butiker)
  sweden: "Sverige",
  swedish: "Svensk",

  // --- Sammanbindande ord (för token-vis översättning av sammansatta värden,
  //     t.ex. "Black with LED" → "Svart med LED") ---
  with: "med",
  without: "utan",
  and: "och",

  // --- Djur (vanliga i barn-/husdjursprodukter) ---
  lion: "Lejon",
  elephant: "Elefant",
  rabbit: "Kanin",
  bunny: "Kanin",
  tiger: "Tiger",
  cow: "Ko",
  penguin: "Pingvin",
  fox: "Räv",
  squirrel: "Ekorre",
  skunk: "Skunk",
  raccoon: "Tvättbjörn",
  koala: "Koala",
  monkey: "Apa",
  pig: "Gris",
  crocodile: "Krokodil",
  duck: "Anka",

  // --- Mat / smaker ---
  doughnut: "Munk",
  donut: "Munk",
  watermelon: "Vattenmelon",
  carrot: "Morot",
  bone: "Ben",
  soymilk: "Sojamjölk",
  "lychee berry": "Litchibär",
  "chestnut cocoa": "Kastanj & kakao",
  "green grape": "Gröna druvor",
  "sesame bean": "Sesam & böna",
  "sea salt coconut": "Havssalt & kokos",
  "chicken leg": "Kycklingben",

  // --- Instrument ---
  trumpet: "Trumpet",
  maracas: "Maracas",
  castanets: "Kastanjetter",
  xylophone: "Xylofon",
  drum: "Trumma",

  // --- Kontakttyper (värden) ---
  "eu plug": "EU-kontakt",
  "us plug": "USA-kontakt",
  "uk plug": "UK-kontakt",
  "au plug": "AU-kontakt",

  // --- Övriga vanliga engelska värden / fraser ---
  camera: "Kamera",
  cloud: "Moln",
  camouflage: "Kamouflage",
  "touchscreen model": "Pekskärmsmodell",
  "baby monitor": "Babyvakt",
  "ice cream machine": "Glassmaskin",
  "coffee machine": "Kaffemaskin",
  "coffe machine": "Kaffemaskin",
  "kitchen utensils": "Köksredskap",
  "makeup set": "Sminkset",
  "kitchen set": "Köksset",
  "adventure suit": "Äventyrsdräkt",
  "with dual light": "Med dubbelt ljus",
  "random color 1 pc": "Slumpmässig färg, 1 st",
  // färgnyanser / beskrivande som inte redan finns ovan
  long: "Lång",
  "deep blue": "Mörkblå",
  skyblue: "Himmelsblå",
  "rose red": "Rosenröd",
  "reddish brown": "Rödbrun",
  "ginger yellow": "Ingefärsgul",
  "leather pink": "Läderrosa",
  "long rose red": "Lång rosenröd",
  "sakula pink": "Körsbärsrosa",
  "d white": "Vit",
  bown: "Brun", // vanlig AE-stavfel av "brown"

  // --- Paritet med storefront-ordboken (lib/option-i18n.ts): exakta fraser ur
  //     katalogen som annars bara delvis översätts token-vis. Säkra (matchar
  //     hela värden / kapas inte upp). Håll dessa i synk med frontend-ordboken. ---
  model: "Modell",
  pc: "st",
  pcs: "st",
  // Enheter: tum för inch (token-vis → "100 inch" → "100 tum"). Görs vid import så
  // värdet är svenskt FRÅN START — i V3 speglar choice.name den låsta choice.key:en,
  // så att döpa om värdet i efterhand fastnar inte och riskerar leverantörs-mappningen.
  inch: "tum",
  inches: "tum",
  "s-shaped": "S-formad",
  "y-shaped": "Y-formad",
  "1 tunnels": "1 tunnel",
  "4 tunnels": "4 tunnlar",
  "type-c to usb-a": "Type-C till USB-A",
  "type-c to type-c": "Type-C till Type-C",
  "gym 1": "Gym 1",
  "gym with tent": "Gym med tält",
  "gym with pendent": "Gym med hänge",
  "gym with pendent 2": "Gym med hänge 2",
  "doctor toy with box": "Doktorsleksak med låda",
  "doctor toy no box": "Doktorsleksak utan låda",
  "farm stacking toy": "Stapelleksak bondgård",
  "bunny pacifier chain": "Napphållare kanin",
  "rain tube": "Regnrör",
  "knock drum": "Knacktrumma",
  "triangle bell": "Triangel",
  "moon castanets": "Kastanjetter, måne",
  "leaf maracas": "Maracas, löv",
  "squirrel maracas": "Maracas, ekorre",
  "eighth xylophone": "Xylofon (8 toner)",
  "five xylophone": "Xylofon (5 toner)",
  "seven xylophone": "Xylofon (7 toner)",
  "5 pc cup": "5 koppar",
  "5 pc set": "5-delars set",
  "4pc sets": "4-delars set",
  "9pc cup set": "9-delars koppset",
  "10pc cup set": "10-delars koppset",
  "5pc sets 1": "5-delars set 1",
  "5pc sets 2": "5-delars set 2",
  "5pc sets 3": "5-delars set 3",
  "5pc sets 4": "5-delars set 4",
  "5pc sets 5": "5-delars set 5",
  "5pc sets 6": "5-delars set 6",
  "1 st mysteri box": "1 st mysterieask",
  "6 st mysteri box": "6 st mysterieask",
  "1pc 8mp poe camera": "1 st 8MP POE-kamera",
  "1pcs 5mp poe camera": "1 st 5MP POE-kamera",
  "2pcs 5mp poe camera": "2 st 5MP POE-kamera",
  "2pcs 8mp poe camera": "2 st 8MP POE-kamera",
  "3pcs 5mp poe camera": "3 st 5MP POE-kamera",
  "3pcs 8mp poe camera": "3 st 8MP POE-kamera",

  // --- Utökning: fler vanliga AE-variantord → svenska, så att halv-engelska
  //     värden ("100 inch", "With Battery", "1 Pair") inte slinker igenom.
  //     ALLA poster här är token-säkra: ord vars svenska översättning är
  //     entydig oavsett kontext. Tvetydiga adjektiv (deep/light/dark/free,
  //     left/right, wide) UTELÄMNAS medvetet — de krockar med färg-/vinkel-
  //     fraser ("Deep Red", "Right Angle", "Wide Angle") och skulle ge FEL
  //     översättning, vilket är värre än ett kvarvarande engelskt ord.
  //
  // Enheter (token-vis; "6 feet" → "6 fot"). cm/mm lämnas orörda (samma på
  // svenska); inch/inches finns redan ovan.
  feet: "fot",
  foot: "fot",
  // Antal/förpackning (kompletterar pc/pcs ovan). "1 Pair" → "1 par" — vanligt
  // för handskar/strumpor/örhängen.
  pair: "par",
  pairs: "par",
  // Universalstorlek (FULLT match → ingen token-uppdelning, så "free"/"one"
  // översätts aldrig löst — bara i dessa fasta fraser).
  "free size": "Universalstorlek",
  "one size": "Universalstorlek",
  onesize: "Universalstorlek",
  "plus size": "Plusstorlek",
  // Tillbehör ("With X"-värden). "with"→"med" finns redan, så "With Battery"
  // → "Med Batteri" (innehållsord behåller sin versal). Höga-frekvens-substantiv.
  battery: "Batteri",
  charger: "Laddare",
  cable: "Kabel",
  holder: "Hållare",
  mount: "Fäste",
  bracket: "Fäste",
  strap: "Rem",
  screen: "Skärm",
  lens: "Lins",
  // "remote" läggs som HEL fras, inte löst ord: "Fjärrkontroll" rymmer redan
  // "control", så ett löst "remote" hade gjort "Remote Control" → "Fjärrkontroll
  // Control" (dubblerat/fel). Som fras träffar bara exakt "Remote Control".
  "remote control": "Fjärrkontroll",
  // Kvalificerare (token-säkra adjektiv; entydiga oavsett efterföljande ord).
  foldable: "Hopfällbar",
  portable: "Bärbar",
  adjustable: "Justerbar",
  waterproof: "Vattentät",
  wireless: "Trådlös",
  rechargeable: "Uppladdningsbar",
  upgraded: "Uppgraderad",
  regular: "Standard",
  thick: "Tjock",
  thin: "Tunn",

  // --- Fäll-fixar (audit 2026-06): ord som ovan översätts token-vis till en
  //     FÄRG/SÄSONG men i dessa fasta fraser betyder något annat. Som HEL fras
  //     vinner de över token-uppdelningen, så "Spring Steel" blir "Fjäderstål"
  //     i stället för "Vår Stål". Råa engelska bakgrunden står kvar (spring→Vår
  //     osv.) för sina giltiga färg-/säsongs-användningar. ---
  "spring steel": "Fjäderstål", // spring(fjäder) ≠ Vår(säsong)
  "wine glass": "Vinglas", // wine(dryck) ≠ Vinröd(färg)
  "bone china": "Benporslin", // material, inte "ben"
  "coffee maker": "Kaffebryggare", // apparat, inte Kaffebrun(färg)
  "coffee cup": "Kaffekopp",
  "iron box": "Strykjärn", // apparat, inte Järn(material)
  "steam iron": "Ångstrykjärn",

  // --- LED-färgtemperatur (mycket vanlig AE-kategori). Fasta fraser så de blir
  //     HELT svenska ("Warm White" → "Varmvit", inte token-vis "Warm Vit"). ---
  "warm white": "Varmvit",
  "cool white": "Kallvit",
  "natural white": "Naturvit",
  "neutral white": "Neutralvit",
  "warm light": "Varmt ljus",
  "cool light": "Kallt ljus",
  "white light": "Vitt ljus",
};

/**
 * Översätter ett axelnamn (optionsnamn). Strippar ev. ":"-suffix
 * ("Color: F2025" → "Color") och normaliserar till gemener före uppslag.
 * Faller tillbaka på råvärdet om axeln inte finns i tabellen.
 */
export function translateAxisName(raw: string): string {
  const key = normalizeAxisKey(raw);
  const hit = AXIS_TRANSLATIONS[key];
  if (hit) return hit;
  // Färg-aktiga axelnamn AE skickar utöver rena "Color" ("Color Name", "Color
  // Family", "Main Color", "Colour Classification" …) → samma färg-pipeline, så
  // den befintliga omklassningen/AI-namngivningen fångar dem när värdena INTE är
  // färger. "colorful"/"tricolor" matchar ej (ordgräns kring color/colour).
  if (/\bcolou?rs?\b/.test(key)) return "Färg";
  return raw.trim();
}

/**
 * Normaliserar ett axelnamn till uppslagsnyckel: trim + gemener + strip av ev.
 * ":"-suffix ("Color: F2025" → "color"). Delas av translateAxisName och
 * axisNameUnresolved så de alltid bedömer samma nyckel.
 */
export function normalizeAxisKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[:：].*$/, "")
    .trim();
}

/**
 * True om en axel-ETIKETT fortfarande är det råa engelska AE-namnet — dvs varken
 * statiska tabellen, färg-igenkänningen, en deterministisk klass eller AI gav den
 * ett svenskt namn. En tabell-träff räknas som löst (även self-map som
 * "Material"→"Material") → inga falska positiva på svensk-stavade lånord. Används
 * för att flagga produkten (needsAiPolish) i stället för att skeppa ett engelskt
 * axelnamn till kund. Tar slutnamnet så att en redan omklassad/översatt axel
 * (finalName ≠ rånamnet) alltid räknas som löst.
 */
export function axisNameUnresolved(rawAxis: string, finalName: string): boolean {
  if (finalName.trim() !== rawAxis.trim()) return false; // översatt/omklassat → ok
  const key = normalizeAxisKey(rawAxis);
  if (AXIS_TRANSLATIONS[key] !== undefined) return false; // känt namn (self-map ok)
  if (/\bcolou?rs?\b/.test(key)) return false; // färg-aktig → "Färg" via LAYER A
  return true; // kvar som rå engelska → flagga
}

// --- Mått-/storleksdetektering (för felmärkta "Color"-axlar) ----------------

// Värde som ENBART är ett mått: "42 in", "50 inch", "10 cm", `12"`.
const MEASUREMENT_VALUE_RE =
  /^\d+(?:[.,]\d+)?\s*(?:inches|inch|in|tum|cm|mm|ft|feet|["“”])$/i;
// Rent storleks-label: S/M/L/XL-skalan, ord och universalstorlek.
const SIZE_LABEL_RE =
  /^(?:xxs|xs|s|m|l|xl|xxl|xxxl|[2-9]xl|small|medium|large|x-?large|free\s?size|one\s?size|onesize|plus\s?size)$/i;

/**
 * True om SAMTLIGA värden på en axel ser ut som storlekar/mått (tum/cm/S–XL …)
 * och inga är färger. AE-säljare lägger ofta storlekar under "Color"-fältet
 * ("Color: 42 in"); detta upptäcker det så importen kan döpa om axeln till
 * "Storlek" (se buildTranslatorFromBase). Konservativt — kräver att ALLA värden
 * är storlekslika, så en riktig färg bland värdena avbryter omdöpningen.
 */
export function isSizeLikeAxis(values: ReadonlyArray<string>): boolean {
  const vals = values.map((v) => v.trim()).filter(Boolean);
  if (vals.length === 0) return false;
  return vals.every((v) => MEASUREMENT_VALUE_RE.test(v) || SIZE_LABEL_RE.test(v));
}

// Övriga icke-färg-klasser som AE-säljare lägger under "Color"-fältet (utöver
// storlekar). Varje regex matchar ett HELT värde i sin klass; omdöpningen kräver
// att SAMTLIGA värden matchar samma klass → aldrig en falsk positiv på en färg.
const PLUG_RE = /\bplug\b/i; // "EU Plug", "With US Plug"
const COUNT_RE = /^(?:\d+\s*(?:pcs?|pieces?|packs?|pairs?|sets?)|(?:set|pack)\s+of\s+\d+)\s*$/i; // HELA värdet = antal ("2 PCS", "Set of 3"); "2 PCS Red" (blandat m. färg) matchar ej → kvar som "Färg"
const VOLTAGE_RE = /^\d+\s*v(?:olt)?s?$/i; // "110V", "220 Volt"
const STORAGE_RE = /^\d+\s*[gtm]b$/i; // "64GB", "1TB"
const VOLUME_RE = /^\d+(?:[.,]\d+)?\s*(?:ml|cl|dl|l|lit(?:er|re)s?)$/i; // "500ml", "1.5L"

/**
 * Bästa svenska axelnamn för en axel som översatts till "Färg" men vars värden
 * INTE är färger — AE-säljare lägger ofta storlekar/kontakter/antal/spänning osv.
 * under produktens "Color"-fält (så kunden annars ser "Färg: 42 in"). Returnerar
 * ett namn BARA när samtliga värden entydigt tillhör EN icke-färg-klass (positiv
 * matchning, aldrig "frånvaro av färg") → inga falska positiva på riktiga färger.
 * null = behåll "Färg" (säkert; täcker äkta + exotiska färger). Medvetet
 * konservativt: hellre kvar som "Färg" än en gissad etikett.
 */
export function inferMislabeledColorAxis(values: ReadonlyArray<string>): string | null {
  const vals = values.map((v) => v.trim()).filter(Boolean);
  if (vals.length === 0) return null;
  if (isSizeLikeAxis(vals)) return "Storlek";
  if (vals.every((v) => PLUG_RE.test(v))) return "Kontakt";
  if (vals.every((v) => COUNT_RE.test(v))) return "Antal";
  if (vals.every((v) => VOLTAGE_RE.test(v))) return "Spänning";
  if (vals.every((v) => STORAGE_RE.test(v))) return "Lagring";
  if (vals.every((v) => VOLUME_RE.test(v))) return "Volym";
  return null;
}

/**
 * Normaliserar tum-enheter i ett värde till svenska "tum" — nummer-ankrat, så ett
 * löst "in" (preposition) ALDRIG rörs: "42 inch"/`42"` → "42 tum". Bart "in"
 * konverteras bara när HELA värdet är "<tal> in" ("42 in" → "42 tum"), så
 * "5 in 1"/"5 in stock" lämnas orörda. cm/mm/fot är samma på svenska.
 */
function normalizeUnits(value: string): string {
  let v = value
    .replace(/(\d)\s*inches\b/gi, "$1 tum")
    .replace(/(\d)\s*inch\b/gi, "$1 tum")
    .replace(/(\d)\s*["“”]/g, "$1 tum");
  const bare = v.trim().match(/^(\d+(?:[.,]\d+)?)\s*in$/i);
  if (bare) v = `${bare[1]} tum`;
  return v;
}

/**
 * Översätter ett optionsvärde. Prioritet:
 *   1. Fullt match (hela värdet) → full översättning ("Light Blue" → "Ljusblå").
 *   2. Första-ord-match → översätt bara första ordet ("Pink Diamond" → "Rosa
 *      Diamond"), resten lämnas orört.
 *   3. Inget match → råvärdet ("5XL" → "5XL").
 * Universella storlekar (S/M/L/XL) och antal finns inte i tabellen och faller
 * därför alltid på steg 3.
 */
export function translateValue(raw: string): string {
  const trimmed = normalizeUnits(raw.trim());
  const full = VALUE_TRANSLATIONS[trimmed.toLowerCase()];
  if (full) return full;

  // Token-vis: översätt VARJE känt ord (inte bara det första) så sammansatta
  // värden blir helt svenska: "Black with LED" → "Svart med LED", "Long Blue"
  // → "Lång blå", "33-Grey" → "33-Grå". Separatorer (mellanslag/bindestreck)
  // bevaras. Okända ord (koder, mått, modellnamn som "iPhone 15") lämnas orörda
  // → hela värdet faller tillbaka på råvärdet om inget ord kändes igen.
  let touched = false;
  const out = trimmed
    .split(/([\s-]+)/)
    .map((tok) => {
      if (/^[\s-]*$/.test(tok)) return tok;
      const hit = VALUE_TRANSLATIONS[tok.toLowerCase()];
      if (hit) {
        touched = true;
        return hit;
      }
      return tok;
    })
    .join("");
  if (!touched) return trimmed;
  // Normalisera ev. dubbla mellanslag (rörig AE-data) och versalisera första
  // bokstaven (bindeord i tabellen är gemena: "med", "och").
  const norm = out.replace(/\s+/g, " ").trim();
  return norm.charAt(0).toUpperCase() + norm.slice(1);
}

/**
 * Returnerar de tokens i ett RÅVÄRDE som den statiska tabellen INTE kunde
 * översätta och som ser ut som riktig engelska — dvs en bra signal på att värdet
 * fortfarande är (halv-)engelskt. Tomt = värdet är (fullt) hanterat av tabellen.
 *
 * Detektionen körs på RÅVÄRDET (engelska) mot tabellen, inte på utdata, så
 * giltig svenska (t.ex. "Vit", "Stor") aldrig flaggas. En token räknas som
 * engelska om den är ≥3 rena ASCII-bokstäver, inte en akronym/kod i versaler
 * (LED/USB/POE/XXL) och saknas i tabellen. Mått/siffror/koder ("5XL", "33",
 * "B6AC", "KM-6631") matchar inte → flaggas aldrig.
 *
 * Används av variant-ai-translate.ts för att (a) välja vilka värden som skickas
 * till AI-fallbacken och (b) flagga produkter med kvarvarande engelska för
 * polering.
 */
export function residualEnglishTokens(raw: string): string[] {
  const trimmed = raw.trim();
  if (VALUE_TRANSLATIONS[trimmed.toLowerCase()]) return []; // fullt match → hanterat
  const out: string[] = [];
  for (const tok of trimmed.split(/[\s-]+/)) {
    if (!/^[A-Za-z]{3,}$/.test(tok)) continue; // kod/siffra/mått/för kort
    if (tok === tok.toUpperCase()) continue; // akronym/kod i versaler (LED, USB, XXL)
    if (VALUE_TRANSLATIONS[tok.toLowerCase()]) continue; // tabellen översätter token
    out.push(tok);
  }
  return out;
}

/**
 * Översätter ett helt optionsrecord (axel→värde) från en variant. Både nyckeln
 * (axelnamn) och värdet översätts. Används i import-pipelinen så att Wix-options
 * OCH variantval blir konsekvent svenska (de måste matcha varandra exakt).
 */
export function translateVariantOptions(
  options: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(options)) {
    out[translateAxisName(name)] = translateValue(value);
  }
  return out;
}

/**
 * Remappar färgkods-tabellen { [axelnamn]: { [val]: "#hex" } } till samma
 * översatta nycklar som translateVariantOptions producerar. Utan detta skulle
 * swatch-uppslaget i deriveOptions missa (tabellen är keyad på engelska
 * råvärden men options/val är nu svenska).
 */
export function translateOptionColorCodes(
  colorCodes: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [axis, valueMap] of Object.entries(colorCodes)) {
    const translatedAxis = translateAxisName(axis);
    const translatedValues: Record<string, string> = {};
    for (const [value, hex] of Object.entries(valueMap)) {
      translatedValues[translateValue(value)] = hex;
    }
    out[translatedAxis] = { ...(out[translatedAxis] ?? {}), ...translatedValues };
  }
  return out;
}

/**
 * Kollisions-SÄKER översättare för EN produkts varianter.
 *
 * Problem: translateValue mappar olika råvärden till samma svenska sträng
 * ("dark blue" + "deep blue" → båda "Mörkblå", "navy" + "navy blue" → "Marinblå").
 * Om en produkt har BÅDA som distinkta varianter kollapsar de till EN choice i
 * deriveOptions (Set) → två Wix-varianter med identisk options-kombination → Wix
 * slår ihop/avvisar → tappad variant + mappning utan wixVariantId (lager/pris/
 * fulfillment trasig för den varianten).
 *
 * Lösning: bygg EN gång per produkt en raw→översatt-karta per axel som garanterar
 * att distinkta råvärden får distinkta översatta värden (andra+ kollisionen får
 * "(råvärde)"-suffix; chatten kan polera namnet senare). SAMMA karta används för
 * variantoptions, colorCodes och swatch-bilder → nycklarna matchar alltid.
 */
export interface VariantTranslator {
  /** Översätter en variants options (axel→värde) kollisions-säkert. */
  options(raw: Record<string, string>): Record<string, string>;
  /** Remappar en axel→värde→T-tabell (colorCodes/swatch-bilder) med SAMMA nycklar. */
  axisKeyedMap<T>(map: Record<string, Record<string, T>>): Record<string, Record<string, T>>;
  /** Rå-axel → slutgiltigt svenskt axelnamn (efter ev. omklassning/AI-override).
   *  Källa för polerings-flaggan via axisNameUnresolved/unresolvedAxisNames. */
  axisNames: ReadonlyMap<string, string>;
  /** Axlar som fick ett kollisions-särskiljande suffix (t.ex. "Färg (Color
   *  Temperature)") — inget kund-klart namn → flaggas för polering. */
  disambiguatedAxes: ReadonlySet<string>;
}

/**
 * Synkron, deterministisk översättare (enbart statisk tabell). Publik API som
 * används när AI-fallbacken är av. Tunn wrapper över buildTranslatorFromBase.
 */
export function buildVariantTranslator(
  variants: ReadonlyArray<{ options: Record<string, string> }>,
): VariantTranslator {
  return buildTranslatorFromBase(variants, translateValue, translateAxisName);
}

/**
 * Kollisions-säker översättare byggd från en INJICERAD bas-översättning. Den
 * statiska tabellen (translateValue) är default; AI-fallbacken (variant-ai-
 * translate.ts) skickar in en baseValue som slår upp Claude-översatta värden
 * först och faller tillbaka på tabellen. Kollisions-/disambig-logiken är
 * IDENTISK oavsett bas → ingen variant-kollaps, oavsett källa.
 */
export function buildTranslatorFromBase(
  variants: ReadonlyArray<{ options: Record<string, string> }>,
  baseValue: (raw: string) => string,
  baseAxis: (axis: string) => string = translateAxisName,
  /**
   * Per-rå-axel AI-namn för felmärkta "Color"-axlar som de deterministiska
   * klasserna inte fångar (variant-ai-translate.ts skickar in det). Deterministisk
   * klass vinner alltid; override används bara när klassen är okänd.
   */
  axisOverrides?: ReadonlyMap<string, string>,
): VariantTranslator {
  // Råvärden per råaxel i stabil först-sedd-ordning.
  const rawValuesByAxis = new Map<string, string[]>();
  for (const v of variants) {
    for (const [axis, value] of Object.entries(v.options ?? {})) {
      const arr = rawValuesByAxis.get(axis) ?? [];
      if (!arr.includes(value)) arr.push(value);
      rawValuesByAxis.set(axis, arr);
    }
  }
  // Per axel: raw→unik översatt värde + raw-axel→översatt-axel.
  const axisName = new Map<string, string>();
  const usedAxisNames = new Set<string>();
  const disambiguatedAxes = new Set<string>();
  const valueByAxis = new Map<string, Map<string, string>>();
  // Stabil ordning för kollisions-tie-break: vilken axel som BEHÅLLER det rena
  // namnet vid en namn-kollision avgörs på sorterat rå-axelnamn, INTE på feed-
  // ordningen. AE:s SKU-prop-ordning är inte kontraktuellt stabil — utan detta kunde
  // två kolliderande axlar byta vilken som blir suffix-särskild mellan importer och
  // driva isär Wix-namnen (V3-key-låset). Sorterat → samma resultat varje gång.
  const orderedAxes = [...rawValuesByAxis].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  for (const [axis, values] of orderedAxes) {
    // Felmärkt "Color"-axel: AE-säljare lägger ofta storlekar/kontakter/antal osv.
    // under färg-fältet ("Color: 42 in"). Blev axeln "Färg"? → 1) deterministisk
    // klass om ALLA värden matchar en (Storlek/Kontakt/Antal/… , gratis), annars
    // 2) ev. AI-föreslaget namn (okända klasser/material), annars 3) kvar som "Färg"
    // (säkert; täcker äkta + exotiska färger). deriveOptions släpper redan swatchen
    // för icke-färgaxlar (isColorAxis); detta fixar det missvisande NAMNET.
    let resolvedAxis = baseAxis(axis);
    if (resolvedAxis === "Färg") {
      resolvedAxis = inferMislabeledColorAxis(values) ?? axisOverrides?.get(axis) ?? "Färg";
    } else if (axisNameUnresolved(axis, resolvedAxis)) {
      // Icke-färg-axel vars namn fortfarande är rå engelska (tabell-miss, t.ex.
      // "Lighting Mode") → använd ev. AI-översatt namn; annars kvar (flaggas sen).
      // Guarden gör att en ren "Storlek" ALDRIG kan skrivas över av ett strö-svar.
      resolvedAxis = axisOverrides?.get(axis) ?? resolvedAxis;
    }
    // Axel-namn-kollisionssäkerhet (spegel av per-värde-logiken nedan): två
    // DISTINKTA råaxlar får aldrig samma svenska namn. Den breda färg-igenkänningen
    // (LAYER A) kan annars mappa både "Color" och "Color Temperature"/"Color Name"
    // till "Färg" (och två axlar kan landa på samma klass, t.ex. "Color Size" +
    // "Size" → "Storlek"). Utan särskiljning skriver out[tAxis] över sig själv i
    // options() → en hel variantdimension tappas → varianter kollapsar →
    // wixVariantId-desync. AI ger oftast ett distinkt namn; detta är skyddsnätet när
    // den inte gör det (råaxeln i suffix, sen löpnummer). Deterministiskt (stabil
    // axel-ordning) så V3-key-låset inte rubbas mellan importer.
    if (usedAxisNames.has(resolvedAxis)) {
      let t = `${resolvedAxis} (${axis.trim()})`;
      for (let n = 2; usedAxisNames.has(t); n++) t = `${resolvedAxis} ${n}`;
      resolvedAxis = t;
      disambiguatedAxes.add(axis); // ej kund-klart namn → flaggas för polering
    }
    usedAxisNames.add(resolvedAxis);
    axisName.set(axis, resolvedAxis);
    const used = new Set<string>();
    const m = new Map<string, string>();
    for (const raw of values) {
      const base = baseValue(raw);
      let t = base;
      if (used.has(t)) {
        // Kollision: särskilj med råvärdet; om även det är upptaget, löpnummer.
        // Loopa tills strängen är FRI — annars kan disambig-formen själv krocka
        // (t.ex. ett råvärde som bokstavligen heter "Mörkblå 2", eller whitespace-
        // varianter av samma färg) och unikheten brytas.
        t = `${base} (${raw.trim()})`;
        for (let n = 2; used.has(t); n++) t = `${base} ${n}`;
      }
      used.add(t);
      m.set(raw, t);
    }
    valueByAxis.set(axis, m);
  }
  const tAxis = (axis: string) => axisName.get(axis) ?? baseAxis(axis);
  const tValue = (axis: string, value: string) => valueByAxis.get(axis)?.get(value) ?? baseValue(value);
  return {
    axisNames: axisName,
    disambiguatedAxes,
    options(raw) {
      const out: Record<string, string> = {};
      for (const [axis, value] of Object.entries(raw ?? {})) out[tAxis(axis)] = tValue(axis, value);
      return out;
    },
    axisKeyedMap<T>(map: Record<string, Record<string, T>>) {
      const out: Record<string, Record<string, T>> = {};
      for (const [axis, valueMap] of Object.entries(map ?? {})) {
        const ta = tAxis(axis);
        const inner: Record<string, T> = {};
        for (const [value, x] of Object.entries(valueMap)) inner[tValue(axis, value)] = x;
        out[ta] = { ...(out[ta] ?? {}), ...inner };
      }
      return out;
    },
  };
}

/**
 * Rå-axlar vars SLUTNAMN inte är kund-klart: antingen fortfarande rå engelska
 * (tabell-miss utan omklassning/override) ELLER ett kollisions-särskiljande suffix
 * (två axlar ville ha samma namn). Delas av AI- och sync-vägen för att flagga
 * needsAiPolish — garantin att ingen produkt skeppas med ett engelskt/felmärkt namn.
 */
export function unresolvedAxisNames(
  translator: Pick<VariantTranslator, "axisNames" | "disambiguatedAxes">,
): string[] {
  const out: string[] = [];
  for (const [raw, final] of translator.axisNames) {
    if (axisNameUnresolved(raw, final) || translator.disambiguatedAxes.has(raw)) out.push(raw);
  }
  return out;
}
