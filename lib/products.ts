import { cache } from "react";
import { categorySignalIsUsable, keepCategory } from "./category-filter";
import { imgKey } from "./image-alt";
import { formatPrice } from "./price-range";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts } from "@wix/stores";
import { categories as wixCategories } from "@wix/categories";
import local from "../products.json";
import variantImages from "../data/variant-images.json";
import { imageScoreOf, imageRecordOf } from "./image-scores";
import { getSoldUnits } from "./popularity";
import { getProductColors } from "./product-colors";
import { swedishChoiceValue, swedishOptionName } from "./option-i18n";
import { linkVariantImagesByAltText, colorOf } from "./variant-color-image";
import { v3VariantData, v3MultiVariantData, type V3VariantData, type V3MultiVariantData } from "./variant-price";

export type Product = {
  id: string;
  variants: { id: string; label: string }[];
  collectionIds: string[];
  name: string;
  slug: string;
  // Skapelse-ordning för "nyast först"-sortering (alla-produkter-sidan). Härleds
  // ur Wix numericId (auto-ökande vid skapande) → createdDate-fallback. 0 = okänt
  // (sorteras sist). INTE lastUpdated — den ändras vid varje lager-/pris-sync.
  createdAt: number;
  // Senast-ändrad (Wix updatedDate, epoch-ms). 0 = okänt → sitemapen UTELÄMNAR
  // då lastmod (ärligare än att stämpla render-tid). Att den rör sig vid lager-/
  // pris-sync är RÄTT för sitemap-lastmod (sidans innehåll ändrades faktiskt).
  updatedAt: number;
  price: string;
  currency: string;
  priceNum: number;
  priceFrom?: string;
  /** Lägsta variantpriset som tal — se priceFromNum i mapProduct. */
  priceFromNum?: number;
  /** Ordinariepriset som tal, bara när produkten är nedsatt. */
  originalPriceNum?: number;
  hasRange?: boolean;
  img: string;
  gallery: string[];
  blurb: string;
  specs: string;
  // Kuraterad Wix-SEO (seoData.tags) — satt ENBART när merchant manuellt skrivit
  // en egen titel/description i Wix (dvs skiljer sig från rånamnet). Frontenden
  // föredrar dessa i <title>/meta-description (korta, Google-anpassade) och faller
  // annars tillbaka på name/blurb. Tomt för icke-kuraterade produkter.
  seoTitle?: string;
  seoDescription?: string;
  inStock: boolean;
  stockQuantity?: number;
  ribbon?: string;
  originalPrice?: string;
  onSale?: boolean;
  descriptionHtml?: string;
  options?: { name: string; choices: { label: string; image: string; color: string; variantId: string; price: string; priceNum: number; originalPrice: string; inStock?: boolean }[] } | null;
  // Multi-axel-varianter (t.ex. Färg × Storlek): en väljare per axel + en variant-
  // tabell (hel kombination → variant-id/pris/lager/bild). Sätts BARA för ≥2 axlar;
  // då är `options` null och PDP:n renderar per-axel-väljaren. Single-axel använder
  // `options` som förut.
  variantAxes?: { name: string; choices: { label: string; image: string; color: string }[] }[];
  variantTable?: { choices: Record<string, string>; variantId: string; price: string; priceNum: number; originalPrice: string; inStock: boolean; image: string }[];
  // Vilken variant varje galleribild tillhör: mediaKey (Wix fil-id) → variant-etikett.
  // En variant kan ha FLERA bilder (V3 linkedMedia är en lista) → används för att
  // markera ALLA den valda variantens bilder i galleriet. Tom = ingen koppling.
  imageOwners?: Record<string, string>;
  // Wix alt-texter per bild: mediaKey (fil-id) → altText. Nycklas på fil-id
  // (INTE parallell array) eftersom galleriet dedupas, kapas och kan ersättas av
  // V3-varianten — en index-baserad lista skulle glida isär. Samma mönster som
  // imageOwners ovan. Tom/saknad nyckel → anroparen faller tillbaka på
  // "<produktnamn> – bild N". Se altForImage().
  imageAlts?: Record<string, string>;
  // Bildkvalitets-poäng (Claude vision, se lib/image-scores.ts). Styr ordningen
  // på startsida/kategori/alla-produkter. DEFAULT_SCORE för opoängsatta produkter.
  imageScore: number;
  imageFlags: string[];
  // Sålda enheter senaste 90 dagarna (verkliga Wix-ordrar via lib/popularity).
  // Driver "Populärast" och väger tyngst i "Rekommenderat". 0 = ingen försäljning
  // (eller orderdata otillgänglig — sorteringen faller då tillbaka på nyhet).
  popularity: number;
  /** Kanoniska färgnycklar ("svart", "vinröd") för färgfiltret. Hämtas från V3
   *  som sidovagn (lib/product-colors.ts) eftersom V1-listan plattar bort
   *  optionsnamnen. undefined = ingen färgdata; [] förekommer aldrig. */
  colors?: string[];
  // Betygssammandrag för produktkortet. Sätts INTE av produkthämtningen utan av
  // attachRatings() (lib/review-aggregates.ts) i serverkomponenten, precis innan
  // listan skickas vidare — så att recensionerna aldrig kopplas in i den heta
  // produktvägen. Saknas när produkten inte har omdömen eller när Trustpilot är
  // påslaget (då visar produktsidan inte heller våra egna omdömen).
  rating?: { stars: number; exact: number; value: string; count: number };
};

// Färgnamn → CSS hex för premium color-swatch när per-choice bilder saknas. Utbruten
// till ./color-hex (testbar; exakt/hel-ord-match, inga lösa delsträngsträffar).

// Public Wix Headless OAuth client ID for wix-vibe-site-u4lp (V3 catalog).
// NOT a secret — it ships client-side via NEXT_PUBLIC_ and is visible to every
// browser visitor. Hardcoded directly (instead of reading process.env) because
// stale Vercel env vars on production pointed at the old Fyndplats V1 site and
// would break the V3 categories API on the new site.
const CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";

const wix = CLIENT_ID
  ? createClient({ modules: { products: wixProducts, categories: wixCategories }, auth: OAuthStrategy({ clientId: CLIENT_ID }) })
  : null;

// V3-katalogens site-id + admin-nyckel (server-side ONLY). Det publika OAuth-SDK:t
// släpper choice.media för V3 (verifierat 2026-06-01: 0/100 produkter exponerar den),
// så per-färg-variantbilden (linkedMedia) läses autentiserat via V3 REST i getProduct.
// Saknad nyckel → vi faller tillbaka på data/variant-images.json + färg-swatch.
const WIX_API_KEY = process.env.WIX_API_KEY;
const WIX_SITE_ID = process.env.WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

/**
 * Läser per-val variantbilder (V3 `linkedMedia`) live för en produkt och returnerar
 * { [optionName]: { [choiceName]: bild-URL } }. Detta är den ENDA källan som täcker
 * nyimporterade produkter (variant-images.json exporteras från V1-sajten och innehåller
 * dem inte). Fail-open: saknad nyckel / fel / ingen länkad media → {} (statiska filen +
 * colorOf-swatchen tar då över). Cachas 5 min (matchar sidans `revalidate = 300`)
 * så nyimporterade produkters variantbilder syns snabbt i stället för efter 1 h.
 */
// Hämtar HELA V3-produkten autentiserat (admin-nyckel) EN gång per request. React
// cache() dedupar så att bild- OCH pris-hydreringen nedan delar samma nätverksanrop.
// Fail-open: ingen nyckel / fel → null. Edge-cachas 5 min (revalidate 300) —
// matchar sidans egen `revalidate = 300`, så en NYIMPORTERAD produkts länkade
// variantbilder (linkedMedia kopplas async, sekunder–minuter efter att produkten
// skapats) syns inom ~5 min i stället för upp till 1 h. Fortfarande ETT V3-anrop
// per produkt per fönster (delas av pris+bild-hydreringen via cache()).
const fetchV3ProductRaw = cache(async (productId: string): Promise<any | null> => {
  if (!WIX_API_KEY || !productId) return null;
  try {
    const res = await fetch(
      `https://www.wixapis.com/stores/v3/products/${productId}?fields=MEDIA_ITEMS_INFO`,
      {
        headers: { Authorization: WIX_API_KEY, "wix-site-id": WIX_SITE_ID },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return null;
    return (await res.json())?.product ?? null;
  } catch {
    return null;
  }
});

async function fetchV3ChoiceImages(productId: string): Promise<Record<string, Record<string, string>>> {
  const product = await fetchV3ProductRaw(productId);
  if (!product) return {};
  const out: Record<string, Record<string, string>> = {};
  for (const opt of product.options || []) {
    const name = opt?.name;
    if (!name) continue;
    for (const ch of opt?.choicesSettings?.choices || []) {
      const url = ch?.linkedMedia?.[0]?.image?.url;
      if (ch?.name && url) (out[name] ||= {})[ch.name] = url;
    }
  }
  return out;
}

// Wix fil-id ur en media-URL (.../media/<id>...) — samma nyckel som productview/
// gallery deduppar på, så markeringen matchar rätt galleri-slide oavsett transform.
function ownerMediaKey(url: string): string {
  const m = (url || "").match(/\/media\/([^/]+)/);
  return m ? m[1] : url || "";
}

// Vilken variant varje bild tillhör: mediaKey → variant-etikett. Läser ALLA
// linkedMedia per val (inte bara [0]) så en variants samtliga bilder kan markeras
// i galleriet när varianten väljs. Etiketten normaliseras med swedishChoiceValue
// så den matchar väljarens visningsetikett. Första vinnaren per bild behålls (en
// bild som råkar delas av två val tillskrivs det första). Fail-open: {} utan nyckel.
async function fetchV3ImageOwners(productId: string): Promise<Record<string, string>> {
  const product = await fetchV3ProductRaw(productId);
  if (!product) return {};
  const out: Record<string, string> = {};
  for (const opt of product.options || []) {
    for (const ch of opt?.choicesSettings?.choices || []) {
      const label = ch?.name ? swedishChoiceValue(ch.name) : "";
      if (!label) continue;
      for (const lm of ch?.linkedMedia || []) {
        const url = lm?.image?.url;
        if (!url) continue;
        const k = ownerMediaKey(url);
        if (k && !(k in out)) out[k] = label;
      }
    }
  }
  return out;
}

// Per-variant pris/-id autentiserat från V3 (delar cachead hämtning med bilderna).
// Ren parsning ligger i ./variant-price (enhetstestbar utan SDK/fetch-beroenden).
async function fetchV3VariantData(productId: string): Promise<V3VariantData> {
  const product = await fetchV3ProductRaw(productId);
  return product ? v3VariantData(product) : null;
}

// Multi-axel-variantdata (Färg × Storlek) autentiserat från V3 (delar cachead hämtning).
async function fetchV3MultiVariantData(productId: string): Promise<V3MultiVariantData> {
  const product = await fetchV3ProductRaw(productId);
  return product ? v3MultiVariantData(product) : null;
}

// HELA produktgalleriet från V3 (media.itemsInfo.items). Det publika SDK:t
// (queryProducts) ger en kapad delmängd och mapProduct skär dessutom till 6 —
// så importerade produkter med fler än 6 bilder visade bara 6 på PDP:n trots att
// Wix lagrar alla. fetchV3ProductRaw begär redan `?fields=MEDIA_ITEMS_INFO` och
// är cache:ad per request, så detta delar samma nätverksanrop som pris-/bild-
// hydreringen (ingen extra fetch). Fail-open: saknad nyckel/fält → [].
async function fetchV3Gallery(productId: string): Promise<{ urls: string[]; alts: Record<string, string> }> {
  const product = await fetchV3ProductRaw(productId);
  const items = product?.media?.itemsInfo?.items ?? [];
  // Deduppa på fil-id (imgKey) — V3 kan lista samma foto i olika transform-params.
  const seen = new Set<string>();
  const out: string[] = [];
  // Wix alt-texter följer med samma svep (image.altText) → PDP-galleriet slipper
  // tomma alt="". Nycklas på fil-id så de överlever dedup/kapning nedströms.
  const alts: Record<string, string> = {};
  for (const it of items) {
    const url = it?.image?.url;
    if (typeof url !== "string" || !url) continue;
    const k = imgKey(url);
    const alt = typeof it?.image?.altText === "string" ? it.image.altText.trim() : "";
    if (alt && !(k in alts)) alts[k] = alt;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(url);
  }
  return { urls: out, alts };
}

function stripHtml(h: string): string {
  return (h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProduct(p: any): Product {
  const mediaItems: any[] = (p.media && p.media.items) || [];
  const gallery: string[] = mediaItems.map((it: any) => it?.image?.url).filter(Boolean);
  const mainMediaImage = p.media && p.media.mainMedia && p.media.mainMedia.image;
  // Wix alt-texter per bild (mediaKey → altText) så galleriet slipper tomma alt="".
  // BEGRÄNSAD till de bilder som faktiskt överlever mappningen (samma 6 som
  // gallery kapas till + huvudbilden): Product-objektet serialiseras i sin helhet
  // till klienten på listsidorna (/alla-produkter, /kategori/*, /sok renderar
  // ~370 produkter), och en okapad karta hade lagt på vikt där ingen läser den.
  // PDP:n fyller ändå på med hela V3-galleriets alt-texter i getProduct.
  const keptImageKeys = new Set(
    [...gallery.slice(0, 6), mainMediaImage?.url].filter(Boolean).map((u: string) => imgKey(u)),
  );
  const imageAlts: Record<string, string> = {};
  for (const it of [...mediaItems, { image: mainMediaImage }]) {
    const url = it?.image?.url;
    const alt = typeof it?.image?.altText === "string" ? it.image.altText.trim() : "";
    if (!url || !alt) continue;
    const k = imgKey(url);
    if (k && keptImageKeys.has(k) && !(k in imageAlts)) imageAlts[k] = alt;
  }
  const specsSection = ((p.additionalInfoSections) || []).find((s: any) => /specifikation/i.test(s.title || ""));
  const firstP = (p.description || "").match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  // label är endast för VISNING (cart/PDP matchar på v.id, inte på texten), så
  // vi översätter varje choice-värde till svenska direkt här. Se lib/option-i18n.
  const variants = ((p.variants) || [])
    .map((v: any) => ({
      id: v._id,
      label: Object.values(v.choices || {}).map((x: any) => swedishChoiceValue(String(x))).join(" / ") || "Standard",
    }))
    .filter((v: any) => v.id);
  // Pris-spann → "Från X kr" på kort/listor när varianter har OLIKA pris.
  // queryProducts() lämnar p.priceRange tomt ({}) för de allra flesta produkter
  // (bara ~10 % har den ifylld) — så vi härleder spannet PRIMÄRT från varianternas
  // egna priser (variant.priceData, alltid med i listfrågan) och faller tillbaka
  // på priceRange bara om inga variantpriser finns. Annars (min === max eller
  // inga varianter) visas det vanliga priset. Defensivt: degraderar utan fel.
  const variantPrices: number[] = ((p.variants) || [])
    .map((v: any) => {
      const pd = v?.variant?.priceData;
      if (!pd) return null;
      return typeof pd.discountedPrice === "number" ? pd.discountedPrice
        : typeof pd.price === "number" ? pd.price : null;
    })
    .filter((x: number | null): x is number => typeof x === "number");
  const pr = p.priceRange || {};
  let minV: number | null = null;
  let maxV: number | null = null;
  if (variantPrices.length > 0) {
    minV = Math.min(...variantPrices);
    maxV = Math.max(...variantPrices);
  } else {
    minV = typeof pr.minValue === "number" ? pr.minValue : null;
    maxV = typeof pr.maxValue === "number" ? pr.maxValue : null;
  }
  const hasRange = minV != null && maxV != null && minV < maxV;
  const pid = p._id || p.id || "";
  // Kuraterad Wix-SEO ur seoData.tags (samma struktur i Stores V1/V3): en
  // <title>-tagg + en <meta name="description">. Vi använder dem BARA när de är
  // manuellt satta (seoTitle skiljer sig från rånamnet) — då är de korta och
  // Google-anpassade. Icke-kuraterade produkter har seoTitle === name → vi låter
  // dem falla tillbaka på dagens name/blurb-beteende (ingen regression).
  const seoTags: any[] = (p.seoData && p.seoData.tags) || [];
  const seoTitleTag = seoTags.find((t) => t && t.type === "title");
  const seoDescTag = seoTags.find((t) => t && t.type === "meta" && t.props && t.props.name === "description");
  const rawSeoTitle = seoTitleTag && typeof seoTitleTag.children === "string" ? seoTitleTag.children.trim() : "";
  const rawSeoDesc = seoDescTag && seoDescTag.props && typeof seoDescTag.props.content === "string" ? seoDescTag.props.content.trim() : "";
  const curatedSeoTitle = rawSeoTitle && rawSeoTitle !== (p.name || "") ? rawSeoTitle : undefined;
  const curatedSeoDesc = curatedSeoTitle && rawSeoDesc ? rawSeoDesc : undefined;
  return {
    id: pid,
    // Skapelse-ordning: numericId (auto-ökande heltal, schema-konsekvent över
    // ALLA produkter) → createdDate-parse → 0. Används av sortByNewest.
    createdAt: Number(p.numericId) || Date.parse(p.createdDate || p._createdDate || "") || 0,
    updatedAt: Date.parse(p.updatedDate || p._updatedDate || p.lastUpdated || "") || 0,
    imageScore: imageScoreOf(pid),
    imageFlags: imageRecordOf(pid)?.flags ?? [],
    popularity: 0, // fylls i av fetchProducts (getSoldUnits) — 0 tills dess

    variants,
    collectionIds: p.collectionIds || [],
    name: p.name || "",
    slug: p.slug || "",
    price: (p.price && p.price.formatted && (p.price.formatted.discountedPrice || p.price.formatted.price)) || "",
    currency: (p.price && p.price.currency) || "SEK",
    priceNum: (p.price && (p.price.discountedPrice ?? p.price.price)) || 0,
    originalPrice: (p.price && p.price.discountedPrice != null && p.price.discountedPrice < p.price.price) ? (p.price.formatted?.price || "") : "",
    onSale: !!(p.price && p.price.discountedPrice != null && p.price.discountedPrice < p.price.price),
    priceFrom: hasRange && minV != null ? minV.toFixed(2).replace(".", ",") + "kr" : "",
    // Råa tal vid sidan av Wix färdigformaterade strängar. Strängarna behålls
    // orörda — feed-parsern i app/api/feed/products.xml läser dem — men det som
    // VISAS formateras från talen med formatPrice(), så butiken skriver
    // "1 369 kr" i stället för Wix "1369,00kr".
    priceFromNum: hasRange && minV != null ? minV : undefined,
    originalPriceNum:
      p.price && p.price.discountedPrice != null && p.price.discountedPrice < p.price.price ? p.price.price : undefined,
    hasRange,
    img: (p.media && p.media.mainMedia && p.media.mainMedia.image && p.media.mainMedia.image.url) || gallery[0] || "",
    gallery: gallery.slice(0, 6),
    imageAlts,
    blurb: stripHtml(firstP ? firstP[1] : p.description || "").slice(0, 220),
    specs: stripHtml(specsSection ? specsSection.description : "").slice(0, 400),
    seoTitle: curatedSeoTitle,
    seoDescription: curatedSeoDesc,
    inStock: !!(p.stock && p.stock.inStock),
    stockQuantity: (p.stock && typeof p.stock.quantity === "number") ? p.stock.quantity : undefined,
    ribbon: (p.ribbon && (typeof p.ribbon === "string" ? p.ribbon : p.ribbon.name)) || undefined,
  };
}

// Per-choice variant data för variant-pickern. Tre rendering-lägen i productview:
//   1. Bild-cirklar — när varje choice har en bild (ch.media). Föredraget.
//   2. Färg-swatcher — fallback när option heter "Färg"/"Color" men bild saknas.
//   3. Text-pills — sista fallback (storlek/material/etc).
//
// OBS: Wix V1-katalogen HAR per-choice-bilder för i stort sett alla produkter,
// men @wix/stores-SDK:ns listfråga (queryProducts) släpper choice.media (och det
// anonyma/publika API:t exponerar inte kopplingen variant→bild). Därför hydrerar
// getProduct() bilderna från en statisk fil (data/variant-images.json) som är
// exporterad en gång via autentiserat admin-API — ingen WIX_API_TOKEN behövs i
// storefronten (se optionsForProduct). Funktionen accepterar både SDK-shape
// (variant._id) och REST-shape (variant.id) så den fungerar för båda källorna.
function extractOptions(raw: any): Product["options"] {
  const opt = (raw.productOptions || [])[0];
  if (!opt || (opt.choices || []).length < 2) return null;
  const isColor = /färg|color|kulör/i.test(opt.name || "");
  const variants = raw.variants || [];
  const choices = (opt.choices || []).map((ch: any) => {
    const v = variants.find((vv: any) => vv.choices?.[opt.name] === ch.value);
    const pd = v?.variant?.priceData;
    const onSale = pd && pd.discountedPrice != null && pd.discountedPrice < pd.price;
    return {
      label: ch.value,
      image: ch.media?.mainMedia?.image?.url || ch.media?.items?.[0]?.image?.url || "",
      color: isColor ? colorOf(ch.value) : "",
      variantId: v?._id || v?.id || "",
      price: pd?.formatted?.discountedPrice || pd?.formatted?.price || "",
      priceNum: (pd && (pd.discountedPrice ?? pd.price)) || 0,
      originalPrice: onSale ? (pd.formatted?.price || "") : "",
    };
  }).filter((c: any) => c.variantId); // kräver inte längre image — kan vara color eller text
  return choices.length >= 2 ? { name: opt.name, choices } : null;
}

// Statisk variant→bild-mappning (data/variant-images.json), exporterad en gång via
// autentiserat Wix-admin-API. Förberäknas till slug → (choice-värde → bild-URL).
type VariantImageFile = {
  products: Record<string, { options: { name: string; choices: { value: string; image: string | null }[] }[] }>;
};
const variantImageBySlug: Record<string, Record<string, string>> = (() => {
  const out: Record<string, Record<string, string>> = {};
  const all = (variantImages as VariantImageFile).products || {};
  for (const [slug, entry] of Object.entries(all)) {
    const m: Record<string, string> = {};
    for (const o of entry.options || []) {
      for (const c of o.choices || []) {
        if (c.image && !m[c.value]) m[c.value] = c.image;
      }
    }
    out[slug] = m;
  }
  return out;
})();

// Hydrerar per-choice-bilder från den statiska mappningen så variant-pickern kan
// köra bild-läge utan WIX_API_TOKEN. Strikt additivt: saknas produkten i mappen
// (eller ett choice-värde), faller vi tillbaka på SDK-objektets options
// (färg-swatch-/text-läget) → ingen regression.
function optionsForProduct(slug: string, sdkItem: any): Product["options"] {
  const opts = extractOptions(sdkItem);
  if (!opts) return null;
  const imgByValue = variantImageBySlug[slug];
  if (imgByValue) {
    for (const ch of opts.choices) {
      if (!ch.image && imgByValue[ch.label]) ch.image = imgByValue[ch.label];
    }
  }
  return opts;
}

let productsPromise: Promise<Product[]> | null = null;

// Nödkatalogen products.json är en minimal, GAMMAL snapshot (3 produkter i ett
// äldre schema utan id/createdAt/collectionIds/imageScore). Den släpptes förr in
// rå via en `as Product[]`-cast — och när Wix låg nere 2026-08-01/02 kraschade
// varje yta som rörde de saknade fälten: sortByNewest föll på id.localeCompare
// (3 051 serverfel, 70 besökare fick 500 på /alla-produkter och startsidans
// revalidering) och produktfeeden på collectionIds.map. Alltså: reservvägen som
// finns för att hålla sajten uppe under ett Wix-avbrott var det som fällde den.
// Normalisera därför till KOMPLETT Product-form — tsc tvingar varje
// obligatoriskt fält, så en framtida typutökning bryter bygget här i stället
// för att krascha i produktion — och släpp aldrig igenom en post utan slug+bild.
const FALLBACK_PRODUCTS: Product[] = (local as Array<Record<string, unknown>>)
  .map((p): Product => ({
    id: String(p.id || `local-${String(p.slug ?? "")}`),
    variants: [],
    collectionIds: [],
    name: String(p.name ?? ""),
    slug: String(p.slug ?? ""),
    createdAt: 0,
    updatedAt: 0,
    price: String(p.price ?? ""),
    currency: String(p.currency ?? "SEK"),
    priceNum: Number(p.priceNum) || 0,
    img: String(p.img ?? ""),
    gallery: Array.isArray(p.gallery) ? (p.gallery as string[]).filter((g) => typeof g === "string") : [],
    blurb: String(p.blurb ?? ""),
    specs: String(p.specs ?? ""),
    inStock: p.inStock !== false,
    imageScore: 0,
    imageFlags: [],
    popularity: 0,
  }))
  .filter((p) => p.slug && p.img);

async function fetchProducts(): Promise<Product[]> {
  if (!wix) return FALLBACK_PRODUCTS;
  try {
    const all: any[] = [];
    let skip = 0;
    const limit = 100;
    let rapporteratTotalt: number | null = null;
    // EN KORT SIDA ÄR INTE SAMMA SAK SOM SISTA SIDAN (Leonards rapport
    // 2026-08-16). Loopen bröt förr på `items.length < limit`, så en enda
    // degraderad sida kapade katalogen tyst: uppmätt 716 av 778 produkter på
    // /alla-produkter — sju hela sidor plus en som gav 16 i stället för 78, och
    // 62 produkter försvann ur butiken utan ett enda felmeddelande. Sitemapen,
    // byggd vid en komplett hämtning, listade dem fortfarande.
    //
    // Nu: gå vidare tills en sida är HELT tom, och stega med det antal vi
    // faktiskt fick (inte med `limit` — annars hoppar en kort sida över
    // resten av fönstret).
    //
    // TAKET VAR 40 SIDOR = 4 000 PRODUKTER, och det var en tickande bomb.
    // Mätt mot Wix 2026-08-28: 3 658 produkter i katalogen (946 synliga plus
    // 2 712 dolda Aosom-produkter som väntar på publicering). Publiceras de
    // ligger butiken 342 produkter från gränsen — och en katalog som växer
    // förbi taket kapas TYST, precis det som hände 2026-08-16 när 62 produkter
    // försvann ur butiken utan ett enda felmeddelande.
    //
    // Nu är taket bara en rundgångsspärr, inte en katalogbegränsning: loopen
    // stannar när Wix eget totalCount är uppnått, och slår den ändå i taket
    // loggas det som ett FEL i stället för att tyst servera en halv katalog.
    const MAX_SIDOR = 500; // 50 000 produkter
    let slogITaket = true;
    for (let i = 0; i < MAX_SIDOR; i++) {
      const res: any = await (wix as any).products.queryProducts().limit(limit).skip(skip).find();
      const items = res.items || [];
      if (typeof res.totalCount === "number") rapporteratTotalt = res.totalCount;
      if (items.length === 0) { slogITaket = false; break; }
      all.push(...items);
      skip += items.length;
      // Wix säger hur många som finns — sluta så fort vi har dem allihop i
      // stället för att fråga efter en tom sida till.
      if (rapporteratTotalt !== null && all.length >= rapporteratTotalt) { slogITaket = false; break; }
    }
    if (slogITaket) {
      console.error(
        `[wix] SIDTAKET SLOG I: hämtade ${all.length} produkter på ${MAX_SIDOR} sidor utan att nå slutet `
          + `(totalCount=${rapporteratTotalt ?? "okänt"}). Katalogen kan vara kapad — höj MAX_SIDOR.`,
      );
    }
    const mapped = all.filter((p) => p.visible !== false).map(mapProduct).filter((p) => p.img);
    // Dedupe by product id. After the V3 restructure a product belongs to a main
    // category AND 1–3 subcategories; the catalog query can also return overlapping
    // pages. Collapsing to one entry per id here is the single source of truth, so
    // every downstream list (/butik, /alla-produkter, /kategori, home) renders each
    // product exactly once without each page repeating its own dedupe.
    const byId = new Map<string, Product>();
    for (const p of mapped) if (p.id && !byId.has(p.id)) byId.set(p.id, p);
    const unique = [...byId.values()];
    // Popularitet (verkliga ordrar, 90 d) → "Populärast"/"Rekommenderat".
    // Fail-open: otillgänglig orderdata → alla 0 (sorteringen faller på nyhet).
    try {
      const sold = await getSoldUnits();
      if (sold.size) for (const p of unique) p.popularity = sold.get(p.id) ?? 0;
    } catch { /* popularitet får aldrig fälla produktlistan */ }
    // Färgval (V3-sidovagn) → färgfiltret på listsidorna. Samma fail-open:
    // uteblir datan renderas facetten helt enkelt inte.
    try {
      const colors = await getProductColors();
      if (colors.size) for (const p of unique) {
        const keys = colors.get(p.id);
        if (keys?.length) p.colors = keys;
      }
    } catch { /* färger får aldrig fälla produktlistan */ }
    console.log(`[wix] live products loaded: ${unique.length}${unique.length !== mapped.length ? ` (deduped from ${mapped.length})` : ""}`);
    // CACHA ALDRIG EN KAPAD KATALOG. productsPromise lever hela lambdans
    // livstid, så en degraderad hämtning frös förr det lägre antalet tills
    // instansen återvanns — och eftersom kategorimenyn byggs ur samma lista
    // kunde den samtidigt tappa kategorier. Rapporterar API:t ett totalantal
    // och vi fick färre: släpp cachen så nästa request hämtar om.
    if (rapporteratTotalt !== null && all.length < rapporteratTotalt) {
      console.error(
        `[wix] KAPAD produkthämtning: fick ${all.length} av ${rapporteratTotalt} `
          + "— cachar INTE, nästa request försöker igen.",
      );
      productsPromise = null;
    }
    return unique.length ? unique : FALLBACK_PRODUCTS;
  } catch (e) {
    console.error("[wix] live fetch failed, using local fallback:", (e as Error).message);
    productsPromise = null; // allow retry on a later request
    return FALLBACK_PRODUCTS;
  }
}

// Promise-cached so concurrent callers (page + header) share ONE request, not parallel ones.
// React cache() adds per-request memoisation on top of the module-level promise — harmless
// here (the module cache short-circuits the body) but makes the dedupe semantics explicit.
export const getProducts = cache((): Promise<Product[]> => {
  if (!productsPromise) productsPromise = fetchProducts();
  return productsPromise;
});

// Per-request dedup: if two RSCs on the same product page both call getProduct(slug),
// React reuses the in-flight Promise instead of round-tripping to Wix twice.
export const getProduct = cache(async (slug: string): Promise<Product | undefined> => {
  if (wix) {
    try {
      const res: any = await (wix as any).products.queryProducts().eq("slug", slug).limit(1).find();
      if (res.items?.[0]) {
        const prod = mapProduct(res.items[0]);
        prod.options = optionsForProduct(slug, res.items[0]);
        prod.descriptionHtml = res.items[0].description || "";
        // Per-variant PRIS (+ variant-id/bild) autentiserat från V3. Det publika
        // SDK:t (queryProducts) släpper variantpriserna för V3 → annars visas
        // baspriset för ALLA storleksvarianter (bug: 2 L och 30 L fick samma pris).
        // Bygger options om SDK:t inte gav dem; annars överlagras priset på matchande
        // val (rå-etikett, FÖRE svensk-översättningen nedan). Fail-open.
        const v3v = await fetchV3VariantData(prod.id);
        if (v3v) {
          const isColorOpt = /färg|color|kulör/i.test(v3v.optionName);
          const buildChoices = () =>
            v3v.choices.map((c) => ({
              label: c.label,
              image: c.image,
              color: isColorOpt ? colorOf(c.label) : "",
              variantId: c.variantId,
              price: c.price,
              priceNum: c.priceNum,
              originalPrice: c.originalPrice,
              inStock: c.inStock,
            }));
          if (!prod.options) {
            prod.options = { name: v3v.optionName, choices: buildChoices() };
          } else {
            const byLabel: Record<string, (typeof v3v.choices)[number]> = {};
            for (const c of v3v.choices) byLabel[c.label] = c;
            let matched = 0;
            for (const ch of prod.options.choices) {
              const c = byLabel[ch.label];
              if (!c) continue;
              matched++;
              ch.price = c.price;
              ch.priceNum = c.priceNum;
              ch.originalPrice = c.originalPrice;
              ch.inStock = c.inStock;
              if (!ch.variantId) ch.variantId = c.variantId;
              if (!ch.image) ch.image = c.image;
            }
            // Namnen matchade inte (SDK-värde ≠ V3-namn) → bygg från V3 (auktoritativt).
            if (matched === 0) prod.options = { name: v3v.optionName, choices: buildChoices() };
          }
        } else {
          // Multi-axel (Färg × Storlek): det publika SDK:t ger bara FÖRSTA axeln →
          // kund kunde inte välja t.ex. storlek och alla kombinationer visade
          // baspriset. Bygg ALLA axlar + en variant-tabell ur V3 (auktoritativ).
          // V3-namnen är redan svenska (importen skriver svenska) → ingen extra
          // översättning (bevarar distinkta namn). prod.options nollas så PDP:n
          // använder per-axel-vägen i stället för SDK:ns enda (buggiga) axel.
          const multi = await fetchV3MultiVariantData(prod.id);
          if (multi) {
            prod.variantAxes = multi.axes.map((ax) => {
              const isColorOpt = /färg|color|kulör/i.test(ax.name);
              return {
                name: ax.name,
                choices: ax.choices.map((c) => ({
                  label: c.label,
                  image: c.image,
                  color: isColorOpt ? colorOf(c.label) : "",
                })),
              };
            });
            prod.variantTable = multi.table;
            prod.options = null;
          }
        }
        // Lägg per-val variantbilder från V3 linkedMedia ÖVERST (mest aktuell källan
        // — täcker nyimporterade produkter som inte finns i variant-images.json).
        // Strikt additivt: live-bild vinner när den finns, annars behålls den
        // statiska/colorOf-bilden → ingen regression för migrerade produkter.
        if (prod.options) {
          const live = await fetchV3ChoiceImages(prod.id);
          // Primärt: matcha på option-NAMN (som förr). Men SDK:ns option-namn/råvärde
          // matchar inte alltid V3:s svenska nycklar ("Färg" → "Blå"/"Gul") — då missade
          // det förut helt (text-läge, ingen bildväxling). Bygg därför även en
          // namn-OBEROENDE flat-map (val → URL, gemener) över alla optioner och matcha
          // varje val på BÅDE råvärdet OCH dess svenska översättning (swedishChoiceValue
          // bryggar engelskt SDK-råvärde "Blue" → V3:s "Blå"). Strikt additivt.
          const byVal = live[prod.options.name] || {};
          const flatImg: Record<string, string> = {};
          for (const m of Object.values(live)) {
            for (const [k, url] of Object.entries(m)) {
              if (k && !(k.toLowerCase() in flatImg)) flatImg[k.toLowerCase()] = url;
            }
          }
          for (const ch of prod.options.choices) {
            const hit =
              byVal[ch.label] ||
              flatImg[swedishChoiceValue(ch.label).toLowerCase()] ||
              flatImg[(ch.label || "").toLowerCase()];
            if (hit) ch.image = hit;
          }
          // LÄGST prioritet (efter ch.media, variant-images.json och linkedMedia):
          // fyll resterande BILDLÖSA färg-val genom att matcha färgnamnet mot
          // galleribildens alt-text (positions-oberoende — per-färg-bilderna ligger
          // ofta sist). Kör FÖRE svensk-översättningen så matchningen sker på
          // råvärdet. Matchar inget → dagens bubbla/text behålls. Se
          // lib/variant-color-image.ts. Detta täcker hela katalogen automatiskt.
          linkVariantImagesByAltText(
            prod.options.choices,
            (res.items[0].media?.items || []).map((it: any) => ({ url: it?.image?.url, altText: it?.image?.altText })),
          );
          // SIST, efter ALL intern matchning (variantId/colorOf i extractOptions)
          // och bildhydrering ovan (som matchar på det engelska RÅvärdet): byt
          // ut visnings­etiketterna mot svenska. Wix låser choice-värdena, så
          // detta är enda säkra vägen att visa svenska. Se lib/option-i18n.
          for (const ch of prod.options.choices) ch.label = swedishChoiceValue(ch.label);
          prod.options.name = swedishOptionName(prod.options.name);
        }
        // PDP:n ska visa ALLA importerade bilder, inte SDK-listans kapade 6.
        // Hämta hela galleriet auktoritativt från V3 (delar cache:ade anropet).
        // Strikt additivt: ersätt bara när V3 har FLER bilder → aldrig en regression
        // för migrerade produkter där V3 saknar itemsInfo (då behålls SDK-galleriet).
        const { urls: fullGallery, alts: v3Alts } = await fetchV3Gallery(prod.id);
        // V3:s alt-texter slås ihop med SDK-listans (V3 vinner — den är
        // auktoritativ för PDP-galleriet). Sker oavsett om galleriet ersätts
        // nedan, så även produkter där SDK-galleriet behålls får sina alt-texter.
        if (Object.keys(v3Alts).length) {
          prod.imageAlts = { ...(prod.imageAlts || {}), ...v3Alts };
        }
        if (fullGallery.length > prod.gallery.length) {
          // Uteslut den galleribild som är SAMMA FIL som huvudbilden (prod.img).
          // SDK:ns mainMedia-URL och V3:s itemsInfo-URL skiljer sig i transform-params
          // men är samma foto → page.tsx:s [p.img, ...gallery] (Set på exakt URL) skulle
          // annars visa hjältebilden två gånger. Jämför på fil-id (imgKey).
          const mainKey = imgKey(prod.img);
          const deduped = fullGallery.filter((u) => imgKey(u) !== mainKey);
          // Ersätt BARA om V3 lägger till något UTÖVER hjälten. Är deduped tom (enda
          // V3-bilden ÄR hjälten) lämnas galleriet orört → page.tsx visar p.img EN gång
          // (annars hade fallback till fullGallery=[hjälten] gett dubbel hjälte igen).
          if (deduped.length) prod.gallery = deduped;
        }
        // Vilken variant varje galleribild tillhör (mediaKey → etikett) — för att
        // markera ALLA den valda variantens bilder i galleriet. Delar cache:ade V3-
        // anropet. Fail-open: {} om nyckel/data saknas → ingen markering, allt annat
        // oförändrat.
        prod.imageOwners = await fetchV3ImageOwners(prod.id);
        return prod;
      }
    } catch (e) { console.error("[wix] getProduct failed:", (e as Error).message); }
  }
  const list = await getProducts();
  return list.find((p) => p.slug === slug);
});

export async function getProductSlugs(): Promise<string[]> {
  const list = await getProducts();
  return list.map((p) => p.slug);
}

/** Slug + äkta senast-ändrad för sitemapens lastmod (0 = okänt → utelämnas). */
export async function getProductSitemapEntries(): Promise<{ slug: string; updatedAt: number }[]> {
  const list = await getProducts();
  return list.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

// Hybrid slut-i-lager (Feature 1): dölj slutsålda produkter från LISTNINGARNA
// (/butik, /alla-produkter, /kategori/*) men behåll produktsidan nåbar (sidan
// renderar med "Slutsåld"-banner + bevakningsformulär). Wix sätter inventory=0
// på slutsålda produkter via sync-cronen; här filtrerar vi bort dem ur listor.
//
// SEDAN 2026-08-04: PÅ som default. Slutsålda produkter är återvändsgränder när
// man bläddrar (39 av 452 = vart elfte kort), och de bästa butikerna visar dem
// inte i bläddringsflödet. Nödbroms: SHOW_OOS_IN_LISTINGS=1 återställer det
// gamla beteendet utan deploy. (Gamla HIDE_OOS_FROM_LISTINGS=1 accepteras
// fortfarande, men är nu en no-op eftersom det redan är default.)
//
// Vad filtret INTE rör — medvetet:
//   • produktsidan (renderar alltid, med "Slutsåld"-banner + bevakningsformulär)
//   • sitemap + Google/Meta-feeds (feeds ska MARKERA slutsålt, inte utelämna det
//     — utelämnade artiklar tappar sin historik hos Google)
//   • SÖK: en sökning är avsiktsstyrd ("jag vill ha JUST den varan"), så träffen
//     ska hittas — men rankas sist och märkt (se app/sok + components/searchbox).
export function hideOosFromListings(): boolean {
  return process.env.SHOW_OOS_IN_LISTINGS !== "1";
}

/** Filtrerar bort slutsålda produkter ur en listning om flaggan är på. */
export function forListings(products: Product[]): Product[] {
  if (!hideOosFromListings()) return products;
  return products.filter((p) => p.inStock);
}

// Nyast skapade först. Används av /alla-produkter så senast importerade produkter
// hamnar överst (Leonards önskemål 2026-06-14). Stabil tie-break på id så
// produkter med okänt createdAt (0) inte hoppar mellan renderingar. (mixByCategory
// nedan var alla-produkters enda anropare och är nu oanvänd — lämnad orörd; kan
// städas i en separat cleanup.)
export function sortByNewest(products: Product[]): Product[] {
  return [...products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

// Slim produktform för LISTSIDORNA. Samma princip som RecoProduct nedan, men
// för /alla-produkter och /kategori — där den kostar betydligt mer.
//
// MÄTT PÅ SKARP SAJT 2026-08-22: /alla-produkter vägde 2 704 kB, varav 85 %
// var RSC-nyttolast. Hela Product-objektet för 787 produkter serialiserades
// till webbläsaren, och 1 005 kB av det — 46 % — var fält klienten aldrig
// läser: imageAlts 546 kB, gallery 364 kB, variants 74 kB.
//
// Fälten här är kartlagda ur de tre ställen som faktiskt kör i klienten:
// components/productcard.tsx, components/shopbrowser.tsx, och sorteringen i
// lib/sort-products.ts (orderRecommended/orderPopular läser collectionIds,
// createdAt, id, onSale, popularity, rating) plus universalCollectionIds i
// lib/related-pick.ts.
//
// Product är strukturellt tilldelningsbar till den här typen, så komponenter
// som tar emot ListProduct fungerar oförändrat för de anropare som skickar
// hela Product (produktsidans relaterade produkter, price-tier-page,
// for-dig-som). Bara listsidorna mappar ner.
export type ListProduct = {
  id: string;
  slug: string;
  name: string;
  img: string;
  /** Hover-bilden, förberäknad. Kortet plockade tidigare ut ETT element ur
   *  hela gallery[] — att skicka listan kostade 364 kB för de 787 produkterna. */
  altImg?: string;
  /** Behålls valfri så anropare som skickar hela Product fungerar oförändrat. */
  gallery?: string[];
  price: string;
  priceNum: number;
  priceFrom?: string;
  priceFromNum?: number;
  originalPrice?: string;
  originalPriceNum?: number;
  hasRange?: boolean;
  onSale?: boolean;
  inStock: boolean;
  stockQuantity?: number;
  colors?: string[];
  /* INGEN `ribbon` HÄR — MEDVETET. Kortet hade en "Bästsäljare"-bricka som
   * grindade på ribbon === "Bestseller". Mätt på skarp katalog 2026-09-04:
   * fältet var "EU-lager" på 1 618 av 1 619 produkter, "Slut i lager" på en,
   * och "Bestseller" på NOLL — brickan kunde alltså inte visas för någon, men
   * strängen kostade 38 860 B per listsida. Brickan och dess CSS är borttagna
   * (Leonard 2026-09-04). Bestseller lever kvar SERVER-SIDE som utslagsgivare
   * i cartRecommendations, generateStaticParams och /kategori/populara — de
   * har redan dokumenterade reservregler för att taggen saknas, och kostar
   * klienten ingenting. */
  rating?: { stars: number; exact: number; value: string; count: number };
  collectionIds?: string[];
  createdAt?: number;
  popularity?: number;
};

/** Product → ListProduct. Enda stället som vet vad listsidorna skickar vidare.
 *
 * TOMMA FÄLT SKRIVS INTE UT. En nyckel med värdet undefined är inte gratis i
 * RSC-nyttolasten — flight-formatet serialiserar den som `"colors":"$undefined"`,
 * alltså nyckelnamnet OCH en elva tecken lång platshållare, och varje citattecken
 * kostar två byte i HTML:en eftersom strömmen ligger i en JS-sträng.
 *
 * Mätt på skarp /alla-produkter 2026-09-04 (1 622 produkter): 325 362 byte av
 * sidans HTML var fält med defaultvärde. colors var "$undefined" för samtliga
 * 1 622 (42 172 B), popularity 0 för samtliga (27 574 B), originalPriceNum tomt
 * för 1 581 (56 916 B), priceFromNum för 1 495 (47 840 B), originalPrice 36 363,
 * rating 30 810, priceFrom 28 405, hasRange 28 405, onSale 26 877.
 *
 * Att utelämna dem är inte en beteendeändring: varje läsare grindar redan på
 * ?? eller truthiness (p.popularity ?? 0, p.collectionIds || [], p.onSale &&,
 * typeof p.stockQuantity === "number"), så en saknad nyckel och en nyckel med
 * default-värdet räknas likadant. Lägger du till ett fält här: kontrollera att
 * läsaren tål att det saknas, annars skriv ut det ovillkorligt. */
export function forClient(products: Product[]): ListProduct[] {
  // KATEGORI-ID:N SKICKAS SOM KORTA TOKENS, INTE SOM GUID:er.
  //
  // Mätt på skarp /alla-produkter 2026-09-04: 4 867 kategorireferenser fördelade
  // på bara 47 unika kategorier. Varje referens är en 36 tecken lång GUID —
  // 231 927 B, det enskilt tyngsta fältet i klient-nyttolasten.
  //
  // Klienten behöver ALDRIG det riktiga id:t. Auditen gick igenom varje läsare:
  //   · universalCollectionIds (lib/related-pick) räknar FREKVENS per id
  //   · groupKeyForMix (lib/sort-products) tar FÖRSTA icke-universella id:t
  //   · interleaveByGroup bucketar på nyckeln och ordnar bucketarna efter
  //     insättningsordning, eller vikt + ursprungsindex — ALDRIG efter
  //     nyckelns textvärde
  // Ingen av dem jämför mot ett känt GUID, och ShopBrowser rör inte fältet alls
  // (underkategori-chipsen är länkar, inget klientfilter). En bijektiv
  // omdöpning ger därför exakt samma gruppering och exakt samma ordning — se
  // testet i lib/sort-products.test.ts som låser det.
  //
  // Det spelar roll att ordningen är BEVISAT identisk: /alla-produkter
  // förberäknar orderRecommended på servern med de riktiga GUID:erna och låter
  // klienten räkna om den. Skilde sig de två skulle rutnätet kastas om vid
  // hydrering (uppmätt 25,9 % omflyttning när server och klient var oense).
  //
  // Tokens är rena siffror; groupKeyForMix reservnyckel är "__egen:<id>" —
  // de kan alltså aldrig krocka. Numreringen är per anrop, vilket räcker: den
  // ska bara särskilja kategorier INOM den lista sidan skickar.
  const token = new Map<string, string>();
  const tokenFor = (id: string): string => {
    let t = token.get(id);
    if (t === undefined) {
      t = String(token.size);
      token.set(id, t);
    }
    return t;
  };
  return products.map((p) => {
    // De sju fälten varje kort behöver oavsett produkt.
    const lp: ListProduct = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      img: p.img,
      price: p.price,
      priceNum: p.priceNum,
      inStock: p.inStock,
    };
    const altImg = p.gallery?.find((g) => g !== p.img);
    if (altImg) lp.altImg = altImg;
    if (p.priceFrom) lp.priceFrom = p.priceFrom;
    if (p.priceFromNum) lp.priceFromNum = p.priceFromNum;
    if (p.originalPrice) lp.originalPrice = p.originalPrice;
    if (p.originalPriceNum) lp.originalPriceNum = p.originalPriceNum;
    if (p.hasRange) lp.hasRange = true;
    if (p.onSale) lp.onSale = true;
    // 0 kvar i lager är ett riktigt värde, inte en avsaknad — typkollen, inte
    // truthiness, avgör här.
    if (typeof p.stockQuantity === "number") lp.stockQuantity = p.stockQuantity;
    if (p.colors?.length) lp.colors = p.colors;
    if (p.rating) lp.rating = p.rating;
    if (p.collectionIds?.length) lp.collectionIds = p.collectionIds.map(tokenFor);
    if (p.createdAt) lp.createdAt = p.createdAt;
    if (p.popularity) lp.popularity = p.popularity;
    return lp;
  });
}

// Slim produktform för cart-drawerns "Andra köpte också"-block — bara de fält
// klienten behöver, så vi inte serialiserar hela Product[] in i klient-payloaden.
export type RecoProduct = { id: string; slug: string; name: string; img: string; price: string };

// Rekommendationer till cart-drawern. Vi saknar riktig "frequently bought
// together"-orderdata, så vi approximerar med bästsäljare / bäst presenterade
// produkter i lager (ribbon=Bestseller först, därefter högst bild-poäng).
// dedupeProducts ser till att inga dubbletter eller samma bild listas.
export function cartRecommendations(products: Product[], collections: Collection[], limit = 8): RecoProduct[] {
  const inStock = products.filter((p) => p.inStock && p.img);
  const ranked = [...inStock].sort((a, b) => {
    const ba = a.ribbon === "Bestseller" ? 1 : 0;
    const bb = b.ribbon === "Bestseller" ? 1 : 0;
    if (ba !== bb) return bb - ba;
    return (b.imageScore ?? 60) - (a.imageScore ?? 60);
  });
  // Sprid rekommendationerna ÖVER avdelningar (round-robin per huvudkategori) i stället
  // för 8 ur samma kategori → bättre cross-sell. mixByCategory behåller kvalitetsordningen
  // inom varje bucket, så round-robin plockar "bästa från varje avdelning".
  const mixed = mixByCategory(ranked, collections);
  return dedupeProducts(mixed).slice(0, limit).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    img: p.img,
    // RecoProduct är en ren visnings-DTO — strängen här renderas rakt av i
    // cart-drawern. Den formateras därför som överallt annars ("1 929 kr"),
    // annars hade varukorgen varit den enda ytan kvar med Wix "1 929,00kr".
    price: p.hasRange
      ? `Från ${p.priceFromNum ? formatPrice(p.priceFromNum) : p.priceFrom}`
      : p.priceNum
        ? formatPrice(p.priceNum)
        : p.price,
  }));
}

// Wixstatic-bildens fil-id (samma fil kan levereras med olika transform-params,
// w_400 vs w_800), så vi jämför på id:t — inte hela URL:en. Exporterad så
// produktfeeden kan deduppa extra-bilder mot huvudbilden på samma nyckel.
// imgKey bor i lib/image-alt (beroendefri, delas med klientkomponenter) men
// re-exporteras här eftersom flera moduler redan importerar den härifrån.
export { imgKey };

// HELA katalogens gallerier i EN batchad svep — för produktfeeden
// (/feed/products.xml). List-frågans galleri kapas till 6 bilder (mapProduct),
// så feeden kunde bara skicka max 5 extra-bilder trots att Wix lagrar upp till
// 15. V3-query med fields MEDIA_ITEMS_INFO ger allt på ~4 cursor-paginerade
// anrop (100/sida) i stället för ett GET per produkt (378 st). Returnerar
// produkt-id → galleri-URL:er i Wix-ordning (dedupade på fil-id; första =
// huvudbilden). Fail-open: tom Map vid saknad nyckel/fel → feeden faller
// tillbaka på det kapade galleriet (dagens beteende, aldrig sämre).
// ALLA varianter i katalogen (Read-Only Variants V3) — för Google Merchant-
// feeden (/feed/google.xml) som listar EN item per variant. Cursor-paginerat
// med 1000/anrop (~2 anrop för hela katalogen) och retry/backoff: den gamla
// externa feed-tjänsten gjorde många små Wix-anrop per request, slog i rate
// limit och levererade olika många produkter varje gång. Fail-open: [] vid
// fel — feed-rutten svarar då med tom kanal hellre än 500 (Google behåller
// senast lyckade hämtningen).
export async function fetchAllVariantsRaw(): Promise<any[]> {
  if (!WIX_API_KEY) return [];
  const out: any[] = [];
  try {
    let cursor: string | undefined;
    for (let page = 0; page < 10; page++) { // hård gräns 10 000 varianter
      let data: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch("https://www.wixapis.com/stores/v3/products/query-variants", {
            method: "POST",
            headers: { Authorization: WIX_API_KEY, "wix-site-id": WIX_SITE_ID, "Content-Type": "application/json" },
            body: JSON.stringify({ query: { cursorPaging: cursor ? { limit: 1000, cursor } : { limit: 1000 } } }),
          });
          if (res.ok) { data = await res.json(); break; }
          // 429/5xx → backoff och försök igen; 4xx i övrigt är permanent
          if (res.status !== 429 && res.status < 500) break;
        } catch { /* nätverksfel → backoff */ }
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1) ** 2));
      }
      if (!data) break;
      out.push(...(data.variants || []));
      cursor = data?.pagingMetadata?.cursors?.next || undefined;
      if (!cursor || !data?.pagingMetadata?.hasNext) break;
    }
  } catch (e) {
    console.error("[wix] fetchAllVariantsRaw failed:", (e as Error).message);
  }
  return out;
}

export async function fetchFeedGalleries(): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (!WIX_API_KEY) return out;
  try {
    let cursor: string | undefined;
    for (let page = 0; page < 12; page++) { // hård gräns ~1200 produkter
      const res = await fetch("https://www.wixapis.com/stores/v3/products/query", {
        method: "POST",
        headers: { Authorization: WIX_API_KEY, "wix-site-id": WIX_SITE_ID, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: ["MEDIA_ITEMS_INFO"],
          query: { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } },
        }),
      });
      if (!res.ok) break;
      const data = await res.json();
      for (const p of data?.products || []) {
        const seen = new Set<string>();
        const urls: string[] = [];
        for (const it of p?.media?.itemsInfo?.items || []) {
          const url = it?.image?.url;
          if (typeof url !== "string" || !url) continue;
          const k = imgKey(url);
          if (seen.has(k)) continue;
          seen.add(k);
          urls.push(url);
        }
        if (p?.id && urls.length) out.set(p.id, urls);
      }
      cursor = data?.pagingMetadata?.cursors?.next || undefined;
      if (!cursor || !data?.pagingMetadata?.hasNext) break;
    }
  } catch (e) {
    console.error("[wix] fetchFeedGalleries failed:", (e as Error).message);
  }
  return out;
}

// Defensiv render-lags-dedup för produktrader. getProducts() kollapsar redan
// dubbletter per id (källan), men en enskild rad kan fortfarande råka rendera
// SAMMA produkt eller SAMMA bild två gånger om den byggs ihop av flera urval
// (t.ex. curated-front + poäng-sorterad svans, eller två importer som delar
// samma foto). Detta var Leonards "samma produktbild två gånger i rad" i
// Mobiltillbehör. Vi släpper igenom varje produkt-id OCH varje bild-fil bara en
// gång, så två kort aldrig kan visa samma foto bredvid varandra.
export function dedupeProducts(list: Product[]): Product[] {
  const seenId = new Set<string>();
  const seenImg = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    const k = imgKey(p.img);
    if (seenId.has(p.id) || (k && seenImg.has(k))) continue;
    seenId.add(p.id);
    if (k) seenImg.add(k);
    out.push(p);
  }
  return out;
}

// Re-order products so categories are INTERLEAVED (round-robin) instead of clustered —
// gives a varied "mix" for "Veckans fynd" and the default butik order instead of e.g.
// 50 toys in a row. Each product is bucketed by its first matching collection (collections
// are main-category-first ordered), then we round-robin across buckets.
export function mixByCategory(products: Product[], collections: Collection[]): Product[] {
  const buckets = new Map<string, Product[]>();
  for (const c of collections) buckets.set(c.id, []);
  const placed = new Set<string>();
  for (const p of products) {
    const col = collections.find((c) => (p.collectionIds || []).includes(c.id));
    if (col) { buckets.get(col.id)!.push(p); placed.add(p.slug); }
  }
  const out: Product[] = [];
  const idx = new Map<string, number>();
  collections.forEach((c) => idx.set(c.id, 0));
  let added = true;
  while (added) {
    added = false;
    for (const c of collections) {
      const arr = buckets.get(c.id)!;
      const i = idx.get(c.id)!;
      if (i < arr.length) { out.push(arr[i]); idx.set(c.id, i + 1); added = true; }
    }
  }
  for (const p of products) if (!placed.has(p.slug)) out.push(p); // uncategorised → end
  return out;
}

// `parentId` mirrors Wix V3 `parentCategory._id` (null for the 8 top-level
// categories); `index` is the merchant-defined sibling order within the parent.
// These let lib/category-groups#buildCategoryTree reconstruct the real two-level
// hierarchy straight from the catalog instead of a hardcoded name map.
export type Collection = { id: string; name: string; slug: string; parentId: string | null; index: number };

// Top-level (parentless) categories shown first; everything else follows. The
// Wix V3 restructure (2026-05-31) made the 8 mains exactly the parentless
// categories, ordered here by catalog size (largest first).
const MAIN_ORDER = [
  "Elektronik & Tillbehör", "Hem & Inredning", "Kök & Husgeråd", "Barn & Familj",
  "Skönhet & Hälsa", "Husdjur", "Sport & Fritid", "Mode & Accessoarer",
];

let collectionsPromise: Promise<Collection[]> | null = null;

// ASCII-safe slug from the category name. Wix slugs contain å/ä/ö (e.g. "kök",
// "hörlurar") which Next.js dynamic routes mishandle → 404. We derive our own ASCII
// slug instead; it's only an internal URL id (we match products by collectionId, not slug).
function asciiSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[åä]/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchCollections(): Promise<Collection[]> {
  if (!wix) return [];
  try {
    // V3 Categories API (the new site is on Catalog V3). The query requires at
    // least one filter clause, so we use an always-true ne() against a fake id.
    const [res, products] = await Promise.all([
      (wix as any).categories
        .queryCategories({ treeReference: { appNamespace: "@wix/stores" } })
        .ne("_id", "00000000-0000-0000-0000-000000000000")
        .limit(100)
        .find(),
      getProducts(),
    ]);
    // Collection ids som innehåller ≥1 KÖPBAR produkt (tomma kategorier tas bort
    // helt). forListings gör att en kategori vars enda produkter är slutsålda
    // också försvinner ur navigationen — annars leder menyn till en sida utan
    // ett enda köpbart kort. Kategorisidan 307:ar då till /butik och SJÄLVLÄKER:
    // fylls varan på finns kategorin här igen vid nästa revalidate.
    const used = new Set<string>();
    for (const p of forListings(products)) for (const cid of (p.collectionIds || [])) used.add(cid);

    // TOM-FILTRET FÅR ALDRIG BLANKA NAVIGATIONEN (Leonards rapport 2026-08-16:
    // "0 kategorier" på startsidan och /alla-produkter, som kom och gick).
    //
    // Filtret finns för att dölja ENSKILDA kategorier utan köpbara produkter.
    // Men `used` byggs ur produktlistan, och när den kommer tillbaka utan
    // collectionIds — nödkatalogen har alltid tomma, och SDK:ns queryProducts
    // har visat sig tappa fält — blir `used` tom och då sållas ALLA kategorier
    // bort. "Vi vet inte vilka kategorier som används" är inte samma sak som
    // "ingen kategori används", och skillnaden syntes direkt för kunden: hela
    // kategorimenyn försvann.
    //
    // Kan vi inte se en enda kategorianvändning är signalen värdelös → hoppa
    // över filtret och visa kategorierna. Hellre en kategori som råkar vara tom
    // än ingen navigation alls.
    const kategoriSignalFinns = categorySignalIsUsable(used.size);
    if (!kategoriSignalFinns) {
      console.error(
        `[wix] getCollections: ${products.length} produkter men NOLL collectionIds — `
          + "tom-filtret hoppas över för att inte blanka kategorimenyn.",
      );
    }

    const seen = new Set<string>();
    const list: Collection[] = (res.items || [])
      .map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        parentId: (c.parentCategory && c.parentCategory._id) || null,
        index: (c.parentCategory && typeof c.parentCategory.index === "number") ? c.parentCategory.index : 0,
      }))
      .filter((c: { id: string; name: string }) =>
        c.id && c.name && !/all products/i.test(c.name) && keepCategory(c.id, used))
      .map((c: { id: string; name: string; parentId: string | null; index: number }) => {
        let slug = asciiSlug(c.name);
        while (!slug || seen.has(slug)) slug = (slug || "kategori") + "-" + c.id.slice(-4);
        seen.add(slug);
        return { id: c.id, name: c.name, slug, parentId: c.parentId, index: c.index };
      });
    list.sort((a, b) => {
      const ia = MAIN_ORDER.indexOf(a.name), ib = MAIN_ORDER.indexOf(b.name);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.name.localeCompare(b.name, "sv");
    });
    // CACHA ALDRIG EN TOM KATEGORILISTA. collectionsPromise lever hela lambdans
    // livstid, så en enda dålig hämtning frös förr "0 kategorier" tills just den
    // instansen återvanns — därav att menyn försvann, kom tillbaka och försvann
    // igen beroende på vilken instans som svarade. Katalogen har alltid
    // kategorier; tomt betyder att något gick fel, inte att de är borta.
    if (list.length === 0) {
      console.error(
        `[wix] getCollections gav 0 kategorier (${(res.items || []).length} råa, `
          + `${products.length} produkter) — cachar INTE, nästa request försöker igen.`,
      );
      collectionsPromise = null;
    }
    return list;
  } catch (e) {
    console.error("[wix] getCollections failed:", (e as Error).message);
    collectionsPromise = null; // allow retry on a later request
    return [];
  }
}

export const getCollections = cache((): Promise<Collection[]> => {
  if (!collectionsPromise) collectionsPromise = fetchCollections();
  return collectionsPromise;
});

// Alla KÄNDA kategorislugs — även tomma kategorier (getCollections filtrerar
// bort kategorier utan produkter, vilket självåterupplivnings-designen bygger
// på). Kategorisidan använder denna för att skilja "känd men just nu tom"
// (→ självläkande redirect till /butik, som idag) från "okänd/skräp-slug"
// (→ riktig 404). Utan distinktionen kan /kategori/<vadsomhelst> aldrig 404:a
// → oändligt "giltigt" URL-utrymme som Google återcrawlar för evigt.
// Returnerar null vid API-fel (fail-open: hellre redirect än felaktig 404).
let allCategorySlugsPromise: Promise<Set<string> | null> | null = null;
async function fetchAllCategorySlugs(): Promise<Set<string> | null> {
  if (!wix) return null;
  try {
    const res = await (wix as any).categories
      .queryCategories({ treeReference: { appNamespace: "@wix/stores" } })
      .ne("_id", "00000000-0000-0000-0000-000000000000")
      .limit(100)
      .find();
    const out = new Set<string>();
    for (const c of res.items || []) {
      const id = c && (c._id || c.id);
      if (!c || !c.name || !id) continue;
      const base = asciiSlug(c.name) || "kategori";
      out.add(base);
      // fetchCollections suffixar kolliderande slugs med -{id-svans} — täck
      // även den varianten så en känd-men-tom suffixad kategori redirectar
      // (i stället för att felaktigt 404:a) tills den självåterupplivas.
      out.add(`${base}-${String(id).slice(-4)}`);
    }
    return out;
  } catch (e) {
    console.error("[wix] fetchAllCategorySlugs failed:", (e as Error).message);
    allCategorySlugsPromise = null; // tillåt retry vid senare request
    return null;
  }
}
export const getAllCategorySlugs = cache((): Promise<Set<string> | null> => {
  if (!allCategorySlugsPromise) allCategorySlugsPromise = fetchAllCategorySlugs();
  return allCategorySlugsPromise;
});
