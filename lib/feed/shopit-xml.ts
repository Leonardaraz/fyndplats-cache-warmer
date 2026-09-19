// Bygger en Google Shopping-formaterad XML (RSS 2.0 + g:-namespace) av
// katalogen — formatet Shopit (business.shopit.com) själva anger att de
// föredrar för sitt "Product Feed URL"-fält, eftersom det redan bär allt de
// behöver.
//
// Medvetna uteslutningar, alla spårbara mot husets egna regler (CLAUDE.md):
//   - Inget g:brand, inget g:gtin/g:mpn. Leverantörens varumärken (HOMCOM,
//     Outsunny m.fl.) stryks vid polering och ska aldrig synas utåt igen —
//     och EAN/GTIN saknas helt i både Aosom- och AliExpress-underlaget
//     (uppmätt: 100 % tomma rader). `identifier_exists: no` är Googles egen,
//     dokumenterade lösning för produkter utan tillverkaridentifierare —
//     inte att hitta på ett varumärke som inte är sant.
//   - Ingen g:shipping, ingen leveranstid. Shopit-panelen har redan egna
//     kontostandarder för det ("Default values for Optional fields") —
//     bättre att fylla i dem DÄR än att gissa fram ett löfte per produkt
//     här. Husets regel: ett fabricerat leveranslöfte är värre än inget.
//   - Inget g:google_product_category. Kräver en mappning mot Googles egen
//     taxonomi som inte finns byggd i det här repot — fel att gissa.

export interface ShopitFeedItem {
  id: string;
  title: string;
  descriptionHtml?: string;
  link: string;
  imageUrl?: string;
  priceSek: number;
  inStock: boolean;
}

export interface ShopitFeedMeta {
  siteTitle: string;
  siteUrl: string;
}

export function buildShopitFeedXml(items: readonly ShopitFeedItem[], meta: ShopitFeedMeta): string {
  const entries = items.map(itemXml).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${escapeXml(meta.siteTitle)}</title>
<link>${escapeXml(meta.siteUrl)}</link>
<description>Produktflöde — ${escapeXml(meta.siteTitle)}</description>
${entries}
</channel>
</rss>
`;
}

function itemXml(item: ShopitFeedItem): string {
  const description = stripHtmlToText(item.descriptionHtml ?? "").slice(0, 5000);
  const availability = item.inStock ? "in_stock" : "out_of_stock";
  const price = `${item.priceSek.toFixed(2)} SEK`;
  return [
    "<item>",
    `<g:id>${escapeXml(item.id)}</g:id>`,
    `<g:title>${cdata(item.title.slice(0, 150))}</g:title>`,
    `<g:description>${cdata(description)}</g:description>`,
    `<link>${escapeXml(item.link)}</link>`,
    item.imageUrl ? `<g:image_link>${escapeXml(item.imageUrl)}</g:image_link>` : "",
    `<g:availability>${availability}</g:availability>`,
    `<g:price>${price}</g:price>`,
    "<g:condition>new</g:condition>",
    "<g:identifier_exists>no</g:identifier_exists>",
    "</item>",
  ]
    .filter(Boolean)
    .join("\n");
}

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** ']]>' kan aldrig förekomma i en CDATA-sektion — bryts defensivt om källtexten ändå bär den. */
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}
