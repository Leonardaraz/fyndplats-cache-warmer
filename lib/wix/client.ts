// Tunn klient mot Wix Stores Catalog V3.
// Endpoint verifierad mot docs: POST https://www.wixapis.com/stores/v3/products
// https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/create-product

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

export async function createProduct(input: WixProductInput): Promise<WixCreateProductResult> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify(buildCreateProductBody(input)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix create-product misslyckades (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as { product: { id: string; slug: string; revision: string } };
  return { id: data.product.id, slug: data.product.slug, revision: data.product.revision };
}
