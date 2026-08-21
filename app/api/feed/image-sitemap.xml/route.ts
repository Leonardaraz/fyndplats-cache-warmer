// Bild-sitemap enligt Googles image-sitemap-spec:
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
//
// Ger Google Images/Discover full lista över våra produktbilder + kopplar dem
// till respektive PDP. Ökar chansen att bilderna dyker upp i Google Bilder-sök
// och i visuella carousels i vanliga SERP:en — särskilt viktigt eftersom våra
// produkter är visuellt attraktiva (Aosom-tält, kaffemaskiner, kattlådor, etc).
//
// Skickas som fristående sitemap; refereras från /robots.ts.

import { getProducts, forListings } from "../../../../lib/products";
import type { Product } from "../../../../lib/products";

const SITE_BASE = "https://www.fyndplats.se";

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrl(p: Product): string {
  const loc = `${SITE_BASE}/produkt/${p.slug}`;
  // Alla giltiga bilder — hero först, sen gallery, dedupat.
  const all = [p.img, ...(p.gallery || [])].filter((u, i, arr) => u && arr.indexOf(u) === i);
  if (all.length === 0) return "";

  const images = all
    .slice(0, 10) // Google sitemap-spec: max 1000 bilder per URL, håll det tight
    .map(
      (u) => `    <image:image>
      <image:loc>${xmlEscape(u)}</image:loc>
      <image:title>${xmlEscape(p.name)}</image:title>
    </image:image>`,
    )
    .join("\n");

  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${images}
  </url>`;
}

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const all = await getProducts();
  const listable = forListings(all);
  const urls = listable
    .map(buildUrl)
    .filter((s) => s.length > 0)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
