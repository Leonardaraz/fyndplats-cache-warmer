// EU/närliggande warehouse-länder som ger snabb leverans (3–7 dagar) till
// kunder i Sverige. Används för att flagga AliExpress-produkter med
// "ships from EU"-status så vi kan prioritera dem i import + på sajten.
//
// Konfigurerbarhet: kan utökas via FYNDPLATS_EU_COUNTRIES (komma-separerad lista
// med ISO-3166-1 alpha-2-koder) — gör att vi kan testa/utesluta länder utan
// kodändring. UK ingår i defaultlistan eftersom flera "EU"-warehouses
// faktiskt är UK-lager med snabb shipping inom västra Europa.
//
// AliExpress kan ange shipFrom på olika sätt:
//   - 2-bokstavskod ISO-3166 ("ES", "DE", "CN")
//   - Hela ordet ("Spain", "China")
//   - Stadsnamn ("Madrid")
// Vi normaliserar i `normalizeShipFromCode()`.

/**
 * Default-lista — ändras via env FYNDPLATS_EU_COUNTRIES vid behov.
 *
 * MÅSTE hållas i synk med tilläggets extension/eu-countries.js (FP_EU.EU_CODES).
 * Det är två modulsystem (browser-global vs TS-import) så de kan inte dela fil,
 * men listorna ska vara identiska. Tidigare hade den här bara 9 länder medan
 * tilläggets sök-sida körde 27 → en SE/DK-lager-produkt klassades som EU i
 * discover men icke-EU i import/popup. Nu är alla samma 27 EU/EES-warehouse-
 * länder (EU-medlemmar + EES (NO) + GB för snabba UK-lager).
 */
export const DEFAULT_EU_COUNTRIES = [
  "ES", // Spanien
  "PL", // Polen
  "CZ", // Tjeckien
  "DE", // Tyskland
  "FR", // Frankrike
  "IT", // Italien
  "NL", // Nederländerna
  "BE", // Belgien
  "SE", // Sverige
  "DK", // Danmark
  "FI", // Finland
  "AT", // Österrike
  "GB", // Storbritannien (inte EU men nära/snabb shipping)
  "IE", // Irland
  "PT", // Portugal
  "GR", // Grekland
  "NO", // Norge (EES)
  "HU", // Ungern
  "RO", // Rumänien
  "SK", // Slovakien
  "SI", // Slovenien
  "HR", // Kroatien
  "BG", // Bulgarien
  "LT", // Litauen
  "LV", // Lettland
  "EE", // Estland
  "LU", // Luxemburg
] as const;

/** Returnerar aktuell EU-lista (env override → default). Versaler. */
export function getEuCountries(): string[] {
  const env = process.env.FYNDPLATS_EU_COUNTRIES;
  if (!env || !env.trim()) return [...DEFAULT_EU_COUNTRIES];
  return env
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Mappar fritext / lands-/stadsnamn → ISO-3166-1 alpha-2. AliExpress
 * lägger ibland in landsnamn ("Spain") eller stadsnamn ("Madrid") istället
 * för en kod. Vi täcker de vanligaste warehouses som är aktuella för EU-
 * filterringen; okänd input returneras oförändrad i versaler så caller
 * fortfarande får jämförbart värde att lagra.
 */
const NAME_TO_CODE: Record<string, string> = {
  // Länder
  SPAIN: "ES", ESPANA: "ES", ESPAÑA: "ES",
  GERMANY: "DE", DEUTSCHLAND: "DE",
  "CZECH REPUBLIC": "CZ", CZECHIA: "CZ",
  POLAND: "PL", POLSKA: "PL",
  FRANCE: "FR",
  ITALY: "IT", ITALIA: "IT",
  NETHERLANDS: "NL", HOLLAND: "NL",
  BELGIUM: "BE",
  "UNITED KINGDOM": "GB", UK: "GB", BRITAIN: "GB", ENGLAND: "GB",
  SWEDEN: "SE", DENMARK: "DK", FINLAND: "FI", NORWAY: "NO",
  AUSTRIA: "AT", IRELAND: "IE", PORTUGAL: "PT", GREECE: "GR",
  HUNGARY: "HU", ROMANIA: "RO", SLOVAKIA: "SK", SLOVENIA: "SI",
  CROATIA: "HR", BULGARIA: "BG", LITHUANIA: "LT", LATVIA: "LV",
  ESTONIA: "EE", LUXEMBOURG: "LU",
  CHINA: "CN",
  "UNITED STATES": "US", USA: "US",
  RUSSIA: "RU",
  TURKEY: "TR",
  // Vanliga AliExpress-warehouse-städer
  MADRID: "ES", BARCELONA: "ES",
  BERLIN: "DE", HAMBURG: "DE",
  PRAGUE: "CZ", PRAHA: "CZ",
  WARSAW: "PL", WARSZAWA: "PL",
  PARIS: "FR",
  MILAN: "IT", MILANO: "IT", ROME: "IT", ROMA: "IT",
  AMSTERDAM: "NL",
  BRUSSELS: "BE",
  LONDON: "GB",
};

export function normalizeShipFromCode(raw: unknown): string {
  if (!raw) return "";
  const str = String(raw).trim().toUpperCase();
  if (!str) return "";
  // Redan en 2-bokstavskod
  if (/^[A-Z]{2}$/.test(str)) return str;
  // Hela namnet → mappa
  if (NAME_TO_CODE[str]) return NAME_TO_CODE[str];
  // Långa strängar — leta efter en känd token i texten
  for (const [name, code] of Object.entries(NAME_TO_CODE)) {
    if (str.includes(name)) return code;
  }
  return str; // okänd — behåll versaler så jämförelser blir konsekventa
}

/** True om koden tillhör vår EU-lista (case-insensitive). */
export function isEuCountry(code: string): boolean {
  if (!code) return false;
  const eu = getEuCountries();
  return eu.includes(code.toUpperCase());
}

/**
 * EU:S TULLUNION — de 27 medlemsstaterna, varken fler eller färre.
 *
 * INTE samma sak som `isEuCountry` ovan, och skillnaden är hela poängen.
 * `isEuCountry` svarar på "kommer paketet fram snabbt?" och räknar därför in
 * GB och NO — brittiska och norska lager skickar på 3–7 dagar till Sverige.
 * Den här listan svarar på "kan vi köpa in därifrån utan tull?", och där är
 * svaret nej för båda: Storbritannien lämnade tullunionen, Norge har aldrig
 * varit med. Ett paket därifrån till en svensk kund betyder tulldeklaration,
 * importmoms och förseningar — kostnader som äter marginalen på en hel produkt
 * utan att synas någonstans i vår bokföring.
 *
 * Skillnaden åt andra hållet också: CY och MT saknas i `DEFAULT_EU_COUNTRIES`
 * (de har sällan AE-lager) men är fullvärdiga medlemmar och hör hemma här.
 *
 * REGELN, kort: allt som VÄLJER ett lager att köpa från använder den här
 * listan. Allt som beskriver LEVERANSTID för kunden (EU-lager-ribbonen,
 * discover-filtret, warehouseClass) använder `isEuCountry`. Blandar man ihop
 * dem köper man in från Storbritannien i tron att det är inrikes EU-handel —
 * exakt det Leonard fångade 2026-08-21 på SucceBuy-klädstället, där tilläggets
 * "EU-först" bockade i GB-rader åt honom.
 */
export const EU_CUSTOMS_UNION: ReadonlySet<string> = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
]);

/** True om koden är ett EU-tullunionsland — det vi FÅR köpa in från tullfritt. */
export function isEuCustomsUnion(code: string): boolean {
  if (!code) return false;
  return EU_CUSTOMS_UNION.has(String(code).toUpperCase());
}

/** Returnerar true om någon av koderna är EU. */
export function hasAnyEuWarehouse(codes: readonly string[]): boolean {
  return codes.some((c) => isEuCountry(c));
}

/**
 * Klassificerar en lista shipFrom-koder till "EU" | "CN" | "MIXED" | "UNKNOWN".
 * Används både för Wix custom-field och för UI-badges.
 */
export type WarehouseClass = "EU" | "CN" | "MIXED" | "UNKNOWN";

export function classifyWarehouses(codes: readonly string[]): WarehouseClass {
  const normalized = codes.map((c) => c.toUpperCase()).filter(Boolean);
  if (normalized.length === 0) return "UNKNOWN";
  const hasEu = normalized.some((c) => isEuCountry(c));
  const hasNonEu = normalized.some((c) => !isEuCountry(c));
  if (hasEu && hasNonEu) return "MIXED";
  if (hasEu) return "EU";
  return "CN"; // alla icke-EU-warehouses behandlas som "långsam shipping"
}

/** Unika, normaliserade koder. */
export function uniqueShipFromCodes(rawCodes: readonly unknown[]): string[] {
  const set = new Set<string>();
  for (const raw of rawCodes) {
    const code = normalizeShipFromCode(raw);
    if (code) set.add(code);
  }
  return [...set].sort();
}
