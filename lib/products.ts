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
};

const CLIENT_ID = process.env.WIX_CLIENT_ID || "";

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
    price: (p.price && p.price.formatted && p.price.formatted.price) || "",
    currency: (p.price && p.price.currency) || "SEK",
    priceNum: (p.price && p.price.price) || 0,
    img: (p.media && p.media.mainMedia && p.media.mainMedia.image && p.media.mainMedia.image.url) || gallery[0] || "",
    gallery: gallery.slice(0, 6),
    blurb: stripHtml(firstP ? firstP[1] : p.description || "").slice(0, 220),
    specs: stripHtml(specsSection ? specsSection.description : "").slice(0, 400),
    inStock: !!(p.stock && p.stock.inStock),
  };
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
      if (res.items?.[0]) return mapProduct(res.items[0]);
    } catch (e) { console.error("[wix] getProduct failed:", (e as Error).message); }
  }
  const list = await getProducts();
  return list.find((p) => p.slug === slug);
}

export async function getProductSlugs(): Promise<string[]> {
  const list = await getProducts();
  return list.map((p) => p.slug);
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

async function fetchCollections(): Promise<Collection[]> {
  if (!wix) return [];
  try {
    const res: any = await (wix as any).collections.queryCollections().find();
    const list: Collection[] = (res.items || [])
      .map((c: any) => ({ id: c._id || c.id, name: c.name, slug: c.slug }))
      .filter((c: Collection) => c.id && c.name && c.slug && !/all products/i.test(c.name));
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
