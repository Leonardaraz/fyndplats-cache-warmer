// lib/seo/programmatic.ts
//
// Datalagret för det programmatiska SEO-ramverket. Löser config (types/interests)
// + LIVE-katalogen (getProducts/getCollections, redan promise-cachade) till
// render-färdiga vy-modeller, OCH bestämmer vilka URL:er som är giltiga (quality-
// guards). app/sitemap.ts → lib/site-urls.ts hämtar URL-listan härifrån, så
// sitemap, IndexNow och sidorna kan aldrig drifta isär.
//
// EN SANNINGSKÄLLA FÖR GILTIGHET: varje mönster har en ren "core"-byggare
// (xCore) som tillämpar ALLA quality-guards (produktantal + ordräkning). Både
// listan över giltiga slugs (→ sitemap/generateStaticParams) OCH resolvern (→
// sidrendering) går via samma core. Då kan en URL aldrig hamna i sitemap men
// 404:a vid rendering (eller tvärtom). Cross-länkarna byggs BARA i resolvern och
// slår mot de cachade valid-listorna — core anropar dem aldrig, så ingen rekursion.
//
// QUALITY-GUARDS (mot thin/duplicate-content-straff):
//   • Min 4 produkter (Pattern 1, 2 & 3) — annars utesluts.
//   • Min 250 ord synlig brödtext i <main> (intro + FAQ + produktnamn/priser).
//     INGEN bypass: alla mönster bär samma ordkrav, oavsett produktantal. Nav/
//     footer räknas aldrig — bara content-modellen som renderas i <main>.
//   • Unik H1 + meta per sida — seedad variation + unika slot-data; verifieras i
//     scripts/verify-programmatic-full.mjs.
import { cache } from "react";
import { getProducts, getCollections, dedupeProducts, type Product, type Collection } from "../products";
import { getPosts, type Post } from "../blog";
import typesJson from "./programmatic-types.json";
import interestsJson from "./programmatic-interests.json";
import * as T from "./programmatic-templates";

export const SITE = "https://www.fyndplats.se";
export const PRICE_TIERS = [200, 500, 1000] as const;

// MIN_PRODUCTS lyftes från 3 → 4 (fix(seo) 2026-06-02): tar bort 6-product
// bypass i tierCore och stramar floor mot thin content. Blast radius mot live
// Wix-katalog (scripts/blast-radius.mjs): 15.0% av sidor faller ur (3/20),
// vilket precis möter 15%-budgeten. Lägre tröskel (T=3) hade ingen blast radius
// men lät tunnare basta-i-test-sidor leva vidare; högre (T=5) hade tagit 40%.
const MIN_PRODUCTS = 4; // Pattern 1 & 2
const MIN_INTEREST = 4; // Pattern 3
const MIN_BODY_WORDS = 250; // <main>-brödtext; gemensam tröskel för ALLA mönster (ingen bypass)
const MAX_TYPE_LIST = 5; // bäst-i-test: 3–5 produkter
const MAX_TIER_LIST = 24; // pris-tier: produktlista
const MAX_INTEREST_LIST = 8; // för-dig-som: 4–8 produkter

// ── Config-typer ───────────────────────────────────────────────────────────
type TypeConfig = {
  slug: string;
  label: string;
  singular: string;
  keywords: string[];
  exclude: string[];
  category: string;
  audience: string;
  painpoint: string;
  usp: string;
};
type InterestConfig = {
  slug: string;
  verb: string;
  noun: string;
  keywords: string[];
  exclude: string[];
  categories: string[];
  productSlugs: string[];
  audience: string;
  painpoint: string;
  usp: string;
};

const TYPES: TypeConfig[] = (typesJson as { types: TypeConfig[] }).types;
const INTERESTS: InterestConfig[] = (interestsJson as { interests: InterestConfig[] }).interests;

// ── Små hjälpare ─────────────────────────────────────────────────────────────
const lc = (s: string) => (s || "").toLowerCase();
const fmtKr = (n: number) => `${Math.round(n)} kr`;

function matchByName(products: Product[], keywords: string[], exclude: string[]): Product[] {
  const kw = keywords.map(lc);
  const ex = exclude.map(lc);
  return products.filter((p) => {
    const n = lc(p.name);
    if (ex.some((e) => e && n.includes(e))) return false;
    return kw.some((k) => k && n.includes(k));
  });
}

function priceRangeStr(list: Product[]): string {
  const nums = list.map((p) => p.priceNum).filter((n) => n > 0);
  if (nums.length === 0) return "";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? fmtKr(min) : `${Math.round(min)}–${Math.round(max)} kr`;
}

function collByName(collections: Collection[], name: string): Collection | undefined {
  return collections.find((c) => c.name === name);
}

// Produkter i en kategori (huvudkategori → inkl. underkategorier), bara i lager.
function productsInCategory(products: Product[], collections: Collection[], cat: Collection): Product[] {
  const childIds = collections.filter((c) => c.parentId === cat.id).map((c) => c.id);
  const ids = new Set([cat.id, ...childIds]);
  return products.filter((p) => p.inStock && (p.collectionIds || []).some((cid) => ids.has(cid)));
}

function relatedPosts(posts: Post[], keywords: string[], limit = 3): { title: string; slug: string }[] {
  const kw = keywords.map(lc);
  const scored = posts
    .map((p) => {
      const hay = lc(p.title + " " + p.excerpt);
      const score = kw.reduce((s, k) => (k && hay.includes(k) ? s + 1 : s), 0);
      return { p, score };
    })
    // Bara ÄKTA träffar: noll-poängare gav tidigare topikalt irrelevanta
    // "Läs mer på bloggen"-länkar (senaste inlägget oavsett ämne). Tom lista är
    // bättre än fel lista — ProgCrossLinks hoppar över blocket när den är tom.
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.p.date || "").localeCompare(a.p.date || ""));
  return scored.slice(0, limit).map(({ p }) => ({ title: p.title, slug: p.slug }));
}

const wordCount = (parts: string[]): number => T.countWords(parts.join(" "));
const listWords = (list: Product[]): number => T.countWords(list.map((p) => `${p.name} ${p.price}`).join(" "));

// ── Gemensam vy-typer ────────────────────────────────────────────────────────
export type CrossLink = { href: string; label: string };
export type ResolvedProduct = Product & { role: string; paragraph: string };

export type BestInTestView = {
  path: string;
  label: string;
  category: string;
  categorySlug: string | null;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  priceRange: string;
  products: ResolvedProduct[];
  faqs: { q: string; a: string }[];
  related: CrossLink[];
  blogLinks: CrossLink[];
  schemas: object[];
  bodyWords: number;
};

export type PriceTierView = {
  path: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  minPrice: string;
  products: Product[];
  related: CrossLink[];
  schemas: object[];
  bodyWords: number;
};

export type InterestView = {
  path: string;
  verb: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  products: Product[];
  faqs: { q: string; a: string }[];
  related: CrossLink[];
  blogLinks: CrossLink[];
  schemas: object[];
  bodyWords: number;
};

// ── Schema-byggare ───────────────────────────────────────────────────────────
function itemListSchema(name: string, url: string, products: Product[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        image: p.img || undefined,
        url: `${SITE}/produkt/${p.slug}`,
        offers: {
          "@type": "Offer",
          price: p.priceNum > 0 ? p.priceNum : undefined,
          priceCurrency: p.currency || "SEK",
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
    })),
  };
}

function faqSchema(faqs: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// Versalisera enbart första bokstaven, resten orört ("massagepistoler" →
// "Massagepistoler", men "Under 500 kr" lämnas oförändrat). Inte full Title Case —
// vi vill inte versalisera "kr"/övriga ord.
function capitalizeFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function breadcrumbSchema(crumbs: { name: string; path: string }[]): object {
  const lastIndex = crumbs.length - 1;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      // Leaf-crumben kan komma som lowercase type/verb-slug (t.ex. cfg.label
      // "massagepistoler") — versalisera första bokstaven så breadcrumben visas
      // korrekt i SERP. Övriga crumbs är redan rättkasade.
      name: i === lastIndex ? capitalizeFirst(c.name) : c.name,
      item: `${SITE}${c.path}`,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 1 — /basta-i-test/{type}
// ─────────────────────────────────────────────────────────────────────────────
type TypeCore = {
  cfg: TypeConfig;
  path: string;
  seed: number;
  products: ResolvedProduct[];
  priceRange: string;
  topName: string;
  intro: string[];
  faqs: { q: string; a: string }[];
  bodyWords: number;
};

// Ren core: urval + texter + ALLA guards. Inga cross-länkar (→ ingen rekursion).
function typeCore(products: Product[], cfg: TypeConfig): TypeCore | null {
  const matched = matchByName(products, cfg.keywords, cfg.exclude).filter((p) => p.inStock);
  const selected = dedupeProducts([...matched].sort((a, b) => b.imageScore - a.imageScore)).slice(0, MAX_TYPE_LIST);
  if (selected.length < MIN_PRODUCTS) return null;

  const path = `/basta-i-test/${cfg.slug}`;
  const seed = T.hashSeed(path);
  const ordered = [...selected].sort((a, b) => a.priceNum - b.priceNum); // budget → premium
  const roles = T.assignRoles(ordered.length);
  const resolved: ResolvedProduct[] = ordered.map((p, i) => ({
    ...p,
    role: roles[i],
    paragraph: T.productParagraph({
      name: p.name,
      blurb: p.blurb,
      role: roles[i],
      price: p.price,
      label: cfg.label,
      seed: T.hashSeed(p.slug + ":" + cfg.slug),
    }),
  }));
  const priceRange = priceRangeStr(ordered) || "olika prisklasser";
  const topName = (resolved.find((p) => p.role === "Mest för pengarna") || resolved[0]).name;
  const intro = T.bestInTestIntro({
    label: cfg.label,
    audience: cfg.audience,
    painpoint: cfg.painpoint,
    usp: cfg.usp,
    count: resolved.length,
    priceRange,
    topName,
    seed,
  });
  const faqs = T.bestInTestFaq({
    label: cfg.label,
    singular: cfg.singular,
    count: resolved.length,
    priceRange,
    topName,
    category: cfg.category,
    seed,
  });
  const bodyWords = wordCount([...intro, ...resolved.map((p) => p.paragraph), ...faqs.flatMap((f) => [f.q, f.a])]);
  if (bodyWords < MIN_BODY_WORDS) return null;
  return { cfg, path, seed, products: resolved, priceRange, topName, intro, faqs, bodyWords };
}

export const getValidTypeSlugs = cache(async (): Promise<string[]> => {
  const products = await getProducts();
  return TYPES.filter((cfg) => typeCore(products, cfg)).map((c) => c.slug);
});

export const resolveBestInTest = cache(async (slug: string): Promise<BestInTestView | null> => {
  const cfg = TYPES.find((c) => c.slug === slug);
  if (!cfg) return null;
  const [products, collections, posts, validSlugs, tierParams] = await Promise.all([
    getProducts(),
    getCollections(),
    getPosts(),
    getValidTypeSlugs(),
    getValidPriceTierParams(),
  ]);
  const core = typeCore(products, cfg);
  if (!core) return null;
  const cat = collByName(collections, cfg.category);

  const related: CrossLink[] = [];
  if (cat) related.push({ href: `/kategori/${cat.slug}`, label: `Alla ${cfg.category}` });
  const others = TYPES.filter((c) => c.slug !== slug && validSlugs.includes(c.slug));
  const sameCat = others.filter((c) => c.category === cfg.category);
  for (const c of [...sameCat, ...others.filter((c) => !sameCat.includes(c))].slice(0, 3)) {
    related.push({ href: `/basta-i-test/${c.slug}`, label: `Bäst i test: ${c.label}` });
  }
  if (cat) {
    const tier = tierParams.find((t) => t.categorySlug === cat.slug);
    if (tier) related.push({ href: `/under-${tier.price}-kr/${cat.slug}`, label: `${cfg.category} under ${tier.price} kr` });
  }
  const blogLinks: CrossLink[] = relatedPosts(posts, [cfg.label, cfg.singular, ...cfg.keywords]).map((b) => ({
    href: `/blogg/${b.slug}`,
    label: b.title,
  }));

  const crumbs = [
    { name: "Hem", path: "/" },
    { name: "Bäst i test", path: "/basta-i-test" },
    { name: cfg.label, path: core.path },
  ];
  const schemas = [
    breadcrumbSchema(crumbs),
    itemListSchema(`Bäst i test: ${cfg.label}`, `${SITE}${core.path}`, core.products),
    faqSchema(core.faqs),
  ];

  return {
    path: core.path,
    label: cfg.label,
    category: cfg.category,
    categorySlug: cat?.slug ?? null,
    h1: T.bestInTestH1(cfg.label, core.seed),
    metaTitle: T.bestInTestMetaTitle(cfg.label, core.seed),
    metaDescription: T.bestInTestMetaDesc(cfg.label, core.products.length, core.priceRange, core.seed),
    intro: core.intro,
    priceRange: core.priceRange,
    products: core.products,
    faqs: core.faqs,
    related,
    blogLinks,
    schemas,
    bodyWords: core.bodyWords,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 2 — /under-{price}-kr/{category}
// ─────────────────────────────────────────────────────────────────────────────
type TierCore = {
  cat: Collection;
  price: number;
  path: string;
  seed: number;
  products: Product[];
  minPrice: string;
  intro: string[];
  bodyWords: number;
};

function tierCore(products: Product[], collections: Collection[], cat: Collection, price: number): TierCore | null {
  const inCat = productsInCategory(products, collections, cat).filter((p) => p.priceNum > 0 && p.priceNum <= price);
  const list = dedupeProducts([...inCat].sort((a, b) => b.imageScore - a.imageScore || a.priceNum - b.priceNum)).slice(0, MAX_TIER_LIST);
  if (list.length < MIN_PRODUCTS) return null;

  const path = `/under-${price}-kr/${cat.slug}`;
  const seed = T.hashSeed(path);
  const minPrice = fmtKr(Math.min(...list.map((p) => p.priceNum)));
  const intro = T.priceTierIntro({ categoryName: cat.name, price, count: list.length, minPrice, seed });
  const bodyWords = wordCount(intro) + listWords(list);
  // Samma ordkrav som alla andra mönster — INGEN bypass för långa produktlistor.
  // En lista med ≥6 produkter men tunn brödtext är fortfarande thin content
  // i Googles ögon och ska 404:a + falla ur sitemap.
  if (bodyWords < MIN_BODY_WORDS) return null;
  return { cat, price, path, seed, products: list, minPrice, intro, bodyWords };
}

export const getValidPriceTierParams = cache(async (): Promise<{ price: number; categorySlug: string }[]> => {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const out: { price: number; categorySlug: string }[] = [];
  for (const price of PRICE_TIERS) {
    for (const cat of collections) {
      if (tierCore(products, collections, cat, price)) out.push({ price, categorySlug: cat.slug });
    }
  }
  return out;
});

export const resolvePriceTier = cache(async (price: number, categorySlug: string): Promise<PriceTierView | null> => {
  if (!PRICE_TIERS.includes(price as (typeof PRICE_TIERS)[number])) return null;
  const [products, collections, allTiers, validTypes] = await Promise.all([
    getProducts(),
    getCollections(),
    getValidPriceTierParams(),
    getValidTypeSlugs(),
  ]);
  const cat = collections.find((c) => c.slug === categorySlug);
  if (!cat) return null;
  const core = tierCore(products, collections, cat, price);
  if (!core) return null;

  const related: CrossLink[] = [
    { href: "/alla-produkter", label: "Se alla produkter" },
    { href: `/kategori/${cat.slug}`, label: `Allt inom ${cat.name}` },
  ];
  for (const t of PRICE_TIERS) {
    if (t === price) continue;
    if (allTiers.some((x) => x.price === t && x.categorySlug === cat.slug)) {
      related.push({ href: `/under-${t}-kr/${cat.slug}`, label: `${cat.name} under ${t} kr` });
    }
  }
  for (const cfg of TYPES.filter((c) => c.category === cat.name && validTypes.includes(c.slug)).slice(0, 2)) {
    related.push({ href: `/basta-i-test/${cfg.slug}`, label: `Bäst i test: ${cfg.label}` });
  }

  const crumbs = [
    { name: "Hem", path: "/" },
    { name: cat.name, path: `/kategori/${cat.slug}` },
    { name: `Under ${price} kr`, path: core.path },
  ];
  const schemas = [breadcrumbSchema(crumbs), itemListSchema(`${cat.name} under ${price} kr`, `${SITE}${core.path}`, core.products)];

  return {
    path: core.path,
    categoryName: cat.name,
    categorySlug: cat.slug,
    price,
    h1: T.priceTierH1(cat.name, price, core.seed),
    metaTitle: T.priceTierMetaTitle(cat.name, price, core.seed),
    metaDescription: T.priceTierMetaDesc(cat.name, price, core.products.length, core.seed),
    intro: core.intro,
    minPrice: core.minPrice,
    products: core.products,
    related,
    schemas,
    bodyWords: core.bodyWords,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN 3 — /for-dig-som/{interest}
// ─────────────────────────────────────────────────────────────────────────────
type InterestCore = {
  cfg: InterestConfig;
  path: string;
  seed: number;
  products: Product[];
  intro: string[];
  faqs: { q: string; a: string }[];
  bodyWords: number;
};

function interestProducts(products: Product[], collections: Collection[], cfg: InterestConfig): Product[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const curated = cfg.productSlugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p && p.inStock);

  let pool = products;
  if (cfg.categories.length) {
    const catIds = new Set<string>();
    for (const name of cfg.categories) {
      const c = collByName(collections, name);
      if (!c) continue;
      catIds.add(c.id);
      for (const ch of collections.filter((x) => x.parentId === c.id)) catIds.add(ch.id);
    }
    pool = products.filter((p) => (p.collectionIds || []).some((cid) => catIds.has(cid)));
  }
  const kwMatches = matchByName(pool, cfg.keywords, cfg.exclude).filter((p) => p.inStock);

  const seen = new Set<string>();
  const union: Product[] = [];
  for (const p of [...curated, ...kwMatches.sort((a, b) => b.imageScore - a.imageScore)]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    union.push(p);
  }
  return dedupeProducts(union).slice(0, MAX_INTEREST_LIST);
}

function interestCore(products: Product[], collections: Collection[], cfg: InterestConfig): InterestCore | null {
  const list = interestProducts(products, collections, cfg);
  if (list.length < MIN_INTEREST) return null;

  const path = `/for-dig-som/${cfg.slug}`;
  const seed = T.hashSeed(path);
  const topName = list[0].name;
  const intro = T.interestIntro({
    verb: cfg.verb,
    noun: cfg.noun,
    audience: cfg.audience,
    painpoint: cfg.painpoint,
    usp: cfg.usp,
    count: list.length,
    seed,
  });
  const faqs = T.interestFaq({ verb: cfg.verb, noun: cfg.noun, count: list.length, topName, seed });
  const bodyWords = wordCount([...intro, ...faqs.flatMap((f) => [f.q, f.a])]) + listWords(list);
  if (bodyWords < MIN_BODY_WORDS) return null;
  return { cfg, path, seed, products: list, intro, faqs, bodyWords };
}

export const getValidInterestSlugs = cache(async (): Promise<string[]> => {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  return INTERESTS.filter((cfg) => interestCore(products, collections, cfg)).map((c) => c.slug);
});

export const resolveInterest = cache(async (slug: string): Promise<InterestView | null> => {
  const cfg = INTERESTS.find((c) => c.slug === slug);
  if (!cfg) return null;
  const [products, collections, posts, validSlugs] = await Promise.all([
    getProducts(),
    getCollections(),
    getPosts(),
    getValidInterestSlugs(),
  ]);
  const core = interestCore(products, collections, cfg);
  if (!core) return null;

  const related: CrossLink[] = [];
  // Mappa varje produkts kategorier till sin TOPP-kategori (huvudkategorin) och
  // länka till de 2 vanligaste — produkter taggas ofta bara med subkategori-id,
  // så vi vandrar upp till föräldern för relevant huvudkategori-länk.
  const byId = new Map(collections.map((c) => [c.id, c]));
  const rootOf = (c: Collection): Collection => (c.parentId && byId.get(c.parentId)) || c;
  const rootCount = new Map<string, number>();
  for (const p of core.products) {
    const roots = new Set((p.collectionIds || []).map((cid) => byId.get(cid)).filter(Boolean).map((c) => rootOf(c!).id));
    for (const r of roots) rootCount.set(r, (rootCount.get(r) || 0) + 1);
  }
  const linkedCats = [...rootCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => byId.get(id))
    .filter((c): c is Collection => !!c && !c.parentId)
    .slice(0, 2);
  for (const c of linkedCats) related.push({ href: `/kategori/${c.slug}`, label: `Allt inom ${c.name}` });
  for (const other of INTERESTS.filter((c) => c.slug !== slug && validSlugs.includes(c.slug)).slice(0, 3)) {
    related.push({ href: `/for-dig-som/${other.slug}`, label: `För dig som ${other.verb}` });
  }
  const blogLinks: CrossLink[] = relatedPosts(posts, [cfg.verb, cfg.noun, ...cfg.keywords], 2).map((b) => ({
    href: `/blogg/${b.slug}`,
    label: b.title,
  }));

  const crumbs = [
    { name: "Hem", path: "/" },
    { name: "För dig som", path: "/for-dig-som" },
    { name: cfg.verb, path: core.path },
  ];
  const schemas = [
    breadcrumbSchema(crumbs),
    itemListSchema(`För dig som ${cfg.verb}`, `${SITE}${core.path}`, core.products),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: `För dig som ${cfg.verb}`,
      url: `${SITE}${core.path}`,
      description: core.intro.join(" ").slice(0, 300),
    },
  ];

  return {
    path: core.path,
    verb: cfg.verb,
    h1: T.interestH1(cfg.verb, core.seed),
    metaTitle: T.interestMetaTitle(cfg.verb, core.seed),
    metaDescription: T.interestMetaDesc(cfg.verb, core.products.length, core.seed),
    intro: core.intro,
    products: core.products,
    faqs: core.faqs,
    related,
    blogLinks,
    schemas,
    bodyWords: core.bodyWords,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Kategorisid-länkar + sitemap-projektion
// ─────────────────────────────────────────────────────────────────────────────

// Programmatiska länkar att visa PÅ en kategorisida (/kategori/{slug}). Bara
// giltiga (icke-404) länkar. Tom array → kategorisidan renderar inget block.
export const categoryProgrammaticLinks = cache(async (categorySlug: string): Promise<CrossLink[]> => {
  const [collections, tierParams, typeSlugs] = await Promise.all([
    getCollections(),
    getValidPriceTierParams(),
    getValidTypeSlugs(),
  ]);
  const cat = collections.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  const links: CrossLink[] = [];
  for (const price of PRICE_TIERS) {
    if (tierParams.some((t) => t.price === price && t.categorySlug === categorySlug)) {
      links.push({ href: `/under-${price}-kr/${categorySlug}`, label: `${cat.name} under ${price} kr` });
    }
  }
  for (const cfg of TYPES.filter((c) => c.category === cat.name && typeSlugs.includes(c.slug)).slice(0, 3)) {
    links.push({ href: `/basta-i-test/${cfg.slug}`, label: `Bäst i test: ${cfg.label}` });
  }
  return links;
});
export type ProgrammaticUrl = { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number };

export const getProgrammaticUrls = cache(async (): Promise<ProgrammaticUrl[]> => {
  const [typeSlugs, tierParams, interestSlugs] = await Promise.all([
    getValidTypeSlugs(),
    getValidPriceTierParams(),
    getValidInterestSlugs(),
  ]);
  const urls: ProgrammaticUrl[] = [];
  for (const s of typeSlugs) urls.push({ path: `/basta-i-test/${s}`, changeFrequency: "weekly", priority: 0.6 });
  for (const t of tierParams) urls.push({ path: `/under-${t.price}-kr/${t.categorySlug}`, changeFrequency: "weekly", priority: 0.6 });
  for (const s of interestSlugs) urls.push({ path: `/for-dig-som/${s}`, changeFrequency: "weekly", priority: 0.6 });
  return urls;
});
