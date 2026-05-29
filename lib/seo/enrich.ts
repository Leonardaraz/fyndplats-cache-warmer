// SEO-enrichment: genererar saknade seoData.tags (JSON-LD, OG, canonical) från
// befintlig V3-produktdata. Idempotent — appendar bara taggar som inte redan
// finns, så samma produkt kan enrichas flera gånger utan dubletter.

export interface SeoTagProps {
  name?: string;
  property?: string;
  content?: string;
  rel?: string;
  href?: string;
  type?: string;
}

export interface SeoTag {
  type: "title" | "meta" | "link" | "script";
  props?: SeoTagProps;
  children?: string;
  custom?: boolean;
  disabled?: boolean;
}

export interface V3ProductForEnrich {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: { name?: string };
  media?: { main?: { image?: { url?: string }; altText?: string } };
  actualPriceRange?: { minValue?: { amount?: string } };
  inventory?: { availabilityStatus?: string };
  seoTitle?: string;
  seoDescription?: string;
  seoData?: { tags?: SeoTag[] };
  handle?: string;
}

export interface EnrichConfig {
  baseUrl: string;
  newPathPrefix: string;
  siteName: string;
  currency: string;
}

const DEFAULT_CONFIG: EnrichConfig = {
  baseUrl: "https://www.fyndplats.se",
  newPathPrefix: "/products/",
  siteName: "Fyndplats",
  currency: "SEK",
};

/**
 * Returnerar listan med nya seoData.tags som ska APPENDAS till produktens
 * existerande tags. Returnerar tom lista om allt redan finns (idempotent).
 */
export function generateMissingSeoTags(
  product: V3ProductForEnrich,
  config: Partial<EnrichConfig> = {},
): SeoTag[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const existing = product.seoData?.tags ?? [];
  const prefix = cfg.newPathPrefix.endsWith("/") ? cfg.newPathPrefix : `${cfg.newPathPrefix}/`;
  const productUrl = `${cfg.baseUrl.replace(/\/$/, "")}${prefix}${product.slug}`;
  const title = product.seoTitle?.trim() || product.name;
  const description = product.seoDescription?.trim()
    || stripHtml(product.description ?? "").slice(0, 160).trim()
    || product.name;
  const imageUrl = product.media?.main?.image?.url;
  const priceStr = product.actualPriceRange?.minValue?.amount;
  const brand = product.brand?.name || cfg.siteName;

  const newTags: SeoTag[] = [];

  // --- Open Graph ---
  if (!hasOg(existing, "og:title")) {
    newTags.push(metaTag("og:title", title));
  }
  if (!hasOg(existing, "og:description")) {
    newTags.push(metaTag("og:description", description));
  }
  if (!hasOg(existing, "og:url")) {
    newTags.push(metaTag("og:url", productUrl));
  }
  if (imageUrl && !hasOg(existing, "og:image")) {
    newTags.push(metaTag("og:image", imageUrl));
  }
  if (!hasOg(existing, "og:type")) {
    newTags.push(metaTag("og:type", "product"));
  }
  if (!hasOg(existing, "og:site_name")) {
    newTags.push(metaTag("og:site_name", cfg.siteName));
  }

  // --- Canonical ---
  if (!hasCanonical(existing)) {
    newTags.push({
      type: "link",
      props: { rel: "canonical", href: productUrl },
      children: "",
      custom: true,
    });
  }

  // --- JSON-LD Product schema ---
  if (!hasJsonLdType(existing, "Product") && imageUrl && priceStr) {
    const inStock = product.inventory?.availabilityStatus === "IN_STOCK";
    const ld = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description,
      image: [imageUrl],
      sku: product.handle ?? product.id,
      brand: { "@type": "Brand", name: brand },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: cfg.currency,
        price: priceStr,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };
    newTags.push({
      type: "script",
      props: { type: "application/ld+json" },
      children: JSON.stringify(ld),
      custom: true,
    });
  }

  // --- JSON-LD BreadcrumbList (Hem → Produkt) ---
  // Vi har inte mainCategoryId-resolution till slug, så håll det enkelt: Hem → produkt.
  if (!hasJsonLdType(existing, "BreadcrumbList")) {
    const ld = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hem", item: `${cfg.baseUrl.replace(/\/$/, "")}/` },
        { "@type": "ListItem", position: 2, name: product.name, item: productUrl },
      ],
    };
    newTags.push({
      type: "script",
      props: { type: "application/ld+json" },
      children: JSON.stringify(ld),
      custom: true,
    });
  }

  return newTags;
}

function metaTag(property: string, content: string): SeoTag {
  return {
    type: "meta",
    props: { property, content },
    children: "",
    custom: true,
  };
}

function hasOg(tags: SeoTag[], property: string): boolean {
  return tags.some((t) => t.type === "meta" && t.props?.property === property);
}

function hasCanonical(tags: SeoTag[]): boolean {
  return tags.some((t) => t.type === "link" && t.props?.rel === "canonical");
}

function hasJsonLdType(tags: SeoTag[], schemaType: string): boolean {
  return tags.some(
    (t) =>
      t.type === "script"
      && t.props?.type === "application/ld+json"
      && t.children?.includes(`"@type":"${schemaType}"`),
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
