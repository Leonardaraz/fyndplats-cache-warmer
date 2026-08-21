// Google Product Feed (RSS 2.0 + g:namespace) för Fyndplats-katalogen.
//
// Konsumeras av:
//   • Prisjakt Merchant (kräver seller-konto + URL-registrering)
//   • PriceRunner Business (samma flöde)
//   • Kelkoo Merchant (Google Product Feed-kompatibel)
//   • Facebook Catalog / Meta Shops (om vi någonsin aktiverar Advantage+ Catalog)
//   • Compricer / andra svenska prisjämförare som pratar samma format
//
// Referens: https://support.google.com/merchants/answer/7052112
//
// Innehåll: alla `forListings`-produkter (dvs visible + in-stock). Ur-katalogen —
// inte kuraterat urval — så prisjämförelse-tjänsterna ser hela sortimentet.

import { getProducts, forListings } from "../../../../lib/products";
import type { Product } from "../../../../lib/products";

const SITE_BASE = "https://www.fyndplats.se";

// Google Merchant kräver att `link` är produktens PDP-URL (inte kategorien).
function productLink(p: Product): string {
  return `${SITE_BASE}/produkt/${p.slug}`;
}

// availability: "in stock" | "out of stock" | "preorder" | "backorder"
function availability(p: Product): string {
  return p.inStock ? "in stock" : "out of stock";
}

// Google Product Feed vill ha "PRIS VALUTA" i ett fält (t.ex. "299.00 SEK").
// p.priceNum är numeriskt (efter Wix-parsning) — säkrare än att re-parsa p.price
// (som är förlokaliserat: "299,00 kr").
function priceField(p: Product): string {
  if (!Number.isFinite(p.priceNum) || p.priceNum <= 0) return "";
  return `${p.priceNum.toFixed(2)} SEK`;
}

// Fristående — för sale_price: parsa p.originalPrice-strängen ("399,00 kr").
function parseSekAmount(s: string | undefined): number {
  if (!s) return 0;
  const clean = s.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const num = Number.parseFloat(clean);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

// Alla bilder får skickas — Google använder max 10 för produktvisning.
function additionalImages(p: Product): string[] {
  const gallery = (p.gallery || []).filter((u) => u && u !== p.img);
  return gallery.slice(0, 10);
}

// Escape för XML CDATA-osäkra fält (title/desc/brand/etc).
function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildItem(p: Product): string {
  const salePrice = priceField(p); // aktuellt (rea-)pris
  if (!salePrice) return ""; // hoppa över produkter utan giltigt pris

  const title = xmlEscape((p.seoTitle || p.name).slice(0, 150));
  // description: föredra kuraterad seoDescription > blurb > specs
  const rawDesc = p.seoDescription || p.blurb || p.specs || p.name;
  const desc = xmlEscape(rawDesc.slice(0, 5000));
  const link = xmlEscape(productLink(p));
  const image = xmlEscape(p.img || "");
  const brand = "Fyndplats"; // vi är dropship-återförsäljare, säljs som Fyndplats-produkter

  // Google-spec: <g:price> = ordinariepris, <g:sale_price> = temporärt rea-pris.
  // Vid rea: skicka BÅDA (med olika värden). Utan rea: skicka bara <g:price>.
  // Trigger på origNum > priceNum (inte p.onSale) — flaggan kan vara stale i data,
  // men prisdiff är fakta.
  const origNum = parseSekAmount(p.originalPrice);
  const hasSale = origNum > p.priceNum;
  const regularPrice = hasSale ? `${origNum.toFixed(2)} SEK` : salePrice;

  // Frivilliga fält som förbättrar visningen
  const additional = additionalImages(p)
    .map((u) => `    <g:additional_image_link>${xmlEscape(u)}</g:additional_image_link>`)
    .join("\n");

  // Google Merchant XML: <title>, <description>, <link> är RSS-native (utan g:);
  // produkt-specifika fält är namespaced (g:id, g:image_link, g:price, etc).
  return `  <item>
    <g:id>${xmlEscape(p.id)}</g:id>
    <title>${title}</title>
    <description>${desc}</description>
    <link>${link}</link>
    <g:image_link>${image}</g:image_link>${additional ? "\n" + additional : ""}
    <g:availability>${availability(p)}</g:availability>
    <g:price>${regularPrice}</g:price>${hasSale ? `\n    <g:sale_price>${salePrice}</g:sale_price>` : ""}
    <g:condition>new</g:condition>
    <g:brand>${xmlEscape(brand)}</g:brand>
    <g:identifier_exists>no</g:identifier_exists>
    <g:shipping>
      <g:country>SE</g:country>
      <g:service>Standard</g:service>
      <g:price>${p.priceNum >= 499 ? "0.00 SEK" : "49.00 SEK"}</g:price>
    </g:shipping>
  </item>`;
}

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 tim cache — flödet läses högst 1×/dag av prisjakt

export async function GET(): Promise<Response> {
  const all = await getProducts();
  const listable = forListings(all);
  const items = listable
    .map(buildItem)
    .filter((s) => s.length > 0)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Fyndplats produktflöde</title>
  <link>${SITE_BASE}</link>
  <description>Alla in-stock-produkter från Fyndplats — smarta priser på hem, kök, sport, elektronik och mer.</description>
  <language>sv-SE</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
