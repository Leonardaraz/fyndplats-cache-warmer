// GET /feed/google.xml
//
// Google Merchant Center-feed på VARIANTNIVÅ (RSS 2.0 + g:-namespace): en
// <item> per köpbar variant, grupperade med g:item_group_id per produkt.
// Ersätter den externa feed-tjänsten (fyndplats-feed-1.vercel.app) som hade
// två fel: (1) inga additional_image_link → Google såg 1 bild/produkt,
// (2) många små Wix-anrop per request → rate limit → olika många items per
// hämtning (produkter tappades ur Google).
//
// Lösningen här: route-nivå-ISR (revalidate 3600) så Wix anropas EN gång i
// timmen oavsett trafik, batchade V3-anrop med retry/backoff (~2 anrop för
// alla varianter + ~4 för gallerierna), och upp till 10 extra bilder per item
// från produktgalleriet. Länkar pekar ALLTID på den headless-sajten
// (https://www.fyndplats.se/produkt/<slug>) — aldrig Wix-URL:er.
//
// /feed/products.xml (produktnivå) behålls orörd för Meta/Pinterest/TikTok.

import {
  getProducts,
  fetchAllVariantsRaw,
  fetchFeedGalleries,
  imgKey,
  type Product,
} from "@/lib/products";

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

// Avkoda vanliga HTML-entiteter (seoDescription kan innehålla &amp; m.fl.)
// INNAN vi XML-escapar — annars dubbel-escapas de (&amp;amp;).
function decodeEntities(s: string): string {
  return String(s)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Google-attribut per optionsnamn. Svenska (katalogens options är översatta
// vid import) + engelska råformer som säkerhetsnät för äldre produkter.
function googleAttr(optionName: string): "color" | "size" | "material" | "pattern" | null {
  const n = optionName.trim().toLowerCase();
  if (n === "färg" || n === "color" || n === "colour") return "color";
  if (n === "storlek" || n === "längd" || n === "size" || n === "length") return "size";
  if (n === "material") return "material";
  if (n === "mönster" || n === "pattern") return "pattern";
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function feedItem(v: any, product: Product | undefined, gallery: string[]): string | null {
  const pd = v?.productData || {};
  const slug: string = pd.slug || product?.slug || "";
  if (!slug || pd.visible === false || v?.visible === false) return null;

  const productName: string = pd.name || product?.name || "";
  const choices: { option: string; choice: string }[] = (v?.optionChoices || [])
    .map((oc: any) => ({
      option: oc?.optionChoiceNames?.optionName || "",
      choice: oc?.optionChoiceNames?.choiceName || "",
    }))
    .filter((c: any) => c.choice);

  const suffix = choices.map((c) => c.choice).join(" / ");
  const title = (suffix ? `${productName} - ${suffix}` : productName).slice(0, 150);

  const amount = Number(v?.price?.actualPrice?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const mainImg: string = product?.img || gallery[0] || "";
  const image: string = v?.media?.image?.url || mainImg;
  if (!image) return null;

  // Extra bilder: galleriet exkl. huvudbilden OCH exkl. den valda item-bilden,
  // dedupat på fil-id (samma foto förekommer med olika transform-params), max 10.
  const seen = new Set<string>([imgKey(image), imgKey(mainImg)]);
  const additional = gallery
    .filter((g) => {
      if (!g) return false;
      const k = imgKey(g);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 10)
    .map((g) => `\n      <g:additional_image_link>${xmlEscape(g)}</g:additional_image_link>`)
    .join("");

  const description = decodeEntities(
    product?.seoDescription || pd.seoDescription || productName,
  ).slice(0, 5000);

  // Variant-attribut: Färg→color, Storlek/Längd→size, Material→material,
  // Mönster→pattern. Custom-options (Modell, Paket …) ligger redan i titeln;
  // som särskiljande fallback sätts g:size till valnamnen om size saknas
  // (Google kräver minst ett särskiljande attribut per item_group).
  const attrs: Record<string, string> = {};
  const custom: string[] = [];
  for (const c of choices) {
    const a = googleAttr(c.option);
    if (a) { if (!attrs[a]) attrs[a] = c.choice; }
    else custom.push(c.choice);
  }
  if (!attrs.size && custom.length) attrs.size = custom.join(" / ");
  const attrLines = (["color", "size", "material", "pattern"] as const)
    .filter((a) => attrs[a])
    .map((a) => `\n      <g:${a}>${xmlEscape(attrs[a])}</g:${a}>`)
    .join("");

  const sku: string = v?.sku || "";
  const inStock = v?.inventoryStatus?.inStock !== false;

  return `    <item>
      <g:id>${xmlEscape(v.id || v.variantId)}</g:id>
      <g:item_group_id>${xmlEscape(pd.productId || "")}</g:item_group_id>
      <g:title>${xmlEscape(title)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(`${SITE}/produkt/${slug}`)}</g:link>
      <g:image_link>${xmlEscape(image)}</g:image_link>${additional}
      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${amount.toFixed(2)} SEK</g:price>
      <g:brand>${BRAND}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>${sku ? `\n      <g:mpn>${xmlEscape(sku)}</g:mpn>` : ""}${attrLines}
    </item>`;
}

export async function GET() {
  // Tre batchade, cachade källor — inga per-produkt-anrop:
  //   getProducts()        → visible-filtrerad katalog (seoDescription, img, slug)
  //   fetchFeedGalleries() → fulla gallerier, id → URL:er (~4 anrop)
  //   fetchAllVariantsRaw()→ alla varianter (~2 anrop, retry/backoff)
  let products: Product[] = [];
  try { products = await getProducts(); } catch { products = []; }
  const byId = new Map(products.map((p) => [p.id, p]));
  const galleries = await fetchFeedGalleries();
  const variants = await fetchAllVariantsRaw();

  const items: string[] = [];
  for (const v of variants) {
    const pid = v?.productData?.productId || "";
    const line = feedItem(v, byId.get(pid), galleries.get(pid) || []);
    if (line) items.push(line);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Fyndplats</title>
    <link>${SITE}</link>
    <description>Fyndplats produktkatalog för Google Merchant Center – noga utvalda fynd till smarta priser.</description>
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
