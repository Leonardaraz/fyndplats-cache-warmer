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
  dinosaur: "Dinosaurie",
  bear: "Björn",

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
  short: "Kort",
  "deep blue": "Mörkblå",
  skyblue: "Himmelsblå",
  "rose red": "Rosenröd",
  "reddish brown": "Rödbrun",
  "ginger yellow": "Ingefärsgul",
  "leather pink": "Läderrosa",
};

/**
 * Översätter ett axelnamn (optionsnamn). Strippar ev. ":"-suffix
 * ("Color: F2025" → "Color") och normaliserar till gemener före uppslag.
 * Faller tillbaka på råvärdet om axeln inte finns i tabellen.
 */
export function translateAxisName(raw: string): string {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[:：].*$/, "")
    .trim();
  return AXIS_TRANSLATIONS[key] ?? raw.trim();
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
  const trimmed = raw.trim();
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
  // Versalisera första bokstaven (bindeord i tabellen är gemena: "med", "och").
  return out.charAt(0).toUpperCase() + out.slice(1);
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
