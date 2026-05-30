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

export interface WixProductSnapshot {
  id: string;
  revision: string;
  name: string;
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
    visible: p.visible ?? true,
    variants: (p.variantsInfo?.variants ?? []).map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      actualPriceAmount: v.price?.actualPrice?.amount ?? "0",
    })),
  };
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
