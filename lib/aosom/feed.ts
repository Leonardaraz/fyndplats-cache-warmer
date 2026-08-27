// Aosoms B2B-datafeed: hämtning, tolkning och de två filter som avgör om en
// rad över huvud taget kan bli en produkt hos oss.
//
// Feeden är en ren CSV som uppdateras tre gånger om dygnet och listar allt som
// är B2B-säljbart just nu (artiklar med lågt saldo plockas bort av Aosom själva
// för att undvika översäljning). Kolumnnamnen är engelska, innehållet tyskt.
//
// TVÅ SAKER SOM ÖVERRASKAR NÄR MAN LÄSER FEEDEN FÖRSTA GÅNGEN:
//
// 1. `Psin` är INTE en variantgrupp. Det ser ut som en förälder-nyckel, och
//    frestelsen att gruppera på den är stor — men de tretton raderna under
//    24G58OVN9S001 är tretton OLIKA valphagar med olika antal paneler, olika
//    mått och priser från 55 till 119 €. Psin är en "relaterade varor"-klunga.
//    Grupperar man på den blir varianter av varor som inte är varianter, och
//    kunden får välja mellan produkter som inte är utbytbara. EN RAD = EN
//    PRODUKT, med en variant. Äkta färgvarianter finns (845-030CG mot
//    845-031CG) men de skiljer sig bara i SKU-suffixet, och att gissa fram
//    grupperingen ur ett suffix är samma sorts gissning som
//    mapping-repair.ts:s värdesignaturer — den som skriver fel pris till kund.
//
// 2. `Specification` och `Package list` är TOMMA i 5 550 av 5 566 säljbara
//    rader (0,3 % fyllnadsgrad). Spec-fliken kan alltså inte byggas ur dem.
//    Underlaget finns i stället i de strukturerade kolumnerna — Size, Color,
//    Material, vikt och paketmått — som är ifyllda i ~100 % av raderna. Se
//    to-product.ts#buildSpecifications.

import { parseCsvRecords } from "../bulk-import/csv";

/**
 * Feed-adressen från Aosoms beställningsguide. Uppdateras 3 ggr/dygn.
 *
 * ☠️ MÅSTE komma ur miljön. Ingen fallback i koden, och lägg aldrig tillbaka en.
 *
 * Adressen kräver ingen inloggning: en vanlig GET returnerar hela B2B-prislistan
 * med kolumnen "Wholesale Price" för 6 057 artiklar. Det här repot är PUBLIKT,
 * så en hårdkodad adress här är detsamma som att publicera vad vi betalar för
 * varje vara — för vem som helst, inklusive de svenska återförsäljare vi
 * konkurrerar med om exakt samma artikelnummer.
 */
export function aosomFeedUrl(): string {
  const url = (process.env.AOSOM_FEED_URL ?? "").trim();
  if (!url) {
    throw new Error(
      "AOSOM_FEED_URL saknas. Feedens adress bär våra inköpspriser och får inte "
      + "ligga i koden — sätt den som miljövariabel i Vercel.",
    );
  }
  return url;
}

/**
 * Fraktpriser på eller över det här beloppet är Aosoms sätt att säga "går inte
 * att skicka hit" — inte ett pris. Uppmätt: exakt 999,90 € på 5 rader, medan
 * nästa verkliga fraktpris uppifrån ligger under 200 €. Ett sådant "pris" skulle
 * ge en vara som kostar tiotusen kronor att skicka; den ska aldrig importeras.
 */
export const NO_SHIP_SENTINEL_EUR = 900;

export interface AosomRow {
  /** Aosoms artikelnummer, t.ex. "350-219V00PK". Vår nyckel mot leverantören. */
  sku: string;
  name: string;
  /** Produktsidan hos Aosom (kräver inloggat B2B-konto för att visa vårt pris). */
  url: string;
  imageUrls: string[];
  /** Aosoms egen kategoristig, t.ex. "Baby & Kind > Spielzeug > Kinderrollenspiele". */
  category: string;
  color: string;
  material: string;
  /** Produktens yttermått som fritext, t.ex. "79,5L x 33B x 90,7H cm". */
  size: string;
  /** Paketets mått, t.ex. "93.00x59.00x17.00 cm". */
  packageSize: string;
  weightKg: number | null;
  /** Tysk marknadsföringstext (HTML). Bär ofta platshållaren [BRAND NAME]. */
  descriptionHtml: string;
  /** Säljpunkter som <ul><li>… (HTML). */
  bulletsHtml: string;
  qty: number;
  /** Aosoms EGET tyska konsumentpris — referenspunkt, inte vår kostnad. */
  normalPriceEur: number | null;
  /** Vårt B2B-inköpspris, exklusive moms (bekräftat av Aosom). */
  wholesaleEur: number | null;
  /** Fraktpris till Sverige, per kolli. Skalar med vikten. */
  seFreightEur: number | null;
  /** 1-baserat radnummer i feeden — för felmeddelanden. */
  rowIndex: number;
}

/**
 * Tolkar hela feeden. Rader som saknar SKU hoppas över tyst — de kan inte
 * mappas mot något och är inte värda ett felmeddelande per stycke.
 */
export function parseAosomFeed(input: string): AosomRow[] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const records = parseCsvRecords(text, ",");
  if (records.length < 2) return [];

  const header = records[0].map((h) => h.trim().toLowerCase());
  const col = (name: string): number => header.indexOf(name.toLowerCase());
  const at = (rec: string[], name: string): string => {
    const i = col(name);
    return i >= 0 ? (rec[i] ?? "").trim() : "";
  };

  const rows: AosomRow[] = [];
  for (let i = 1; i < records.length; i++) {
    const rec = records[i];
    const sku = at(rec, "SKU");
    if (!sku) continue;
    rows.push({
      sku,
      name: at(rec, "Name"),
      url: at(rec, "URL"),
      imageUrls: collectImages(
        at(rec, "Image 1 Link"),
        at(rec, "Image 2 Link"),
        at(rec, "Image Additional Links"),
      ),
      category: at(rec, "Category"),
      color: at(rec, "Color"),
      material: at(rec, "Material"),
      size: at(rec, "Size"),
      packageSize: at(rec, "Size Package (LxWxH) in cm"),
      weightKg: parseNumber(at(rec, "Weight (incl. Package) in kg")),
      descriptionHtml: at(rec, "Description"),
      bulletsHtml: at(rec, "Bullet Points"),
      qty: Math.max(0, Math.trunc(parseNumber(at(rec, "Qty")) ?? 0)),
      normalPriceEur: parseNumber(at(rec, "Normal Price")),
      wholesaleEur: parseNumber(at(rec, "Wholesale Price")),
      seFreightEur: parseNumber(at(rec, "SE Ship Fee")),
      rowIndex: i,
    });
  }
  return rows;
}

/**
 * Går raden att importera? Tre villkor, alla nödvändiga:
 *   - saldo > 0 (Aosom plockar bort lågt saldo själva, men inte allt)
 *   - ett inköpspris finns
 *   - ett VERKLIGT fraktpris till Sverige finns (se NO_SHIP_SENTINEL_EUR)
 *
 * Notera att lönsamhet INTE ingår. Det är ett separat beslut — se
 * freightShare() — och att blanda ihop dem här skulle göra filtret omöjligt att
 * återanvända för "vad finns det egentligen i feeden?".
 */
export function isShippableToSe(row: AosomRow): boolean {
  return (
    row.qty > 0
    && row.wholesaleEur !== null
    && row.wholesaleEur > 0
    && row.seFreightEur !== null
    && row.seFreightEur > 0
    && row.seFreightEur < NO_SHIP_SENTINEL_EUR
  );
}

/** Landad kostnad i EUR: varan plus frakten hit. Båda exklusive moms. */
export function landedCostEur(row: AosomRow): number {
  return (row.wholesaleEur ?? 0) + (row.seFreightEur ?? 0);
}

/** Landad kostnad i SEK vid given kurs. Det är detta fält marginalen räknas ur. */
export function landedCostSek(row: AosomRow, eurToSek: number): number {
  return round2(landedCostEur(row) * eurToSek);
}

/**
 * Fraktens andel av den landade kostnaden, 0–1.
 *
 * Måttet finns för att en femtedel av feeden (1 175 artiklar) kostar MER att
 * skicka än att köpa. De går att importera — men de går inte att sälja med
 * marginal, och den som poleringskön skickar först ska veta det. Medianen över
 * hela feeden är 0,40.
 */
export function freightShare(row: AosomRow): number {
  const landed = landedCostEur(row);
  if (landed <= 0) return 0;
  return (row.seFreightEur ?? 0) / landed;
}

/**
 * Aosoms eget tyska hyllpris delat med vår landade kostnad — hur mycket
 * marginalutrymme raden bär innan vi ens satt ett svenskt pris. Median över
 * feeden är 1,88x. Null när referenspriset saknas.
 */
export function headroom(row: AosomRow): number | null {
  const landed = landedCostEur(row);
  if (!row.normalPriceEur || landed <= 0) return null;
  return round2(row.normalPriceEur / landed);
}

export async function fetchAosomFeed(
  url: string = aosomFeedUrl(),
  fetchImpl: typeof fetch = fetch,
): Promise<AosomRow[]> {
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Aosom-feeden svarade ${res.status} ${res.statusText}`);
  }
  return parseAosomFeed(await res.text());
}

/**
 * Slår ihop de tre bildkolumnerna och avduplicerar. Feeden upprepar ofta
 * "Image 2 Link" som första posten i "Image Additional Links" — utan
 * avdupliceringen får varje produkt samma foto två gånger i galleriet.
 */
function collectImages(first: string, second: string, additional: string): string[] {
  const all = [first, second, ...additional.split(",")];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of all) {
    const url = raw.trim();
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * Plockar ut talet ur ett feed-fält. Feeden skriver enheten efter värdet
 * ("57.18 EUR", "18.55 kg") och använder punkt som decimaltecken genomgående —
 * kontrollerat på alla 6 057 rader, noll komma-decimaler. Komma accepteras ändå
 * som decimaltecken ifall Aosom byter locale; tusentalsavgränsare finns inte i
 * feeden och stöds därför inte (de vore omöjliga att skilja från decimalkomma).
 */
function parseNumber(value: string): number | null {
  if (!value) return null;
  const m = value.replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
