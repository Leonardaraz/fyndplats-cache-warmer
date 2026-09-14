// Vad finns egentligen i Aosoms feed? — ren funktion, ingen IO.
//
// BAKGRUNDEN (2026-09-14). Vi har i månader sagt att "feedens EAN-kolumn är tom
// i 100 % av raderna", på en mätning från 27 augusti. Feeden uppdateras tre
// gånger om dygnet. Och värre: `parseAosomFeed` plockar bara de kolumner den
// känner till vid namn — `AosomRow` har inget EAN-fält alls — så även om Aosom
// fyllt i kolumnen igår hade vi inte sett det. Vi har aldrig tittat.
//
// ☠️ PRISKOLUMNERNA REDIGERAS BORT UR SVARET. Rutten som använder det här
// svarar in i en PUBLIK Actions-logg, och `Wholesale Price` är vårt inköpspris
// på 6 057 artiklar — det dyraste vi har att läcka. Kolumnen RÄKNAS (vi vill
// veta att den finns och är ifylld) men dess VÄRDEN lämnar aldrig servern.

/** Kolumner vars innehåll aldrig får lämna servern. Matchas skiftlägesokänsligt. */
export const PRISKOLUMNER = [
  "wholesale price",
  "normal price",
  "se ship fee",
  "shipping cost germany",
];

/**
 * Kolumner som bär en IDENTIFIERARE, inte en beskrivning.
 *
 * ☠️ ARTIKELNUMRET ÄR LIKA HEMLIGT SOM PRISET, och det var jag som missade det
 * (2026-09-14). Första versionen redigerade bara priskolumner, så tabellen
 * skrev feedens FÖRSTA artikelnummer till en publik Actions-summering. Numret
 * är exakt den sträng dealproffsen publicerar som sku/mpn — det hör hemma på
 * `supplierProductId` och ingen annanstans. Samma klass som den omergade
 * allowlisten som läckte inköpspris till samma sorts logg.
 */
const IDKOLUMNER = [
  "sku", "artikelnummer", "article", "item no", "item number",
  "reference", "referens", "model", "modell", "mpn", "psin",
  "ean", "gtin", "barcode", "upc", "url", "link", "länk",
];

/**
 * Ser värdet ut som ett Aosom-artikelnummer? (`845-030CG`, `83A-526V00RB`)
 *
 * ☠️ EN RYGGTÄCKNING PÅ FORMEN, inte bara på namnet. Döper Aosom om kolumnen
 * imorgon glider namnlistan — och en spärr man måste komma ihåg glöms bort,
 * vilket är precis vad `AliExpressProductId`-typen byggdes för att visa. Den
 * här kostar en regexp och kan inte glida.
 */
function serUtSomArtikelnummer(v: string): boolean {
  return /^[0-9A-Z]{3}-[0-9A-Z]{3,}/i.test(v.trim());
}

export interface FeedKolumn {
  namn: string;
  /** Hur många rader som har ett icke-tomt värde. */
  ifyllda: number;
  /** Ett exempelvärde — null för pris- och identifierarkolumner, som aldrig visas. */
  exempel: string | null;
}

export interface FeedInfo {
  rader: number;
  kolumner: FeedKolumn[];
  /** Finns en kolumn som ser ut att bära streckkod? */
  harEanKolumn: boolean;
  /** Hur många rader som har den ifylld. 0 = kolumnen finns men är tom. */
  eanIfyllda: number;
}

function arPriskolumn(namn: string): boolean {
  const n = namn.trim().toLowerCase();
  return PRISKOLUMNER.some((p) => n.includes(p)) || n.includes("price") || n.includes("cost");
}

/** Kolumner vars exempelvärde aldrig visas — pris ELLER identifierare. */
function arHemligKolumn(namn: string): boolean {
  const n = namn.trim().toLowerCase();
  return arPriskolumn(namn) || IDKOLUMNER.some((k) => n === k || n.includes(k));
}

function arEankolumn(namn: string): boolean {
  const n = namn.trim().toLowerCase();
  return n === "ean" || n.includes("ean13") || n.includes("gtin") || n.includes("barcode");
}

/** Delar en CSV-rad på komma, med hänsyn till citattecken. */
function delaRad(rad: string): string[] {
  const ut: string[] = [];
  let cell = "";
  let iCitat = false;
  for (let i = 0; i < rad.length; i++) {
    const c = rad[i];
    if (c === '"') {
      if (iCitat && rad[i + 1] === '"') {
        cell += '"';
        i++;
      } else iCitat = !iCitat;
    } else if (c === "," && !iCitat) {
      ut.push(cell);
      cell = "";
    } else cell += c;
  }
  ut.push(cell);
  return ut;
}

/**
 * Läser feedens rubrikrad och räknar hur full varje kolumn är.
 *
 * ⚠️ Den TOLKAR inte raderna som produkter. Poängen är att se vad som finns —
 * inklusive kolumner vår parser kastar bort — inte att bygga en andra parser
 * vid sidan av `parseAosomFeed`. En tvilling som glider isär är husets
 * vanligaste bugg, och den här funktionen får aldrig bli en.
 */
export function feedKolumner(csv: string): FeedInfo {
  const rader = csv.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rader.length === 0) {
    return { rader: 0, kolumner: [], harEanKolumn: false, eanIfyllda: 0 };
  }

  const rubriker = delaRad(rader[0]).map((h) => h.trim());
  const ifyllda = new Array(rubriker.length).fill(0);
  const exempel: Array<string | null> = new Array(rubriker.length).fill(null);

  for (let i = 1; i < rader.length; i++) {
    const celler = delaRad(rader[i]);
    for (let k = 0; k < rubriker.length; k++) {
      const v = (celler[k] ?? "").trim();
      if (!v) continue;
      ifyllda[k]++;
      if (exempel[k] === null && !arHemligKolumn(rubriker[k]) && !serUtSomArtikelnummer(v)) {
        exempel[k] = v.slice(0, 40);
      }
    }
  }

  const kolumner: FeedKolumn[] = rubriker.map((namn, k) => ({
    namn,
    ifyllda: ifyllda[k],
    exempel: arHemligKolumn(namn) ? null : exempel[k],
  }));

  const eanIdx = rubriker.findIndex(arEankolumn);
  return {
    rader: rader.length - 1,
    kolumner,
    harEanKolumn: eanIdx >= 0,
    eanIfyllda: eanIdx >= 0 ? ifyllda[eanIdx] : 0,
  };
}
