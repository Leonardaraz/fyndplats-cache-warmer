// Wix Catalog V1 listning från gamla Fyndplats-sajten (8c62127f-...).
//
// Gamla sajten lever fortfarande på fyndplats.se vid migrationstidpunkten.
// Vi behöver dess slugs för att bygga 301-redirect-mapp till nya headless-V3.

const WIX_BASE = "https://www.wixapis.com";
const DEFAULT_OLD_SITE_ID = "8c62127f-c07a-4596-86b8-4e88b5cc502d";

function oldSiteId(): string {
  return process.env.OLD_WIX_SITE_ID || DEFAULT_OLD_SITE_ID;
}

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  return {
    Authorization: token,
    "wix-site-id": oldSiteId(),
    "Content-Type": "application/json",
  };
}

export interface WixV1ProductSummary {
  id: string;
  name: string;
  slug: string;
  numericId?: string;
  sku?: string;
  /** Full URL-path från gamla siten, t.ex. /product-page/min-slug */
  oldPath: string;
  visible: boolean;
  hasSeoTitle: boolean;
  hasSeoDescription: boolean;
  hasJsonLd: boolean;
  hasOgTags: boolean;
  /** Rik HTML-brödtext från V1 (migreras till V3 plainDescription). */
  description?: string;
  /** V1-flikar (Specifikationer, FAQ etc.) — titel + HTML. */
  infoSections?: Array<{ title: string; description: string }>;
}

/**
 * Listar alla V1-produkter (paginerad). Returnerar minimal data + SEO-flaggor
 * för att bedöma vad som måste replikeras i headless.
 */
export async function listAllV1Products(): Promise<WixV1ProductSummary[]> {
  const all: WixV1ProductSummary[] = [];
  let offset = 0;
  const pageSize = 100;

  for (let page = 0; page < 20; page++) {
    const res = await fetch(`${WIX_BASE}/stores/v1/products/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        query: { paging: { limit: pageSize, offset } },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`V1 query failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      products?: Array<{
        id: string;
        name: string;
        slug: string;
        numericId?: string;
        sku?: string;
        visible?: boolean;
        description?: string;
        additionalInfoSections?: Array<{ title?: string; description?: string }>;
        productPageUrl?: { base?: string; path?: string };
        seoData?: { tags?: Array<{ type?: string; props?: { name?: string; property?: string }; children?: string }> };
      }>;
      totalResults?: number;
    };

    for (const p of data.products ?? []) {
      const tags = p.seoData?.tags ?? [];
      const hasTitle = tags.some((t) => t.type === "title" && Boolean(t.children?.trim()));
      const hasDesc = tags.some(
        (t) => t.type === "meta" && t.props?.name === "description" && Boolean(t.children?.length),
      );
      const hasJsonLd = tags.some((t) => t.type === "script" && Boolean(t.children?.includes("@type")));
      const hasOg = tags.some(
        (t) => t.type === "meta" && t.props?.property?.startsWith("og:"),
      );
      all.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        numericId: p.numericId,
        sku: p.sku,
        oldPath: p.productPageUrl?.path ?? `/product-page/${p.slug}`,
        visible: p.visible ?? true,
        hasSeoTitle: hasTitle,
        hasSeoDescription: hasDesc,
        hasJsonLd,
        hasOgTags: hasOg,
        description: p.description,
        infoSections: (p.additionalInfoSections ?? [])
          .filter((s) => s.title && s.description)
          .map((s) => ({ title: s.title as string, description: s.description as string })),
      });
    }

    const got = data.products?.length ?? 0;
    if (got < pageSize) break;
    offset += got;
  }
  return all;
}
