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
  // Fält som behövs för SEO-enrichment (bulk update) — populeras direkt
  // från query-respons så vi slipper N+1 GETs.
  revision?: string;
  seoTitle?: string;
  seoDescription?: string;
  priceMin?: string;
  brandName?: string;
  inStock?: boolean;
  handle?: string;
  existingTags?: Array<Record<string, unknown>>;
  /** HTML-brödtext (PLAIN_DESCRIPTION-fältet) — tomt = saknar beskrivning. */
  plainDescription?: string;
}

export interface WixV3Variant {
  id: string;
  name: string;
  choices: Record<string, string>;
  sku?: string;
}

/**
 * Id:n för de produkter som faktiskt SYNS i butiken.
 *
 * Bakgrund (2026-08-18): recensionssvepet valde kandidater på mappningens
 * `draftStatus`, men det fältet speglar bara vad som hände i granskningskön vid
 * importen — inte vad som står i butiken i dag. Campingtoaletten
 * (AE 1005008392536188) har `draftStatus: "rejected"` men är publicerad,
 * polerad på svenska och kostar 599 kr. Den har 107 omdömen hos leverantören
 * varav 15 klarar filtret, och fick noll eftersom svepet aldrig tittade på den.
 * 162 mappningar bär den statusen.
 *
 * Wix `visible` är sanningen. Den här listningen är avsiktligt mager — inga
 * tunga fält, bara id + visible — så den kostar ett par anrop per körning.
 */
export async function listVisibleV3ProductIds(): Promise<Set<string>> {
  const ut = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/stores/v3/products/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ query: { cursorPaging } }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`V3 visible-query failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      products?: Array<{ id?: string; visible?: boolean }>;
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const p of data.products ?? []) {
      // visible saknas i svaret → räkna som synlig. Att tyst utesluta en produkt
      // för att ett fält inte kom med vore samma fel som draftStatus-filtret.
      if (p.id && p.visible !== false) ut.add(p.id);
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor || !data.pagingMetadata?.hasNext) break;
  }
  return ut;
}

/**
 * Listar alla produkter i V3-katalogen med minimal data (id, name, slug, image).
 * Pagination hanteras automatiskt via cursor.
 */
export async function listAllV3Products(): Promise<WixV3ProductSummary[]> {
  const all: WixV3ProductSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    // V3 använder cursorPaging (inte paging). Cursor måste ligga INUTI
    // cursorPaging-objektet, annars ignoreras den och samma första 100
    // produkter returneras om och om igen (vilket buggade hela /admin/seo).
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    // PLAIN_DESCRIPTION är ett tungt fält som inte returneras by default —
    // begär det explicit så vi kan se vilka produkter som saknar beskrivning.
    const body = { fields: ["PLAIN_DESCRIPTION"], query: { cursorPaging } };

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
        revision?: string;
        name: string;
        slug: string;
        description?: string;
        plainDescription?: string;
        media?: { main?: { image?: { url?: string } } };
        variantsInfo?: { variants?: unknown[] };
        seoData?: { tags?: Array<{ type?: string; props?: { name?: string; property?: string; content?: string }; children?: string }> };
        seoTitle?: string;
        seoDescription?: string;
        brand?: { name?: string };
        actualPriceRange?: { minValue?: { amount?: string } };
        inventory?: { availabilityStatus?: string };
        handle?: string;
      }>;
      pagingMetadata?: { count?: number; cursors?: { next?: string }; hasNext?: boolean };
    };

    for (const p of data.products ?? []) {
      const tags = p.seoData?.tags ?? [];
      all.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.media?.main?.image?.url,
        variantCount: p.variantsInfo?.variants?.length ?? 0,
        // Audit-flaggor — använd props.content för meta-tags (fixar tidigare bug
        // där description rapporterades saknas trots att den fanns i props).
        hasSeoTitle: tags.some((t) => t.type === "title" && Boolean(t.children?.trim())),
        hasSeoDescription: tags.some(
          (t) => t.type === "meta" && t.props?.name === "description"
            && Boolean(t.props?.content?.length || t.children?.length),
        ),
        hasJsonLd: tags.some((t) => t.type === "script" && Boolean(t.children?.includes("@type"))),
        hasOgTags: tags.some((t) => t.type === "meta" && t.props?.property?.startsWith("og:")),
        hasImage: Boolean(p.media?.main?.image?.url),
        hasDescription: Boolean(p.plainDescription?.trim() || p.description),
        plainDescription: p.plainDescription,
        // Fält för bulk-enrichment
        revision: p.revision,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        priceMin: p.actualPriceRange?.minValue?.amount,
        brandName: p.brand?.name,
        inStock: p.inventory?.availabilityStatus === "IN_STOCK",
        handle: p.handle,
        existingTags: tags as Array<Record<string, unknown>>,
      });
    }

    cursor = data.pagingMetadata?.cursors?.next;
    const got = data.products?.length ?? 0;
    if (got === 0 || !cursor || data.pagingMetadata?.hasNext === false) break;
  }
  return all;
}

/**
 * Slår upp EN produkt på exakt slug i V3-katalogen (headless-sajten). Används av
 * admin-källuppslaget för att gå från en storefront-slug till wixProductId.
 *
 * Skannar katalogen (samma källa + pagineringskod som /admin/mappings) och
 * matchar slug:en exakt, case-insensitivt. Vi använder MEDVETET inte ett
 * `filter: { slug }` i V3-query:t: att fältet är filtrerbart kunde inte
 * verifieras, och om Wix tyst ignorerar ett okänt filter skulle limit:1 ge
 * FEL produkt (första i katalogen) i stället för "ingen träff". Skanningen är
 * lite tyngre men alltid korrekt — acceptabelt för ett sällan-använt admin-
 * uppslag. Returnerar null om ingen produkt matchar.
 */
export async function getV3ProductBySlug(
  slug: string,
): Promise<{ id: string; name: string; slug: string } | null> {
  const wanted = (slug || "").trim().toLowerCase();
  if (!wanted) return null;
  const all = await listAllV3Products();
  const hit = all.find((p) => (p.slug || "").toLowerCase() === wanted);
  return hit ? { id: hit.id, name: hit.name, slug: hit.slug } : null;
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

/**
 * Sätter `visible` på en V3-produkt på HEADLESS-sajten (samma site-id som
 * listAllV3Products frågar). Används av cleanup-skriptet för att dölja
 * kontaminerade importer. Returnerar nya revisionen.
 */
export async function setV3ProductVisibility(
  productId: string,
  revision: string,
  visible: boolean,
): Promise<{ revision: string }> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      product: { revision, visible },
      fieldMask: { paths: ["visible"] },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`setV3ProductVisibility(${productId}) ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string } };
  return { revision: data.product?.revision ?? revision };
}

/**
 * Bulk-updaterar upp till 100 V3-produkter i ett anrop. Används av SEO-
 * enrichment för att batcha PATCH:ar (dramatiskt snabbare än individuella).
 * @param updates  Array av {id, revision, seoData.tags} per produkt
 */
export async function bulkUpdateV3ProductSeo(
  updates: Array<{ id: string; revision: string; tags: Array<Record<string, unknown>> }>,
): Promise<{ successes: number; failures: number; firstErrors: string[] }> {
  if (updates.length === 0) return { successes: 0, failures: 0, firstErrors: [] };
  if (updates.length > 100) {
    throw new Error(`bulkUpdateV3ProductSeo: max 100 per batch, fick ${updates.length}`);
  }
  const body = {
    products: updates.map((u) => ({
      product: {
        id: u.id,
        revision: u.revision,
        seoData: { tags: u.tags },
      },
    })),
    returnEntity: false,
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/bulk/products/update`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`bulk update failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    results?: Array<{ itemMetadata?: { id?: string; success?: boolean; error?: { message?: string } } }>;
    bulkActionMetadata?: { totalSuccesses?: number; totalFailures?: number };
  };
  const successes = data.bulkActionMetadata?.totalSuccesses ?? 0;
  const failures = data.bulkActionMetadata?.totalFailures ?? 0;
  const firstErrors: string[] = [];
  for (const r of data.results ?? []) {
    if (r.itemMetadata?.success === false) {
      firstErrors.push(`${r.itemMetadata.id?.slice(0, 8)}: ${r.itemMetadata.error?.message ?? "fel"}`);
      if (firstErrors.length >= 5) break;
    }
  }
  return { successes, failures, firstErrors };
}

/**
 * Bulk-updaterar upp till 100 V3-produkters plainDescription (HTML). Wix
 * genererar automatiskt Ricos-`description` för storefronten. Används av
 * beskrivnings-migreringen V1 → V3.
 */
export async function bulkUpdateV3ProductDescriptions(
  updates: Array<{ id: string; revision: string; plainDescription: string }>,
): Promise<{ successes: number; failures: number; firstErrors: string[] }> {
  if (updates.length === 0) return { successes: 0, failures: 0, firstErrors: [] };
  if (updates.length > 100) {
    throw new Error(`bulkUpdateV3ProductDescriptions: max 100 per batch, fick ${updates.length}`);
  }
  const body = {
    products: updates.map((u) => ({
      product: {
        id: u.id,
        revision: u.revision,
        plainDescription: u.plainDescription,
      },
    })),
    returnEntity: false,
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/bulk/products/update`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`bulk description update failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    results?: Array<{ itemMetadata?: { id?: string; success?: boolean; error?: { message?: string } } }>;
    bulkActionMetadata?: { totalSuccesses?: number; totalFailures?: number };
  };
  const successes = data.bulkActionMetadata?.totalSuccesses ?? 0;
  const failures = data.bulkActionMetadata?.totalFailures ?? 0;
  const firstErrors: string[] = [];
  for (const r of data.results ?? []) {
    if (r.itemMetadata?.success === false) {
      firstErrors.push(`${r.itemMetadata.id?.slice(0, 8)}: ${r.itemMetadata.error?.message ?? "fel"}`);
      if (firstErrors.length >= 5) break;
    }
  }
  return { successes, failures, firstErrors };
}

/** Hämtar fullständig variant-data för en produkt (för variantmappning).
 *
 *  fields=VARIANT_OPTION_CHOICE_NAMES är OBLIGATORISK (destillatorn 2026-08-09):
 *  utan den utelämnar V3-GET `optionChoiceNames` ur varianternas choices →
 *  parsern gav tomma {} → mappningsverktygets värdematchning hade inget att
 *  matcha på och föll tillbaka positionellt, och mappningen sparades utan
 *  choices (vilket även gör synkens signatur-självläkning blind). */
export async function getV3ProductVariants(productId: string): Promise<WixV3Variant[]> {
  const res = await fetch(
    `${WIX_BASE}/stores/v3/products/${productId}?fields=VARIANT_OPTION_CHOICE_NAMES`,
    {
      method: "GET",
      headers: headers(),
    },
  );
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
