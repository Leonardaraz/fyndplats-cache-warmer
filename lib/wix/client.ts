// Tunn klient mot Wix Stores Catalog V3.
// Endpoint verifierad mot docs: POST https://www.wixapis.com/stores/v3/products
// https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/create-product
import { isDryRun } from "../audit";

const WIX_BASE = "https://www.wixapis.com";

export interface WixVariantInput {
  sku: string;
  /** Slutpris inkl. moms i butikens valuta, som sträng. */
  actualPrice: string;
  compareAtPrice?: string;
  /** Mappning optionsnamn -> valt värde, t.ex. { Färg: "Röd", Storlek: "M" }. */
  choices: Record<string, string>;
  visible?: boolean;
  /**
   * Initialt lagersaldo. Sätts via /products-with-inventory så lagerposterna
   * skapas vid import (Wix skapar dem INTE automatiskt vid vanlig create →
   * produkten blev annars "Slut i lager"). undefined = inget lager skapas.
   */
  inventoryQuantity?: number;
  /**
   * Varukostnad (inköp) i butikens valuta, decimalsträng. Mappar till V3:s
   * variantsInfo.variants[].revenueDetails.cost → driver Wix lönsamhetsrapporter
   * och /admin/profitability (istället för 30%-antagande).
   */
  costAmount?: string;
}

export interface WixProductInput {
  name: string;
  slug?: string;
  plainDescription?: string;
  brandName?: string;
  ribbonName?: string;
  seo?: { title?: string; description?: string };
  /** wixstatic-URL:er till bilder (från media.ts/importMediaByUrl) + alt-text. */
  mediaItems?: { url: string; altText?: string }[];
  /**
   * Optionsdefinitioner. Ett val kan ha `colorCode` (hex) → renderas som
   * färg-swatch (bubbla). Har alla val i en option en colorCode blir hela
   * optionen en swatch; annars text. Tom = enkel produkt utan varianter.
   */
  options?: { name: string; choices: { name: string; colorCode?: string }[] }[];
  variants: WixVariantInput[];
  /**
   * Initial synlighet i butiken. Default true. När review-kön används
   * (draft-imports) sätts den till false fram tills Leonard publicerar.
   */
  visible?: boolean;
}

export interface WixCreateProductResult {
  id: string;
  slug: string;
  revision: string;
  /** Wix-tilldelade variant-id:n kopplade till våra SKU:er (för lager-/orderkoppling). */
  variants: { id: string; sku: string }[];
  /**
   * Sätts om Wix svarade DUPLICATE_SLUG_ERROR och vi fick lägga på ett suffix.
   * T.ex. "-2" eller "-a7c2". Tomt/saknas = originalslug:en accepterades.
   * Används av /admin/queue för att visa "Slug auto-justerad"-badge.
   */
  slugSuffix?: string;
}

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  const siteId = process.env.WIX_SITE_ID;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token,
  };
  if (siteId) headers["wix-site-id"] = siteId;
  return headers;
}

/** En option blir färg-swatch om alla dess val har en colorCode. */
function isSwatchOption(o: { choices: { colorCode?: string }[] }): boolean {
  return o.choices.length > 0 && o.choices.every((c) => Boolean(c.colorCode));
}

/** Bygger V3-request-body från vårt interna produktformat. */
export function buildCreateProductBody(input: WixProductInput): Record<string, unknown> {
  // Render-typ per option (behövs i variants optionChoiceNames.renderType).
  const renderTypeByOption = new Map<string, "SWATCH_CHOICES" | "TEXT_CHOICES">();
  for (const o of input.options ?? []) {
    renderTypeByOption.set(o.name, isSwatchOption(o) ? "SWATCH_CHOICES" : "TEXT_CHOICES");
  }

  const product: Record<string, unknown> = {
    name: input.name,
    productType: "PHYSICAL",
    physicalProperties: {},
    ...(input.visible === false ? { visible: false } : {}),
    variantsInfo: {
      variants: input.variants.map((v) => ({
        sku: v.sku,
        visible: v.visible ?? true,
        price: {
          actualPrice: { amount: v.actualPrice },
          ...(v.compareAtPrice ? { compareAtPrice: { amount: v.compareAtPrice } } : {}),
        },
        // Varukostnad → V3 revenueDetails.cost (Wix räknar marginal/vinst på detta).
        ...(v.costAmount ? { revenueDetails: { cost: { amount: v.costAmount } } } : {}),
        // Lagerpost skapas in-line (endast via /products-with-inventory). quantity>0
        // → availabilityStatus=IN_STOCK. trackQuantity=true så daglig OOS-sync kan
        // flippa saldot till 0 senare.
        ...(v.inventoryQuantity !== undefined
          ? { inventoryItem: { trackQuantity: true, quantity: Math.max(0, Math.trunc(v.inventoryQuantity)) } }
          : {}),
        choices: Object.entries(v.choices).map(([optionName, choiceName]) => ({
          optionChoiceNames: {
            optionName,
            choiceName,
            renderType: renderTypeByOption.get(optionName) ?? "TEXT_CHOICES",
          },
        })),
      })),
    },
  };

  if (input.slug) product.slug = input.slug;
  if (input.plainDescription) product.plainDescription = input.plainDescription;
  if (input.brandName) product.brand = { name: input.brandName };
  if (input.ribbonName) product.ribbon = { name: input.ribbonName };
  if (input.seo) {
    // VIKTIGT (bug 2026-05-31): Wix SEO-panelen visade "Ingen produktbeskrivning"
    // trots att metabeskrivningen sattes. Två orsaker, båda fixade här:
    //   1. Taggarna måste markeras `custom: true` (annars behandlar Wix dem som
    //      auto-genererade defaults och panelen visar dem som tomma/overridebara).
    //   2. og:description/og:title saknades helt → ingen social-preview-text.
    // Shapen speglar lib/seo/enrich.ts (den verifierat fungerande enrichern):
    // meta name=description, plus og:title/og:description/og:type via props.property.
    const tags: Array<Record<string, unknown>> = [];
    if (input.seo.title) {
      tags.push({ type: "title", children: input.seo.title });
      tags.push({
        type: "meta",
        props: { property: "og:title", content: input.seo.title },
        children: "",
        custom: true,
      });
    }
    if (input.seo.description) {
      tags.push({
        type: "meta",
        props: { name: "description", content: input.seo.description },
        children: "",
        custom: true,
      });
      tags.push({
        type: "meta",
        props: { property: "og:description", content: input.seo.description },
        children: "",
        custom: true,
      });
    }
    tags.push({
      type: "meta",
      props: { property: "og:type", content: "product" },
      children: "",
      custom: true,
    });
    product.seoData = { tags };
  }
  if (input.options?.length) {
    product.options = input.options.map((o) => {
      const swatch = isSwatchOption(o);
      return {
        name: o.name,
        optionRenderType: swatch ? "SWATCH_CHOICES" : "TEXT_CHOICES",
        choicesSettings: {
          choices: o.choices.map((c) =>
            swatch
              ? { choiceType: "ONE_COLOR", name: c.name, colorCode: c.colorCode }
              : { choiceType: "CHOICE_TEXT", name: c.name },
          ),
        },
      };
    });
  }
  if (input.mediaItems?.length) {
    const items = input.mediaItems.map((m) => ({
      url: m.url,
      ...(m.altText ? { altText: m.altText } : {}),
    }));
    product.media = {
      main: items[0],
      itemsInfo: { items },
    };
  }

  const fields = ["URL", "PLAIN_DESCRIPTION"];
  return { product, fields };
}

export interface WixInventoryItem {
  id: string;
  revision: string;
  variantId: string;
  productId: string;
}

/** Hämtar lagerposter för en produkt (en post per variant + lager). */
export async function queryInventoryItemsByProductId(productId: string): Promise<WixInventoryItem[]> {
  const res = await fetch(`${WIX_BASE}/stores/v3/inventory-items/query`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify({ query: { filter: { productId } } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix query-inventory misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { inventoryItems?: WixInventoryItem[] };
  return data.inventoryItems ?? [];
}

export interface InventoryQuantityUpdate {
  id: string;
  revision: string;
  /** Absolut lagersaldo. */
  quantity: number;
}

/** Sätter absoluta lagersaldon för flera varianter i en request. */
export async function bulkUpdateInventoryQuantities(updates: InventoryQuantityUpdate[]): Promise<void> {
  if (updates.length === 0) return;
  if (isDryRun()) return;
  const res = await fetch(`${WIX_BASE}/stores/v3/bulk/inventory-items/update`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify({
      inventoryItems: updates.map((u) => ({
        inventoryItem: {
          id: u.id,
          revision: u.revision,
          trackQuantity: true,
          trackingMethod: { quantity: u.quantity },
        },
      })),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix bulk-update-inventory misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
}

export interface FulfillmentInput {
  orderId: string;
  lineItems: { id: string; quantity: number }[];
  trackingNumber: string;
  shippingProvider?: string;
  trackingLink?: string;
}

/** Skapar en fulfillment på en Wix-order med spårningsinfo. */
export async function createFulfillment(input: FulfillmentInput): Promise<{ fulfillmentId: string }> {
  if (isDryRun()) return { fulfillmentId: `dry-${input.orderId}` };
  const res = await fetch(
    `${WIX_BASE}/ecom/v1/fulfillments/orders/${encodeURIComponent(input.orderId)}/create-fulfillment`,
    {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        fulfillment: {
          lineItems: input.lineItems,
          trackingInfo: {
            trackingNumber: input.trackingNumber,
            ...(input.shippingProvider ? { shippingProvider: input.shippingProvider } : {}),
            ...(input.trackingLink ? { trackingLink: input.trackingLink } : {}),
          },
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix create-fulfillment misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { fulfillment?: { id?: string } };
  return { fulfillmentId: data.fulfillment?.id ?? "" };
}

interface CreateProductRaw {
  product: {
    id: string;
    slug: string;
    revision: string;
    variantsInfo?: { variants?: { id: string; sku?: string }[] };
  };
}

type CreateProductAttempt =
  | { ok: true; data: CreateProductRaw }
  | { ok: false; status: number; body: string; errorCode?: string };

async function attemptCreateProduct(input: WixProductInput): Promise<CreateProductAttempt> {
  // VIKTIGT: /products-with-inventory (INTE /products). Wix skapar INTE lagerposter
  // automatiskt vid vanlig create — utan dem blir varianterna "Slut i lager" och
  // den separata setInitialStock-queryn hittade inga poster att uppdatera (bug
  // 2026-05-31, andra försöket). Denna endpoint skapar produkt + lager atomiskt
  // via variantsInfo.variants[].inventoryItem som buildCreateProductBody sätter.
  const res = await fetch(`${WIX_BASE}/stores/v3/products-with-inventory`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify(buildCreateProductBody(input)),
  });
  if (res.ok) {
    return { ok: true, data: (await res.json()) as CreateProductRaw };
  }
  const body = await res.text();
  let errorCode: string | undefined;
  try {
    const parsed = JSON.parse(body) as {
      details?: { applicationError?: { code?: string } };
    };
    errorCode = parsed?.details?.applicationError?.code;
  } catch {
    // icke-JSON-body — errorCode lämnas undefined
  }
  return { ok: false, status: res.status, body, errorCode };
}

function isSlugCollision(attempt: CreateProductAttempt): boolean {
  return !attempt.ok && attempt.status === 409 && attempt.errorCode === "DUPLICATE_SLUG_ERROR";
}

/** 4 tecken base36 — räcker för att undvika kollision när -2..-10 också är tagna. */
function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, "0");
}

export async function createProduct(input: WixProductInput): Promise<WixCreateProductResult> {
  if (isDryRun()) {
    return {
      id: `dry-${Date.now()}`,
      slug: input.slug ?? "dry-run",
      revision: "1",
      variants: input.variants.map((v, i) => ({ id: `dry-var-${i}`, sku: v.sku })),
    };
  }

  let attempt = await attemptCreateProduct(input);
  let slugSuffix: string | undefined;

  // Slug-kollision: Wix V3 returnerar 409 DUPLICATE_SLUG_ERROR när någon
  // annan produkt redan tagit slug:en. Vi vill INTE skriva över existerande
  // produkt — istället lägger vi på ett suffix (-2..-10, sen slumpat).
  // Produktens namn ändras inte; endast URL-slug:en.
  if (isSlugCollision(attempt) && input.slug) {
    const baseSlug = input.slug;
    for (let i = 2; i <= 10; i++) {
      const suffix = `-${i}`;
      const retry = await attemptCreateProduct({ ...input, slug: baseSlug + suffix });
      if (retry.ok) {
        slugSuffix = suffix;
        attempt = retry;
        console.warn(
          `[wix.createProduct] DUPLICATE_SLUG_ERROR: "${baseSlug}" upptagen, använder "${baseSlug + suffix}".`,
        );
        break;
      }
      if (!isSlugCollision(retry)) {
        attempt = retry;
        break;
      }
      attempt = retry;
    }

    if (isSlugCollision(attempt)) {
      const suffix = `-${randomSlugSuffix()}`;
      const retry = await attemptCreateProduct({ ...input, slug: baseSlug + suffix });
      if (retry.ok) {
        slugSuffix = suffix;
        attempt = retry;
        console.warn(
          `[wix.createProduct] DUPLICATE_SLUG_ERROR: numeriska suffix uttömda, använder slumpad "${baseSlug + suffix}".`,
        );
      } else {
        attempt = retry;
      }
    }
  }

  if (!attempt.ok) {
    throw new Error(`Wix create-product misslyckades (${attempt.status}): ${attempt.body.slice(0, 500)}`);
  }

  const data = attempt.data;
  const variants = (data.product.variantsInfo?.variants ?? []).map((v) => ({
    id: v.id,
    sku: v.sku ?? "",
  }));
  return {
    id: data.product.id,
    slug: data.product.slug,
    revision: data.product.revision,
    variants,
    ...(slugSuffix ? { slugSuffix } : {}),
  };
}

export interface WixProductSnapshot {
  id: string;
  revision: string;
  name: string;
  /** URL-slug (för att bygga produktsidans länk i restock-mejl). */
  slug?: string;
  visible: boolean;
  variants: { id: string; sku: string; actualPriceAmount: string }[];
}

/** Hämtar en produkt från V3-katalogen (används av review-kön för publish). */
export async function getProduct(productId: string): Promise<WixProductSnapshot | null> {
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}?fields=PLAIN_DESCRIPTION`;
  const res = await fetch(url, { method: "GET", headers: wixHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix get-product misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    product: {
      id: string;
      revision: string;
      name: string;
      slug?: string;
      visible?: boolean;
      variantsInfo?: {
        variants?: { id: string; sku?: string; price?: { actualPrice?: { amount?: string } } }[];
      };
    };
  };
  const p = data.product;
  return {
    id: p.id,
    revision: p.revision,
    name: p.name,
    slug: p.slug,
    visible: p.visible ?? true,
    variants: (p.variantsInfo?.variants ?? []).map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      actualPriceAmount: v.price?.actualPrice?.amount ?? "0",
    })),
  };
}

export interface WixProductEnrichInfo {
  id: string;
  revision: string;
  name: string;
  /** Rik beskrivnings-HTML (PLAIN_DESCRIPTION) — källan för flik-back-fill. */
  plainDescription: string;
}

/**
 * Hämtar en produkts beskrivning + revision för flik-back-fill
 * (/admin/enrich-products). Returnerar null vid 404.
 */
export async function getProductForEnrich(productId: string): Promise<WixProductEnrichInfo | null> {
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}?fields=PLAIN_DESCRIPTION`;
  const res = await fetch(url, { method: "GET", headers: wixHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix get-product (enrich) misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    product: { id: string; revision: string; name?: string; plainDescription?: string };
  };
  const p = data.product;
  return {
    id: p.id,
    revision: p.revision,
    name: p.name ?? "",
    plainDescription: p.plainDescription ?? "",
  };
}

/**
 * Skriver om produktens beskrivning (plainDescription) — används av flik-back-fill
 * för att foga in de genererade <h2>-flikblocken. PATCH med fieldMask så endast
 * beskrivningen rörs. Returnerar nya revisionen.
 */
export async function updateProductDescription(
  productId: string,
  revision: string,
  plainDescription: string,
): Promise<{ revision: string }> {
  if (isDryRun()) return { revision };
  const body = {
    product: { revision, plainDescription },
    fieldMask: { paths: ["plainDescription"] },
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix update-description misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string } };
  return { revision: data.product?.revision ?? revision };
}

/** Sätter visible på en produkt (true = synlig, false = dold i butiken). */
export async function setProductVisibility(
  productId: string,
  revision: string,
  visible: boolean,
): Promise<{ revision: string }> {
  if (isDryRun()) return { revision };
  const body = {
    product: { revision, visible },
    fieldMask: { paths: ["visible"] },
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix set-visibility misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string } };
  return { revision: data.product?.revision ?? revision };
}

// --------------------------------------------------------------------------
// Kategorier (Wix Stores Catalog V3)
//
// VIKTIGT (bug 2026-06-01, fix): Den gamla koden anropade /stores/v3/collections/query
// ("collections"). Butiken är Catalog V3 och har INGA collections — anropet gav 404
// (och /stores/v1/.../query gav 428 "site is using CATALOG_V3"). De riktiga
// kategorierna (Leksaker & Spel, Förvaring & Organisering, ...) ligger i den DELADE
// Categories-tjänsten, inte under stores/*. Verifierad endpoint mot site
// e6d27e90-...: POST /categories/v1/categories/query med treeReference appNamespace
// "@wix/stores" → 200 med alla 45 kategorier. Add-to-category sker via
// /categories/v1/bulk/categories/{id}/add-items med samma treeReference + Wix Stores
// app-id som item-referens.
// Docs: https://dev.wix.com/docs/rest/business-management/categories/
// --------------------------------------------------------------------------

/** Wix Stores app-id — krävs som item-referens när produkter läggs i en kategori. */
const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
/** Categories-tjänsten är multi-app; för Stores-katalogen är trädet alltid detta. */
const CATEGORIES_TREE_REFERENCE = { appNamespace: "@wix/stores" } as const;

export interface WixCollection {
  id: string;
  name: string;
  /** Stabil slug — det vi mappar tillbaka mot vid auto-kategorisering. */
  slug: string;
  description?: string;
  /** Förälderkategorins id (saknas för rotkategorier). */
  parentId?: string;
}

interface WixCategoryRaw {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  parentCategory?: { id?: string };
}

/**
 * Modulnivå-cache. Kategorier ändras sällan (Leonard skapar/redigerar dem
 * manuellt i Wix-adminet) så en kort TTL räcker — en varm lambda slipper då
 * göra om query:n för varje produkt i en bulk-import. Cachen delas inte mellan
 * kall-starter, vilket är helt OK.
 */
let categoriesCache: { at: number; data: WixCollection[] } | null = null;
const CATEGORIES_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Hämtar alla Wix Stores-kategorier via den delade Categories-tjänsten.
 * Paginerar tills cursor är slut och cachar resultatet (TTL ovan).
 * Behåller namnet getCollections() så anroparna (lib/import/pipeline.ts) inte
 * behöver röras — "kollektion" och "kategori" är samma sak för vår del.
 */
export async function getCollections(): Promise<WixCollection[]> {
  if (categoriesCache && Date.now() - categoriesCache.at < CATEGORIES_CACHE_TTL_MS) {
    return categoriesCache.data;
  }

  const all: WixCollection[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/categories/v1/categories/query`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        treeReference: CATEGORIES_TREE_REFERENCE,
        query: { cursorPaging },
      }),
    });
    if (!res.ok) {
      // Saknad katalogapp eller saknade scopes — tolerera tyst (importen
      // ska inte falla bara för att kategoriförslaget inte går att göra).
      if (res.status === 404 || res.status === 403) return all;
      const text = await res.text();
      throw new Error(`Wix get-categories misslyckades (${res.status}): ${text.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      categories?: WixCategoryRaw[];
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const c of data.categories ?? []) {
      if (!c.slug || !c.name) continue;
      all.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        ...(c.parentCategory?.id ? { parentId: c.parentCategory.id } : {}),
      });
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!data.pagingMetadata?.hasNext || !cursor) break;
  }

  categoriesCache = { at: Date.now(), data: all };
  return all;
}

/**
 * Lägger till en produkt i en kategori via Categories-tjänstens
 * bulk-add-items-endpoint. Produkten refereras med Wix Stores app-id +
 * produkt-id (catalogItemId). Auto-hanterade kategorier (t.ex. "All Products")
 * returnerar 403 MANAGED_CATEGORY_OPERATION_NOT_ALLOWED — det är förväntat och
 * får bubbla upp (pipelinen demoterar då förslaget till "suggested").
 */
export async function addProductToCollection(productId: string, collectionId: string): Promise<void> {
  if (isDryRun()) return;
  const res = await fetch(
    `${WIX_BASE}/categories/v1/bulk/categories/${encodeURIComponent(collectionId)}/add-items`,
    {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        treeReference: CATEGORIES_TREE_REFERENCE,
        items: [{ appId: WIX_STORES_APP_ID, catalogItemId: productId }],
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix add-to-category misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
}

// --------------------------------------------------------------------------
// Media-hantering på existerande produkt (för "Ta bort bild" i kö-UI:t)
// --------------------------------------------------------------------------

export interface WixProductMediaSnapshot {
  id: string;
  revision: string;
  media: { url: string; altText?: string; id?: string }[];
}

/** Hämtar produktens nuvarande mediaItems (för att kunna ta bort en specifik bild). */
export async function getProductMedia(productId: string): Promise<WixProductMediaSnapshot | null> {
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`;
  const res = await fetch(url, { method: "GET", headers: wixHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix get-product-media misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    product: {
      id: string;
      revision: string;
      media?: {
        main?: { image?: { url?: string; altText?: string; id?: string } } & {
          url?: string;
          altText?: string;
          id?: string;
        };
        itemsInfo?: {
          items?: Array<
            { image?: { url?: string; altText?: string; id?: string } } & {
              url?: string;
              altText?: string;
              id?: string;
            }
          >;
        };
      };
    };
  };
  const items = data.product.media?.itemsInfo?.items ?? [];
  const media = items
    .map((it) => {
      const url = it.image?.url ?? it.url;
      const altText = it.image?.altText ?? it.altText;
      const id = it.image?.id ?? it.id;
      return url ? { url, altText, id } : null;
    })
    .filter((m): m is { url: string; altText: string | undefined; id: string | undefined } => m !== null);
  return { id: data.product.id, revision: data.product.revision, media };
}

/**
 * Skriver om produktens mediaItems till den nya listan (utan den
 * borttagna bilden). Wix V3 ersätter hela media-arrayen vid PATCH med
 * fieldMask=["media"].
 */
export async function setProductMedia(
  productId: string,
  revision: string,
  media: { url: string; altText?: string }[],
): Promise<{ revision: string }> {
  if (isDryRun()) return { revision };
  const items = media.map((m) => ({ url: m.url, ...(m.altText ? { altText: m.altText } : {}) }));
  const body = {
    product: {
      revision,
      media: {
        main: items[0],
        itemsInfo: { items },
      },
    },
    fieldMask: { paths: ["media"] },
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix set-media misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string } };
  return { revision: data.product?.revision ?? revision };
}
