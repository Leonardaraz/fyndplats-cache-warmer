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
 *
 * ⚠️ **Korta landsnamn kräver ordgränser.** De flesta mönstren är avsiktliga
 * delsträngar, för att fånga böjningsformer tvärs över tretton språk. Men tre
 * av dem är så korta att de bor inuti vanliga ord: `usa` i svenskans *ljusa*,
 * *ljusare* och spanskans *usar*; `fransa` i *fransar*; `peru` i
 * *superutrustad*. Svep 2026-08-26 hittade fyra publicerade recensioner som
 * fällts på just "ljusa" och "degusar" — riktiga omdömen som filtret hade
 * kastat vid import. De tre har därför `\b` i båda ändar.
 */
const FOREIGN_PLACE = new RegExp(
  [
    // Tjeckien
    "tjeckien", "czech", "tschechien", "chequia", "rep[uú]blica checa", "cechia", "czechy", "[cč]esk",
    // Frankrike
    "frankrike", "france", "francia", "frankreich", "francja", "franci[ae]", "\\bfransa\\b",
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
    // Kyrilliska landsnamn — recensioner på ryska/ukrainska skriver dem så, och
    // en ren latinsk lista missade "в германию" (till Tyskland), 2026-08-17.
    "герман", "німеччин", "франц", "іспан", "испан", "італі", "итали", "польщ",
    "польш", "чехі", "чехи", "румун", "латв", "литв", "естон", "грец", "болгар",
    "португал", "нідерланд", "нидерланд", "бельг", "австрі", "австри", "угорщ", "венгр",
    // Kina och övriga avsändarländer. Låg länge utanför listan helt, eftersom
    // avsändarlandet var tillåtet — se noten om Leonards beslut 2026-08-26.
    // Ordgränser krävs här: utan dem matchar "cina" spanskans cocina/piscina,
    // "chine" franskans machine och "cin" svenskans medicin.
    "\\bkina[ns]?\\b", "\\bchina\\b", "\\bchine\\b", "\\bcina\\b", "\\bchin(?:y|om|ami|ach)\\b", "\\b(?:z|do)\\s+chin\\b", "\\b[cč][ií]na\\b",
    "\\bk[ií]na\\b", "\\b[cç]in\\b", "кита", "中国", "hongkong", "hong kong",
    // Utanför Europa
    "\\busa\\b", "united states", "estados unidos", "kanada", "canada", "australien", "australia",
    "mexiko", "mexico", "m[eé]xico", "\\bper[uú]\\b", "turkiet", "turkey", "t[uü]rkiye",
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
 * ⚠️ **Avsändarland fälls numera också** (Leonards beslut 2026-08-26, ordagrant:
 * *"om någon nämner paket från kina eller frakt från ett annat land till att det
 * står vart man bor eller så, ska den bort"*). Fram till dess strippades "från
 * X" innan landkontrollen, med motiveringen att avsändarlandet stämmer även för
 * en svensk kund. Två saker talade emot: kunden köper av Fyndplats och ska inte
 * behöva läsa var lagret ligger — samma skäl som förbjuder avsändarland i
 * produkttexten (runbookens Steg 7) — och undantaget släppte igenom
 * "Versand aus China", som pekar rakt på dropshippingen. Kina saknades dessutom
 * i landlistan helt, eftersom det ändå aldrig kunde fälla.
 *
 * Medvetet TILLÅTET (det är inte samma sak):
 *   - fraktbolag: DPD, GLS m.fl. kör i Sverige också;
 *   - "kr"/"SEK";
 *   - Sverige nämnt — det är precis vad vi vill ha.
 */
export function foreignLocaleVerdict(text: string): ForeignLocaleVerdict {
  const t = (text ?? "").trim();
  if (!t) return { foreign: false };

  const land = t.match(FOREIGN_PLACE);
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
