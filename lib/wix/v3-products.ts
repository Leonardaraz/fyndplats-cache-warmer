// Wix Catalog V3 produkt-querier mot headless-sajten (wix-vibe-site-u4lp).
//
// Headless-sajten har sitt eget site-id (separat från WIX_SITE_ID som pekar
// på gamla Fyndplats där våra CMS-collections lever). Site-ID:t är publikt
// så det är ok att hardcoda — vi gör det override:bart via HEADLESS_WIX_SITE_ID
// för flexibility.

const WIX_BASE = "https://www.wixapis.com";
const DEFAULT_HEADLESS_SITE_ID = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

function headlessSiteId(): string {
  return process.env.HEADLESS_WIX_SITE_ID || DEFAULT_HEADLESS_SITE_ID;
}

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  return {
    Authorization: token,
    "wix-site-id": headlessSiteId(),
    "Content-Type": "application/json",
  };
}

export interface WixV3ProductSummary {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  variantCount: number;
  hasSeoTitle: boolean;
  hasSeoDescription: boolean;
  hasJsonLd: boolean;
  hasOgTags: boolean;
  hasImage: boolean;
  hasDescription: boolean;
}

export interface WixV3Variant {
  id: string;
  name: string;
  choices: Record<string, string>;
  sku?: string;
}

/**
 * Listar alla produkter i V3-katalogen med minimal data (id, name, slug, image).
 * Pagination hanteras automatiskt via cursor.
 */
export async function listAllV3Products(): Promise<WixV3ProductSummary[]> {
  const all: WixV3ProductSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const body: Record<string, unknown> = {
      query: {
        paging: { limit: 100 },
      },
    };
    if (cursor) body.query = { ...(body.query as object), cursor };

    const res = await fetch(`${WIX_BASE}/stores/v3/products/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`V3 query failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      products?: Array<{
        id: string;
        name: string;
        slug: string;
        description?: string;
        media?: { main?: { image?: { url?: string } } };
        variantsInfo?: { variants?: unknown[] };
        seoData?: { tags?: Array<{ type?: string; props?: { name?: string; property?: string }; children?: string }> };
      }>;
      pagingMetadata?: { cursors?: { next?: string } };
    };

    for (const p of data.products ?? []) {
      const tags = p.seoData?.tags ?? [];
      all.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.media?.main?.image?.url,
        variantCount: p.variantsInfo?.variants?.length ?? 0,
        hasSeoTitle: tags.some((t) => t.type === "title" && Boolean(t.children?.trim())),
        hasSeoDescription: tags.some(
          (t) => t.type === "meta" && t.props?.name === "description" && Boolean(t.children?.length),
        ),
        hasJsonLd: tags.some((t) => t.type === "script" && Boolean(t.children?.includes("@type"))),
        hasOgTags: tags.some((t) => t.type === "meta" && t.props?.property?.startsWith("og:")),
        hasImage: Boolean(p.media?.main?.image?.url),
        hasDescription: Boolean(p.description?.trim()),
      });
    }

    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor || (data.products ?? []).length === 0) break;
  }
  return all;
}

/**
 * Hämtar fullständig V3-produkt med seoData, brand, media, price, inventory —
 * allt som SEO-enrichment behöver för att generera taggar.
 */
export async function getV3ProductFull(productId: string): Promise<{
  id: string;
  revision: string;
  name: string;
  slug: string;
  description?: string;
  brand?: { name?: string };
  media?: { main?: { image?: { url?: string }; altText?: string } };
  actualPriceRange?: { minValue?: { amount?: string } };
  inventory?: { availabilityStatus?: string };
  seoTitle?: string;
  seoDescription?: string;
  seoData?: { tags?: Array<Record<string, unknown>> };
  handle?: string;
}> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getV3ProductFull(${productId}) ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { product?: Record<string, unknown> };
  if (!data.product) throw new Error(`getV3ProductFull(${productId}): tom payload`);
  return data.product as never;
}

/**
 * PATCH:ar en V3-produkt med nya seoData.tags. Använder product-revision för
 * optimistisk samtidighetskontroll. Skickar HELA tags-arrayen (Wix ersätter
 * inte mergar) — call-site ansvarar för att merga med befintliga.
 */
export async function patchV3ProductSeo(
  productId: string,
  revision: string,
  tags: Array<Record<string, unknown>>,
): Promise<void> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      product: {
        revision,
        seoData: { tags },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`patchV3ProductSeo(${productId}) ${res.status}: ${text.slice(0, 300)}`);
  }
}

/** Hämtar fullständig variant-data för en produkt (för positionsmappning). */
export async function getV3ProductVariants(productId: string): Promise<WixV3Variant[]> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`V3 get product ${productId} (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    product?: {
      variantsInfo?: {
        variants?: Array<{
          id: string;
          sku?: string;
          choices?: Array<{
            optionChoiceNames?: { optionName?: string; choiceName?: string };
          }>;
        }>;
      };
    };
  };
  const variants = data.product?.variantsInfo?.variants ?? [];
  return variants.map((v) => {
    const choices: Record<string, string> = {};
    for (const c of v.choices ?? []) {
      const name = c.optionChoiceNames?.optionName;
      const value = c.optionChoiceNames?.choiceName;
      if (name && value) choices[name] = value;
    }
    return {
      id: v.id,
      name: Object.values(choices).join(" / ") || v.sku || v.id.slice(0, 8),
      choices,
      sku: v.sku,
    };
  });
}
