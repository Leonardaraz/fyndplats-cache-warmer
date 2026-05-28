// Hämtar produkter från Fyndplats (v1) paginerat och normaliserar dem till
// det "slimmade" format som transform.ts förväntar sig.

import type { V1Product } from "./transform.ts";

const WIX_BASE = "https://www.wixapis.com";

function srcHeaders(token: string, sourceSiteId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: token,
    "wix-site-id": sourceSiteId,
  };
}

/** Hämtar alla v1-produkter från källan paginerat (limit 100). */
export async function fetchAllV1Products(token: string, sourceSiteId: string): Promise<V1Product[]> {
  const all: V1Product[] = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const res = await fetch(`${WIX_BASE}/stores/v1/products/query`, {
      method: "POST",
      headers: srcHeaders(token, sourceSiteId),
      body: JSON.stringify({ query: { paging: { limit, offset } }, includeVariants: true }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`v1 query misslyckades (${res.status}): ${text.slice(0, 400)}`);
    }
    const data = (await res.json()) as { products?: unknown[] };
    const page = data.products ?? [];
    for (const p of page) all.push(normalizeV1Product(p));
    if (page.length < limit) break;
    offset += limit;
  }
  return all;
}

/** Mappar v1 wire-format → vårt slimmade format. Tål saknade fält. */
function normalizeV1Product(raw: unknown): V1Product {
  const p = raw as Record<string, any>;
  const priceData = p.priceData ?? p.price ?? {};
  return {
    name: p.name ?? "",
    slug: p.slug ?? "",
    visible: p.visible ?? true,
    productType: p.productType ?? "physical",
    brand: p.brand ?? null,
    ribbon: p.ribbon ?? null,
    description: p.description ?? "",
    additionalInfoSections: (p.additionalInfoSections ?? []).map((s: any) => ({
      title: s.title ?? "",
      description: s.description ?? "",
    })),
    currency: priceData.currency,
    price: typeof priceData.price === "number" ? priceData.price : 0,
    discountedPrice:
      typeof priceData.discountedPrice === "number" ? priceData.discountedPrice : undefined,
    stock: p.stock,
    mediaMainUrl: p.media?.mainMedia?.image?.url ?? null,
    mediaItems: (p.media?.items ?? [])
      .map((m: any) =>
        m.image?.url
          ? { type: "image", url: m.image.url }
          : m.mediaType === "video"
            ? null
            : null,
      )
      .filter((m: any) => m !== null),
    manageVariants: p.manageVariants ?? false,
    productOptions: (p.productOptions ?? []).map((o: any) => ({
      optionType: o.optionType ?? "drop_down",
      name: o.name ?? "",
      choices: (o.choices ?? []).map((c: any) => ({
        value: c.value ?? "",
        description: c.description,
        visible: c.visible,
        inStock: c.inStock,
      })),
    })),
    variants: (p.variants ?? []).map((v: any) => ({
      choices: v.choices ?? {},
      sku: v.variant?.sku ?? "",
      price: v.variant?.priceData?.price ?? priceData.price ?? 0,
      discountedPrice: v.variant?.priceData?.discountedPrice ?? priceData.discountedPrice,
      weight: v.variant?.weight,
      visible: v.variant?.visible ?? true,
      quantity: v.stock?.quantity ?? 0,
      trackQuantity: v.stock?.trackQuantity ?? false,
    })),
    collectionIds: p.collectionIds ?? [],
  };
}
