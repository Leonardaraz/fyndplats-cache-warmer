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
 * (pricing.ts#costToSek) och sparar resultatet i `landedCostSek` — fältet som
 * lönsamhetsöversikten OCH auktionens golvbud läser. Aosom prissätter i euro, så
 * vi räknar baklänges: `costUsd = landad EUR × eurToSek / usdToSek`. Då blir
 * `landedCostSek` exakt rätt, och `costUsd` betyder "vad den här varan hade
 * kostat i dollar" — en härledd storhet, inte ett pris någon fakturerat.
 *
 * FRAKTEN INGÅR I KOSTNADEN. Det är hela skillnaden mot AliExpress, där
 * EU-lagerpriset är levererat. Aosoms SE-frakt är per kolli och skalar med
 * vikten (16 € under två kilo, över 100 € över fyrtio) — hålls den utanför blir
 * varje marginalsiffra i butiken fel åt samma håll, och auktionen kan sälja
 * under inköp.
 */
export function toImportProduct(row: AosomRow, fx: AosomFx): AliExpressProduct {
  const landedSek = landedCostEur(row) * fx.eurToSek;
  const costUsd = round2(landedSek / fx.usdToSek);
  const title = cleanText(row.name);

  return {
    supplierProductId: aosomSupplierProductId(row.sku),
    sourceUrl: row.url,
    rawTitle: title,
    rawDescription: htmlToText(row.descriptionHtml),
    descriptionHtml: cleanHtml(row.descriptionHtml),
    imageUrls: row.imageUrls,
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
 * Spec-underlaget byggs ur de STRUKTURERADE kolumnerna, inte ur feedens
 * `Specification`-fält — det är tomt i 5 550 av 5 566 säljbara rader (0,3 %).
 * Size/Color/Material/vikt/paketmått är däremot ifyllda i praktiskt taget alla.
 *
 * Etiketterna sätts på svenska direkt; värdena är kvar på tyska ("Rosa",
 * "Holzwerkstoff/Acryl") och översätts när produkten poleras. En halvöversatt
 * tabell i ett utkast är inget problem — utkastet når ingen kund — och den
 * strukturen är lättare att polera än en tysk etikettsoppa.
 *
 * Lagerlandet skrivs ALDRIG in här. Leonards regel 2026-08-15: fraktland får
 * inte förekomma i produkttext. `shipFrom` på varianten bär den uppgiften, och
 * det fältet renderas inte för kund.
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
  add("Artikelnummer", row.sku);
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
