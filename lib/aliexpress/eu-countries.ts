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

/** Default-lista — ändras via env FYNDPLATS_EU_COUNTRIES vid behov. */
export const DEFAULT_EU_COUNTRIES = [
  "ES", // Spanien
  "DE", // Tyskland
  "CZ", // Tjeckien
  "PL", // Polen
  "FR", // Frankrike
  "IT", // Italien
  "NL", // Nederländerna
  "BE", // Belgien
  "GB", // Storbritannien (inte EU men nära/snabb shipping)
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
