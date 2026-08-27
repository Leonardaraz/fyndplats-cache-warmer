// Adapter: en rad ur Aosoms B2B-feed → pipelinens AliExpressProduct.
//
// Poängen med att gå den här vägen i stället för att skriva en egen importväg är
// att ALLT nedströms redan är byggt och testat: prissättning, marginalregler,
// bildhemtagning, Wix-create, SKU-generering, mappningsrad, utkastläget,
// poleringskön. Aosom-importen behöver bara tala samma språk.
//
// Typen heter fortfarande AliExpressProduct av arvsskäl. Den beskriver i praktiken
// "en leverantörsprodukt på väg in" och har inget AE-specifikt i sig.

import type { AliExpressProduct } from "../import/types";
import { landedCostEur, type AosomRow } from "./feed";
import { SUPPLIER_VAT_RATE } from "../auction/seed";

/**
 * Vilka bildpositioner som hämtas hem, 1-indexerat i feedens egen ordning.
 *
 * MÄTT 2026-08-27 på 30 produkter (tio ur vardera tredjedel av feeden) och 269
 * handgranskade bilder. 125 av dem — 46 % — bär TYSK TEXT INBRÄND i pixlarna
 * ("HOCHWERTIGES MATERIAL", "Empfohlenes Alter: 3-8 Jahre"). Den går inte att
 * polera bort, och en svensk produktsida kan inte visa den.
 *
 * Andelen rena bilder per position:
 *
 *   pos 1  30/30   ← huvudbild, ren i SAMTLIGA
 *   pos 2  30/30   ← livsstilsbild, ren i SAMTLIGA
 *   pos 3  23/30   ← måttritning; oftast bara siffror, ibland tysk rubrik
 *   pos 4   1/30   ┐
 *   pos 5   1/30   ├ tyska funktionsgrafiker — 87 av 90 bilder
 *   pos 6   2/30   ┘
 *   pos 7   6/30
 *   pos 8  24/30   ← detaljfoton: material, gångjärn, tyg, hjul
 *   pos 9  27/29   ← detaljfoton
 *
 * Regeln räddar 134 av 144 rena bilder (93 %) och släpper in 15 tyska (10 % av
 * det som behålls). Att också ta position 7 hade gett 97 % rena men dubblat
 * skräpkvoten till 22 %; att kapa vid 3 hade gett bara 58 %.
 *
 * Mönstret är oberoende av var i feeden produkten ligger: 49 / 46 / 45 % tyska i
 * början, mitten och slutet, och som mest en produkt av tio i skillnad per
 * position. Regeln behöver alltså inte justeras för olika delar av sortimentet.
 *
 * Poleringen behöver granska position **3, 8 och 9**. Position 1 och 2 kan den
 * hoppa över helt — och det är de två som blir huvudbild och delningsbild.
 */
export const RENA_BILDPOSITIONER = [1, 2, 3, 8, 9] as const;

/**
 * Prefixet som skiljer en Aosom-artikel från en AliExpress-listning i
 * `supplierProductId`. Utan det skulle ett numeriskt Aosom-SKU en dag kunna
 * kollidera med ett AE-produkt-id — och dubblettspärren, synken och
 * mappningsuppslagen läser alla samma fält. Prefixet är också vad
 * lib/aosom/import-run.ts känner igen sina egna rader på vid omkörning.
 */
export const AOSOM_ID_PREFIX = "aosom:";

export function aosomSupplierProductId(sku: string): string {
  return `${AOSOM_ID_PREFIX}${sku}`;
}

export function isAosomSupplierProductId(id: string | undefined): boolean {
  return !!id && id.startsWith(AOSOM_ID_PREFIX);
}

/** Aosoms lager ligger i Neu Wulmstorf och Schwanewede — båda i Tyskland. */
export const AOSOM_WAREHOUSE = "DE";

export interface AosomBildval {
  /**
   * Positioner att hämta (1-indexerat). Saknas = RENA_BILDPOSITIONER.
   * Skicka [1,2,3,4,5,6,7,8,9] för att ta allt (t.ex. vid felsökning).
   */
  positioner?: readonly number[];
}

export interface AosomFx {
  /** EUR → SEK, ur EUR_TO_SEK. */
  eurToSek: number;
  /** USD → SEK, samma kurs som prissättningen använder (USD_TO_SEK). */
  usdToSek: number;
}

/**
 * Bygger en importerbar produkt av en feed-rad.
 *
 * OM `costUsd`: pipelinen räknar landad kostnad som `costUsd × usdToSek`
 * (pricing.ts#costToSek) och sparar resultatet i `landedCostSek`. `costUsd` är
 * alltså en härledd storhet — "vad varan hade kostat i dollar" — inte ett pris
 * någon fakturerat.
 *
 * ☠️ MOMSEN MÅSTE LÄGGAS PÅ. `landedCostSek` är enligt husets konvention lagrad
 * INKLUSIVE moms: auktionens golvbud delar med 1,25 innan det räknar
 * (`lib/auction/seed.ts#netSupplierCost`, SUPPLIER_VAT_RATE = 0,25), eftersom
 * momsen aldrig är en verklig kostnad för ett momsregistrerat företag —
 * omvänd skattskyldighet på EU-köp, avdragsgill importmoms på Kina-köp.
 *
 * Aosoms B2B-fakturor är NETTO (omvänd skattskyldighet). Sparas det beloppet
 * rakt av hamnar ett nettotal i ett fält som läses som brutto, och golvbudet
 * blir 20 % för lågt — auktionen kan då sälja UNDER inköp. Därför bruttas
 * beloppet upp med `SUPPLIER_VAT_RATE` så Aosom-rader följer exakt samma
 * konvention som AliExpress-raderna.
 *
 * FRAKTEN INGÅR I KOSTNADEN. Det är hela skillnaden mot AliExpress, där
 * EU-lagerpriset är levererat. Aosoms SE-frakt är per kolli och skalar med
 * vikten (16 € under två kilo, över 100 € över fyrtio) — hålls den utanför blir
 * varje marginalsiffra i butiken fel åt samma håll, och auktionen kan sälja
 * under inköp.
 */
export function toImportProduct(
  row: AosomRow,
  fx: AosomFx,
  bildval?: AosomBildval,
): AliExpressProduct {
  // Netto ur feeden → brutto, så fältet betyder samma sak som på AE-raderna.
  const landedNetSek = landedCostEur(row) * fx.eurToSek;
  const landedSek = landedNetSek * (1 + SUPPLIER_VAT_RATE);
  const costUsd = round2(landedSek / fx.usdToSek);
  const title = cleanText(row.name);

  return {
    supplierProductId: aosomSupplierProductId(row.sku),
    sourceUrl: row.url,
    rawTitle: title,
    rawDescription: htmlToText(row.descriptionHtml),
    descriptionHtml: cleanHtml(row.descriptionHtml),
    imageUrls: valjBilder(row.imageUrls, bildval?.positioner),
    // EN variant per rad. Feedens `Psin` ser ut som en föräldranyckel men
    // grupperar relaterade varor, inte varianter — se feed.ts. Tom `options`
    // ger en produkt utan valaxlar i Wix (pipelinen skickar då options:undefined).
    variants: [
      {
        supplierVariantId: row.sku,
        options: {},
        costUsd,
        stock: row.qty,
        shipFrom: AOSOM_WAREHOUSE,
        included: true,
      },
    ],
    shipsFrom: [AOSOM_WAREHOUSE],
    inStock: row.qty > 0,
    specifications: buildSpecifications(row),
    features: bulletsToFeatures(row.bulletsHtml),
  };
}

/**
 * Plockar ut de bildpositioner vi litar på. Se RENA_BILDPOSITIONER för mätningen.
 *
 * Ordningen bevaras (feedens egen), och positioner som inte finns hoppas tyst
 * över — en produkt med åtta bilder i stället för nio är inget fel, den fanns i
 * urvalet. En tom lista släpper igenom ALLT: hellre nio bilder med tysk text än
 * en produkt utan bilder.
 */
export function valjBilder(urls: string[], positioner?: readonly number[]): string[] {
  const vill = positioner ?? RENA_BILDPOSITIONER;
  if (!vill.length) return urls;
  const valda = urls.filter((_, i) => vill.includes(i + 1));
  return valda.length ? valda : urls;
}

/**
 * Spec-underlaget byggs ur de STRUKTURERADE kolumnerna, inte ur feedens
 * `Specification`-fält — det är tomt i 5 550 av 5 566 säljbara rader (0,3 %).
 * Size/Color/Material/vikt/paketmått är däremot ifyllda i praktiskt taget alla.
 *
 * Etiketterna sätts på svenska direkt; värdena är kvar på tyska ("Rosa",
 * "Holzwerkstoff/Acryl") och översätts när produkten poleras. En halvöversatt
 * tabell i ett utkast är inget problem — utkastet når ingen kund — och den
 * strukturen är lättare att polera än en tysk etikettsoppa.
 *
 * TVÅ SAKER SKRIVS ALDRIG IN HÄR:
 *
 * 1. **Lagerlandet.** Leonards regel 2026-08-15 — fraktland får inte förekomma i
 *    produkttext. `shipFrom` på varianten bär uppgiften och renderas inte för kund.
 * 2. **Aosoms artikelnummer.** Det är en sökbar fingeravtryck rakt mot
 *    leverantören: koden står i Aosoms egen produkt-URL
 *    (`…kinderschminktisch~350-219V00PK.html`), så en googling på strängen ställer
 *    vår sida bredvid deras — med deras konsumentpris intill. Kontrollmätt
 *    2026-08-27 på en publicerad sida: noll träffar på "aliexpress", "alicdn",
 *    "aosom" eller något husmärke i HTML:en, och `sku` i JSON-LD är Wix eget
 *    UUID. Hela katalogen är byggd så; den här modulen ska inte vara undantaget.
 *    Numret finns kvar där det hör hemma — `supplierProductId` på mappningen.
 */
export function buildSpecifications(row: AosomRow): Record<string, string> {
  const spec: Record<string, string> = {};
  const add = (label: string, value: string | null | undefined): void => {
    const v = cleanText(value ?? "");
    if (v) spec[label] = v;
  };
  add("Mått", row.size);
  add("Färg", row.color);
  add("Material", row.material);
  if (row.weightKg !== null && row.weightKg > 0) {
    add("Vikt", `${formatNumber(row.weightKg)} kg`);
  }
  add("Paketmått", normalizePackageSize(row.packageSize));
  return spec;
}

/**
 * Säljpunkterna ligger som `<ul><li>…</li></ul>`. Pipelinen vill ha en lista med
 * ren text. Tomma poster och rena upprepningar filtreras bort — feeden lägger
 * ibland samma mening i både Bullet Points och Description.
 */
export function bulletsToFeatures(html: string): string[] {
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => htmlToText(m[1]));
  const source = items.length ? items : htmlToText(html).split(/\n+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of source) {
    const text = cleanText(raw);
    if (text.length < 3) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

/**
 * Aosom lämnar platshållaren `[BRAND NAME]` i beskrivningen — den står kvar i
 * 4 975 av 5 566 säljbara rader. Publicerad rakt av blir det "Der [BRAND NAME]
 * Kinder Schminktisch" på en svensk produktsida. Den tas bort här i stället för
 * att lämnas åt poleringen, eftersom det är ett mekaniskt fel med ett mekaniskt
 * svar — och för att den som poleringen missar når kund.
 */
const BRAND_PLACEHOLDER = /\[\s*BRAND\s*NAME\s*\]/gi;

export function cleanText(value: string): string {
  return value.replace(BRAND_PLACEHOLDER, "").replace(/\s+/g, " ").trim();
}

function cleanHtml(html: string): string {
  // Bara platshållaren och dubbla mellanslag efter den — HTML-strukturen lämnas
  // orörd så beskrivningen behåller sina rubriker och listor in i poleringen.
  return html.replace(BRAND_PLACEHOLDER, "").replace(/[ \t]{2,}/g, " ").trim();
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(p|li|div|h[1-6]|tr)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(BRAND_PLACEHOLDER, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function decodeEntities(s: string): string {
  const named: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß",
  };
  return s
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => named[name] ?? m);
}

/** "93.00x59.00x17.00 cm" → "93 × 59 × 17 cm". */
function normalizePackageSize(value: string): string {
  const m = value.match(/([\d.,]+)\s*x\s*([\d.,]+)\s*x\s*([\d.,]+)/i);
  if (!m) return cleanText(value);
  const [, a, b, c] = m;
  return `${formatNumber(Number(a.replace(",", ".")))} × ${formatNumber(Number(b.replace(",", ".")))} × ${formatNumber(Number(c.replace(",", ".")))} cm`;
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
