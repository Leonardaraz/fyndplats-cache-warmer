// GET /feed/products.xml
//
// Google/Meta-kompatibelt PRODUKT-FEED (RSS 2.0 + g:-namespace) över hela
// live-katalogen. Pekas Meta Commerce Manager (Facebook + Instagram Shop),
// Google Shopping, Pinterest och TikTok-katalogen på denna URL så synkar de
// katalogen automatiskt och håller den aktuell.
//
// VIKTIGT (headless): produktlänkarna går till den headless-sajten
// (https://www.fyndplats.se/produkt/[slug]) — INTE Wix-produktsidorna — så
// shop-länkarna leder till den publika butiken. Wix:s ett-klicks-koppling
// skulle länka till Wix-URL:er (fel sajt); därför detta egna feed.
//
// Återanvänder getProducts() (cachad, visible-filtrerad) + getCollections()
// (för product_type = huvudkategori). Cache:as 1h (matchar katalog-revalidate).

import { getProducts, getCollections, fetchFeedGalleries, imgKey, type Product, type Collection } from "@/lib/products";

export const runtime = "nodejs";
export const revalidate = 3600;

const SITE = "https://www.fyndplats.se";
const BRAND = "Fyndplats";

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  // CDATA tål allt utom sekvensen "]]>" — neutralisera den defensivt.
  return `<![CDATA[${String(s).replace(/]]>/g, "]]&gt;")}]]>`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Svensk prissträng → tal. "1 199,00 kr" → 1199, "1.199,00kr" → 1199.
// Mellanslag = tusentalsavgränsare (tas bort), punkt före 3 siffror = tusental,
// komma = decimal. Returnerar null vid tomt/ogiltigt.
function parsePriceSv(s?: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d,.\s-]/g, "").replace(/\s/g, "");
  const norm = cleaned.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : null;
}

function feedItem(p: Product, mainCategory?: string, fullGallery?: string[]): string {
  const url = `${SITE}/produkt/${p.slug}`;
  const description =
    stripHtml(p.descriptionHtml || "") || p.seoDescription || p.blurb || p.name;
  const availability = p.inStock ? "in stock" : "out of stock";
  const cur = p.currency || "SEK";

  // price = ordinarie, sale_price = nedsatt (Meta/Google-konvention). originalPrice
  // är ordinariepriset (sträng); priceNum är nuvarande (nedsatta) priset.
  const regular = p.onSale ? parsePriceSv(p.originalPrice) : null;
  let priceLine: string;
  let saleLine = "";
  if (regular && regular > p.priceNum) {
    priceLine = `${regular.toFixed(2)} ${cur}`;
    saleLine = `\n      <g:sale_price>${p.priceNum.toFixed(2)} ${cur}</g:sale_price>`;
  } else {
    priceLine = `${p.priceNum.toFixed(2)} ${cur}`;
  }

  // Extra-bilder: HELA V3-galleriet när det finns (list-frågans p.gallery är
  // kapad till 6 → max 5 extra), annars p.gallery som förr. Dedupe på FIL-ID
  // (imgKey) — huvudbild och galleri-poster kan vara samma foto med olika
  // transform-params, då missade exakta URL-jämförelsen dubbletten.
  const seenImgs = new Set<string>([imgKey(p.img)]);
  const additional = ((fullGallery?.length ? fullGallery : p.gallery) || [])
    .filter((g) => {
      if (!g) return false;
      const k = imgKey(g);
      if (seenImgs.has(k)) return false;
      seenImgs.add(k);
      return true;
    })
    .slice(0, 10)
    .map((g) => `\n      <g:additional_image_link>${xmlEscape(g)}</g:additional_image_link>`)
    .join("");

  const productType = mainCategory
    ? `\n      <g:product_type>${cdata(mainCategory)}</g:product_type>`
    : "";

  return `    <item>
      <g:id>${xmlEscape(p.id)}</g:id>
      <title>${cdata(p.name)}</title>
      <description>${cdata(description.slice(0, 5000))}</description>
      <link>${xmlEscape(url)}</link>
      <g:image_link>${xmlEscape(p.img)}</g:image_link>${additional}
      <g:availability>${availability}</g:availability>
      <g:price>${priceLine}</g:price>${saleLine}
      <g:condition>new</g:condition>
      <g:brand>${BRAND}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>${productType}
    </item>`;
}

export async function GET() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  // id → Collection, för att härleda product_type (föredrar huvudkategorin =
  // parentlös; faller annars tillbaka på första matchande kategorinamn).
  const byId = new Map<string, Collection>();
  try {
    for (const c of await getCollections()) byId.set(c.id, c);
  } catch {
    // product_type är valfritt — hoppa tyst.
  }
  const mainCategoryOf = (p: Product): string | undefined => {
    const cols = p.collectionIds.map((id) => byId.get(id)).filter(Boolean) as Collection[];
    return (cols.find((c) => c.parentId === null) ?? cols[0])?.name;
  };

  // Fulla gallerier i en batchad V3-svep (id → URL:er). Fail-open: tom Map →
  // varje item faller tillbaka på p.gallery precis som före ändringen.
  const galleries = await fetchFeedGalleries();

  // Bara produkter med ett giltigt positivt pris (Meta avvisar pris 0).
  const items = products
    .filter((p) => p.priceNum > 0 && p.img && p.slug)
    .map((p) => feedItem(p, mainCategoryOf(p), galleries.get(p.id)));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Fyndplats</title>
    <link>${SITE}</link>
    <description>Fyndplats produktkatalog – noga utvalda fynd till smarta priser.</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
