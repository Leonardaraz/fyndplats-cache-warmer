import { createClient, OAuthStrategy } from "@wix/sdk";
import { products as wixProducts, collections as wixCollections } from "@wix/stores";
import local from "../products.json";

export type Product = {
  id: string;
  variants: { id: string; label: string }[];
  collectionIds: string[];
  name: string;
  slug: string;
  price: string;
  currency: string;
  priceNum: number;
  img: string;
  gallery: string[];
  blurb: string;
  specs: string;
  inStock: boolean;
  originalPrice?: string;
  onSale?: boolean;
  descriptionHtml?: string;
  options?: { name: string; choices: { label: string; image: string; variantId: string; price: string; originalPrice: string }[] } | null;
};

// Public Wix Headless OAuth client ID (anonymous visitor; also shipped client-side via
// NEXT_PUBLIC_ — not a secret). Hardcoded fallback so every environment (incl. Vercel
// Preview) loads the live catalog even when the env var isn't configured there.
const CLIENT_ID = process.env.WIX_CLIENT_ID || process.env.NEXT_PUBLIC_WIX_CLIENT_ID || "f463b067-a1ab-4e6d-92c5-444c588e28d8";

const wix = CLIENT_ID
  ? createClient({ modules: { products: wixProducts, collections: wixCollections }, auth: OAuthStrategy({ clientId: CLIENT_ID }) })
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
  return {
    id: p._id || p.id || "",
    variants,
    collectionIds: p.collectionIds || [],
    name: p.name || "",
    slug: p.slug || "",
    price: (p.price && p.price.formatted && (p.price.formatted.discountedPrice || p.price.formatted.price)) || "",
    currency: (p.price && p.price.currency) || "SEK",
    priceNum: (p.price && (p.price.discountedPrice ?? p.price.price)) || 0,
    originalPrice: (p.price && p.price.discountedPrice != null && p.price.discountedPrice < p.price.price) ? (p.price.formatted?.price || "") : "",
    onSale: !!(p.price && p.price.discountedPrice != null && p.price.discountedPrice < p.price.price),
    img: (p.media && p.media.mainMedia && p.media.mainMedia.image && p.media.mainMedia.image.url) || gallery[0] || "",
    gallery: gallery.slice(0, 6),
    blurb: stripHtml(firstP ? firstP[1] : p.description || "").slice(0, 220),
    specs: stripHtml(specsSection ? specsSection.description : "").slice(0, 400),
    inStock: !!(p.stock && p.stock.inStock),
  };
}

// Per-choice variant images (powers the gallery ↔ variant ↔ cart sync on the product page).
// Only returned when an option has ≥2 choices that each carry their own image.
function extractOptions(raw: any): Product["options"] {
  const opt = (raw.productOptions || [])[0];
  if (!opt || (opt.choices || []).length < 2) return null;
  const variants = raw.variants || [];
  const choices = (opt.choices || []).map((ch: any) => {
    const v = variants.find((vv: any) => vv.choices?.[opt.name] === ch.value);
    const pd = v?.variant?.priceData;
    const onSale = pd && pd.discountedPrice != null && pd.discountedPrice < pd.price;
    return {
      label: ch.value,
      image: ch.media?.mainMedia?.image?.url || "",
      variantId: v?._id || "",
      price: pd?.formatted?.discountedPrice || pd?.formatted?.price || "",
      originalPrice: onSale ? (pd.formatted?.price || "") : "",
    };
  }).filter((c: any) => c.variantId && c.image);
  return choices.length >= 2 ? { name: opt.name, choices } : null;
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
    console.log(`[wix] live products loaded: ${mapped.length}`);
    return mapped.length ? mapped : (local as Product[]);
  } catch (e) {
    console.error("[wix] live fetch failed, using local fallback:", (e as Error).message);
    productsPromise = null; // allow retry on a later request
    return local as Product[];
  }
}

// Promise-cached so concurrent callers (page + header) share ONE request, not parallel ones.
export function getProducts(): Promise<Product[]> {
  if (!productsPromise) productsPromise = fetchProducts();
  return productsPromise;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (wix) {
    try {
      const res: any = await (wix as any).products.queryProducts().eq("slug", slug).limit(1).find();
      if (res.items?.[0]) {
        const prod = mapProduct(res.items[0]);
        prod.options = extractOptions(res.items[0]);
        prod.descriptionHtml = res.items[0].description || "";
        return prod;
      }
    } catch (e) { console.error("[wix] getProduct failed:", (e as Error).message); }
  }
  const list = await getProducts();
  return list.find((p) => p.slug === slug);
}

export async function getProductSlugs(): Promise<string[]> {
  const list = await getProducts();
  return list.map((p) => p.slug);
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

export type Collection = { id: string; name: string; slug: string };

// Main categories shown first (in this order); everything else follows alphabetically.
const MAIN_ORDER = [
  "Elektronik", "Mobil & Surfplatta", "Ljud & Hörlurar", "Dator & Gaming",
  "Hem & Inredning", "Kök & Matlagning", "Köksredskap & Tillbehör", "Hemtextil & Badrum",
  "Mode & Accessoarer", "Kläder & Skor", "Smycken",
  "Hudvård & Ansikte", "Kropp & Välbefinnande",
  "Husdjur", "Barn & Familj", "Leksaker & Spel", "Friluftsliv & Resa",
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
    const [res, products] = await Promise.all([
      (wix as any).collections.queryCollections().limit(100).find(),
      getProducts(),
    ]);
    // Collection ids that actually contain ≥1 product (drop empty categories entirely).
    const used = new Set<string>();
    for (const p of products) for (const cid of (p.collectionIds || [])) used.add(cid);

    const seen = new Set<string>();
    const list: Collection[] = (res.items || [])
      .map((c: any) => ({ id: c._id || c.id, name: c.name }))
      .filter((c: { id: string; name: string }) => c.id && c.name && !/all products/i.test(c.name) && used.has(c.id))
      .map((c: { id: string; name: string }) => {
        let slug = asciiSlug(c.name);
        while (!slug || seen.has(slug)) slug = (slug || "kategori") + "-" + c.id.slice(-4);
        seen.add(slug);
        return { id: c.id, name: c.name, slug };
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

export function getCollections(): Promise<Collection[]> {
  if (!collectionsPromise) collectionsPromise = fetchCollections();
  return collectionsPromise;
}
