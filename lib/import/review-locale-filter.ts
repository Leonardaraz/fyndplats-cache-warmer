// lib/import/review-locale-filter.ts
//
// Sållar bort recensioner som avslöjar att köparen finns i ett ANNAT land.
//
// Bakgrund (Leonards rapport 2026-08-16): första omgången importerade omdömen
// innehöll "Kom snabbt till Tjeckien" och "Leveransen till Frankrike gick mycket
// snabbt". På en svensk produktsida läser det som att texten hör hemma någon
// annanstans — kunden ser direkt att omdömet inte gäller en leverans hit.
//
// Vi tar bort dem i stället för att skriva om dem. Att ändra "Tjeckien" till
// "Sverige" vore att förfalska ett kundomdöme, och det gör vi inte. Bortfallet
// är litet: 11 av 127 i den första mätningen.
//
// Filtret tittar på ORIGINALTEXTEN, före översättning. Två skäl: det sparar
// översättning på rader vi ändå kastar, och landsnamn/valutor är lätta att
// känna igen tvärs över språk. Det körs dessutom på den svenska texten när
// sådan finns, som andra chans.

/**
 * Landsnamn på de språk recensionerna faktiskt kommer på (uppmätt: EN, ES, PT,
 * FR, IT, DE, PL, CS, NL, HU, TR, RU, UK). Listan är avsiktligt bred på de
 * länder AliExpress-köpare oftast skriver från.
 *
 * Sverige finns INTE med — en recension som nämner Sverige är precis vad vi vill ha.
 */
const FOREIGN_PLACE = new RegExp(
  [
    // Tjeckien
    "tjeckien", "czech", "tschechien", "chequia", "rep[uú]blica checa", "cechia", "czechy", "[cč]esk",
    // Frankrike
    "frankrike", "france", "francia", "frankreich", "francja", "franci[ae]", "fransa",
    // Polen
    "polen", "poland", "pologne", "polonia", "pols[kc]\\w*", "polonya",
    // Spanien
    "spanien", "spain", "espa[nñ]a", "espagne", "spagna", "hiszpani", "[sš]pan[eě]lsk",
    // Rumänien
    "rum[aä]nien", "romania", "roumanie", "rom[aâ]nia", "rumunia",
    // Italien
    "italien", "italy", "italia", "italie", "w[lł]och",
    // Tyskland
    "tyskland", "germany", "deutschland", "alemania", "allemagne", "germania", "niemcy", "n[eě]mecko",
    // Nederländerna / Belgien
    "nederl[aä]nderna", "netherlands", "holland", "nederland", "pa[ií]ses bajos", "belgien", "belgium", "belgi[eëqu]",
    // Portugal / Brasilien
    "portugal", "brasilien", "brazil", "brasil",
    // Grekland, Ungern, Slovakien, Bulgarien, Kroatien
    "grekland", "greece", "grecia", "ungern", "hungary", "magyarorsz[aá]g", "w[eę]gry",
    "slovakien", "slovakia", "slovensk", "bulgarien", "bulgaria", "b[uă]lgar",
    "kroatien", "croatia", "hrvatsk", "croazia",
    // Baltikum, Ukraina, Ryssland
    "litauen", "lithuania", "lietuv", "lettland", "latvia", "estland", "estonia",
    "ukraina", "ukraine", "укра", "ryssland", "russia", "росси",
    // Utanför Europa
    "usa", "united states", "estados unidos", "kanada", "canada", "australien", "australia",
    "mexiko", "mexico", "m[eé]xico", "peru", "per[uú]", "turkiet", "turkey", "t[uü]rkiye",
    "irland", "ireland", "irlanda", "[oö]sterrike", "austria", "[oö]sterreich",
  ].join("|"),
  "i",
);

/**
 * Prisbelopp i annan valuta än kronor. En svensk kund som läser "kostade mig
 * 70 €" ser lika tydligt som vid ett landsnamn att omdömet inte gäller en
 * leverans hit. `kr`/`SEK` är alltså tillåtet.
 */
// OBS: \b fungerar inte efter "ł" (icke-ASCII räknas inte som ordtecken), och
// "euro" skrivs böjt på flera språk ("Euronen"). Därför stammar i stället.
const FOREIGN_MONEY =
  /(\d[\d\s.,]*\s*(?:€|£|\$|z[łl]|PLN|EUR\w*|euro\w*|USD|GBP|K[čc]\b|Ft\b|lei\b|leva\b|грн)|(?:€|£|\$)\s*\d)/i;

/** Tull/moms vid import — gäller inte en kund som handlar från EU-lager. */
const CUSTOMS = /f[oö]rtull|tullavgift|customs (?:fee|duty|charge)|douane|z[oó][lł]|zollgeb|c[ií]nk|розмитн|vat charge/i;

/** Andra marknadsplatser — avslöjar att köpet gjordes någon annanstans. */
const MARKETPLACE = /\b(allegro|amazon|ebay|temu|otto\.de|cdiscount|bol\.com|mercadolibre)\b/i;

/** "manualen är på franska" och liknande — placerar köparen i ett annat språkområde. */
const FOREIGN_MANUAL =
  /(?:p[aå]|in|en|auf|w|na)\s+(?:franska|tyska|italienska|spanska|polska|tjeckiska|french|german|italian|spanish|polish|czech|fran[cç]ais|deutsch|italiano|espa[nñ]ol|polsku|[cč]e[sš]tin)/i;

export interface ForeignLocaleVerdict {
  foreign: boolean;
  /** Vilken regel som slog till — för loggning och admin. */
  reason?: "land" | "valuta" | "tull" | "marknadsplats" | "språk";
  /** Den matchande texten, ordagrant. */
  match?: string;
}

/**
 * Avgör om recensionen placerar köparen i ett annat land än Sverige.
 *
 * Medvetet TILLÅTET (det är inte samma sak):
 *   - avsändarland: "snabb frakt från Polen" stämmer även för en svensk kund,
 *     eftersom varorna skickas från EU-lager;
 *   - fraktbolag: DPD, GLS m.fl. kör i Sverige också;
 *   - "kr"/"SEK".
 */
export function foreignLocaleVerdict(text: string): ForeignLocaleVerdict {
  const t = (text ?? "").trim();
  if (!t) return { foreign: false };

  // Avsändarland först — "från Polen" ska INTE fällas, medan "till Polen" ska.
  const withoutOrigin = t.replace(
    /\b(?:fr[aå]n|from|de(?:sde)?|da|dal|aus|von|z|ze|od|iz|з|из)\s+[A-ZÅÄÖ][\wåäöéèü-]+/gi,
    " ",
  );

  const land = withoutOrigin.match(FOREIGN_PLACE);
  if (land) return { foreign: true, reason: "land", match: land[0] };

  const pengar = t.match(FOREIGN_MONEY);
  if (pengar) return { foreign: true, reason: "valuta", match: pengar[0].trim() };

  const tull = t.match(CUSTOMS);
  if (tull) return { foreign: true, reason: "tull", match: tull[0] };

  const marknad = t.match(MARKETPLACE);
  if (marknad) return { foreign: true, reason: "marknadsplats", match: marknad[0] };

  const sprak = t.match(FOREIGN_MANUAL);
  if (sprak) return { foreign: true, reason: "språk", match: sprak[0] };

  return { foreign: false };
}

/** Bekvämlighet: true när recensionen ska sållas bort. */
export function mentionsForeignDelivery(text: string): boolean {
  return foreignLocaleVerdict(text).foreign;
}
