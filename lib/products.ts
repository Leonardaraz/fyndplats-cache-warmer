import { cache } from "react";
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts } from "@wix/stores";
import { categories as wixCategories } from "@wix/categories";
import local from "../products.json";
import variantImages from "../data/variant-images.json";
import { imageScoreOf, imageRecordOf } from "./image-scores";

export type Product = {
  id: string;
  variants: { id: string; label: string }[];
  collectionIds: string[];
  name: string;
  slug: string;
  price: string;
  currency: string;
  priceNum: number;
  priceFrom?: string;
  hasRange?: boolean;
  img: string;
  gallery: string[];
  blurb: string;
  specs: string;
  inStock: boolean;
  stockQuantity?: number;
  ribbon?: string;
  originalPrice?: string;
  onSale?: boolean;
  descriptionHtml?: string;
  options?: { name: string; choices: { label: string; image: string; color: string; variantId: string; price: string; priceNum: number; originalPrice: string }[] } | null;
  // Bildkvalitets-poäng (Claude vision, se lib/image-scores.ts). Styr ordningen
  // på startsida/kategori/alla-produkter. DEFAULT_SCORE för opoängsatta produkter.
  imageScore: number;
  imageFlags: string[];
};

// Färgnamn → CSS hex för premium color-swatch när per-choice bilder saknas.
// V3-migrationen tappade bilder per ch.media på många produkter; vi visar då
// färgade cirklar baserat på chovärdets namn istället för fula text-pills.
const COLOR_HEX: Record<string, string> = {
  vit: "#FFFFFF", white: "#FFFFFF",
  svart: "#1c1c1c", black: "#1c1c1c",
  grå: "#9ca3af", grey: "#9ca3af", gray: "#9ca3af",
  röd: "#dc2626", red: "#dc2626",
  blå: "#2563eb", blue: "#2563eb",
  grön: "#16804a", green: "#16804a",
  gul: "#fbbc05", yellow: "#fbbc05",
  orange: "#f47a35",
  rosa: "#fbcfe8", pink: "#fbcfe8",
  lila: "#a855f7", purple: "#a855f7", violett: "#a855f7",
  beige: "#e8d4b3", khaki: "#c3b091",
  brun: "#92400e", brown: "#92400e", tan: "#d2b48c",
  guld: "#d4af37", gold: "#d4af37",
  silver: "#c0c0c0",
  turkos: "#06b6d4", turquoise: "#06b6d4", teal: "#0d9488",
  petrol: "#005f73",
  natur: "#e0d3c1", naturlig: "#e0d3c1",
  marin: "#1e3a8a", navy: "#1e3a8a",
  vinröd: "#7f1d1d", burgundy: "#7f1d1d", bordeaux: "#7f1d1d",
  champagne: "#f7e7ce",
  cream: "#fefce8", creme: "#fefce8",
  ko: "#fefce8", cow: "#fefce8",
  tiger: "#f59e0b",
};

function colorOf(name: string): string {
  const k = (name || "").toLowerCase().trim();
  if (COLOR_HEX[k]) return COLOR_HEX[k];
  for (const [key, hex] of Object.entries(COLOR_HEX)) {
    if (k.includes(key)) return hex;
  }
  return "";
}

// Public Wix Headless OAuth client ID for wix-vibe-site-u4lp (V3 catalog).
// NOT a secret — it ships client-side via NEXT_PUBLIC_ and is visible to every
// browser visitor. Hardcoded directly (instead of reading process.env) because
// stale Vercel env vars on production pointed at the old Fyndplats V1 site and
// would break the V3 categories API on the new site.
const CLIENT_ID = "3d8fdd09-3b3c-475f-aac2-b6bfa9e05153";

const wix = CLIENT_ID
  ? createClient({ modules: { products: wixProducts, categories: wixCategories }, auth: OAuthStrategy({ clientId: CLIENT_ID }) })
  : null;

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
  const variants = ((p.variants) || [])
    .map((v: any) => ({ id: v._id, label: Object.values(v.choices || {}).join(" / ") || "Standard" }))
    .filter((v: any) => v.id);
  // Pris-spann (Wix priceRange) → "Från X kr" på kort/listor när varianter har olika pris.
  // Annars (min === max eller saknas) visas det vanliga priset. Defensivt: degraderar utan fel.
  const pr = p.priceRange || {};
  const minV = typeof pr.minValue === "number" ? pr.minValue : null;
  const maxV = typeof pr.maxValue === "number" ? pr.maxValue : null;
  const hasRange = minV != null && maxV != null && minV < maxV;
  const pid = p._id || p.id || "";
  return {
    id: pid,
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
