import { cache } from "react";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts } from "@wix/stores";
import { categories as wixCategories } from "@wix/categories";
import local from "../products.json";
import variantImages from "../data/variant-images.json";
import { imageScoreOf, imageRecordOf } from "./image-scores";
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
  price: string;
  currency: string;
  priceNum: number;
  priceFrom?: string;
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
  // Bildkvalitets-poäng (Claude vision, se lib/image-scores.ts). Styr ordningen
  // på startsida/kategori/alla-produkter. DEFAULT_SCORE för opoängsatta produkter.
  imageScore: number;
  imageFlags: string[];
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
async function fetchV3Gallery(productId: string): Promise<string[]> {
  const product = await fetchV3ProductRaw(productId);
  const items = product?.media?.itemsInfo?.items ?? [];
  // Deduppa på fil-id (imgKey) — V3 kan lista samma foto i olika transform-params.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const url = it?.image?.url;
    if (typeof url !== "string" || !url) continue;
    const k = imgKey(url);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(url);
  }
  return out;
}

function stripHtml(h: string): string {
  return (h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProduct(p: any): Product {
  const gallery: string[] = ((p.media && p.media.items) || [])
    .map((it: any) => it?.image?.url)
    .filter(Boolean);
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
    imageScore: imageScoreOf(pid),
    imageFlags: imageRecordOf(pid)?.flags ?? [],
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
    hasRange,
    img: (p.media && p.media.mainMedia && p.media.mainMedia.image && p.media.mainMedia.image.url) || gallery[0] || "",
    gallery: gallery.slice(0, 6),
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

async function fetchProducts(): Promise<Product[]> {
  if (!wix) return local as Product[];
  try {
    const all: any[] = [];
    let skip = 0;
    const limit = 100;
    for (let i = 0; i < 10; i++) {
      const res: any = await (wix as any).products.queryProducts().limit(limit).skip(skip).find();
      const items = res.items || [];
      all.push(...items);
      if (items.length < limit) break;
      skip += limit;
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
    console.log(`[wix] live products loaded: ${unique.length}${unique.length !== mapped.length ? ` (deduped from ${mapped.length})` : ""}`);
    return unique.length ? unique : (local as Product[]);
  } catch (e) {
    console.error("[wix] live fetch failed, using local fallback:", (e as Error).message);
    productsPromise = null; // allow retry on a later request
    return local as Product[];
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
        const fullGallery = await fetchV3Gallery(prod.id);
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

// Hybrid slut-i-lager (Feature 1): dölj slutsålda produkter från LISTNINGARNA
// (/butik, /alla-produkter, /kategori/*) men behåll produktsidan nåbar (sidan
// renderar med "Slutsåld"-banner + bevakningsformulär). Wix sätter inventory=0
// på slutsålda produkter via sync-cronen; här filtrerar vi bort dem ur listor.
//
// Opt-in via HIDE_OOS_FROM_LISTINGS=1 — default AV så att inget i den live:a
// butiken ändras förrän Leonard aktiverar det (matchar SYNC_DRY_RUN-andan:
// produktsidans OOS-UI är redan säker eftersom den bara syns när en produkt
// faktiskt är slut). Produktsidan påverkas ALDRIG av detta filter.
export function hideOosFromListings(): boolean {
  return process.env.HIDE_OOS_FROM_LISTINGS === "1";
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
  return [...products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || a.id.localeCompare(b.id));
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
    price: p.hasRange ? `Från ${p.priceFrom}` : p.price,
  }));
}

// Wixstatic-bildens fil-id (samma fil kan levereras med olika transform-params,
// w_400 vs w_800), så vi jämför på id:t — inte hela URL:en.
function imgKey(url: string): string {
  return (url || "").match(/\/media\/([^/?]+)/)?.[1] || url || "";
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
    // Collection ids that actually contain ≥1 product (drop empty categories entirely).
    const used = new Set<string>();
    for (const p of products) for (const cid of (p.collectionIds || [])) used.add(cid);

    const seen = new Set<string>();
    const list: Collection[] = (res.items || [])
      .map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        parentId: (c.parentCategory && c.parentCategory._id) || null,
        index: (c.parentCategory && typeof c.parentCategory.index === "number") ? c.parentCategory.index : 0,
      }))
      .filter((c: { id: string; name: string }) => c.id && c.name && !/all products/i.test(c.name) && used.has(c.id))
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
