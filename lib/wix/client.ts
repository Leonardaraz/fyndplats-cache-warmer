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
}

export interface WixProductInput {
  name: string;
  slug?: string;
  plainDescription?: string;
  brandName?: string;
  ribbonName?: string;
  seo?: { title?: string; description?: string };
  /** Redan uppladdade media-uploadId:n (se image-pipelinen). */
  mediaUploadIds?: { uploadId: string; altText?: string }[];
  /** Optionsdefinitioner: namn -> lista av val. Tom = enkel produkt utan varianter. */
  options?: { name: string; choices: string[] }[];
  variants: WixVariantInput[];
}

export interface WixCreateProductResult {
  id: string;
  slug: string;
  revision: string;
  /** Wix-tilldelade variant-id:n kopplade till våra SKU:er (för lager-/orderkoppling). */
  variants: { id: string; sku: string }[];
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

/** Bygger V3-request-body från vårt interna produktformat. */
export function buildCreateProductBody(input: WixProductInput): Record<string, unknown> {
  const product: Record<string, unknown> = {
    name: input.name,
    productType: "PHYSICAL",
    variantsInfo: {
      variants: input.variants.map((v) => ({
        sku: v.sku,
        visible: v.visible ?? true,
        price: {
          actualPrice: { amount: v.actualPrice },
          ...(v.compareAtPrice ? { compareAtPrice: { amount: v.compareAtPrice } } : {}),
        },
        choices: Object.entries(v.choices).map(([optionName, choiceName]) => ({
          optionChoiceNames: { optionName, choiceName },
        })),
      })),
    },
  };

  if (input.slug) product.slug = input.slug;
  if (input.plainDescription) product.plainDescription = input.plainDescription;
  if (input.brandName) product.brand = { name: input.brandName };
  if (input.ribbonName) product.ribbon = { name: input.ribbonName };
  if (input.seo) {
    product.seoData = {
      tags: [
        ...(input.seo.title ? [{ type: "title", children: input.seo.title }] : []),
        ...(input.seo.description
          ? [{ type: "meta", props: { name: "description", content: input.seo.description } }]
          : []),
      ],
    };
  }
  if (input.options?.length) {
    product.options = input.options.map((o) => ({
      name: o.name,
      choicesSettings: { choices: o.choices.map((c) => ({ name: c })) },
    }));
  }
  if (input.mediaUploadIds?.length) {
    product.media = {
      itemsInfo: {
        items: input.mediaUploadIds.map((m) => ({
          uploadId: m.uploadId,
          ...(m.altText ? { altText: m.altText } : {}),
        })),
      },
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

export async function createProduct(input: WixProductInput): Promise<WixCreateProductResult> {
  if (isDryRun()) {
    return {
      id: `dry-${Date.now()}`,
      slug: input.slug ?? "dry-run",
      revision: "1",
      variants: input.variants.map((v, i) => ({ id: `dry-var-${i}`, sku: v.sku })),
    };
  }
  const res = await fetch(`${WIX_BASE}/stores/v3/products`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify(buildCreateProductBody(input)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix create-product misslyckades (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    product: {
      id: string;
      slug: string;
      revision: string;
      variantsInfo?: { variants?: { id: string; sku?: string }[] };
    };
  };
  const variants = (data.product.variantsInfo?.variants ?? []).map((v) => ({
    id: v.id,
    sku: v.sku ?? "",
  }));
  return { id: data.product.id, slug: data.product.slug, revision: data.product.revision, variants };
}
