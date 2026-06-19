// Google Shopping / Prisjakt-produktfeed (RSS 2.0 + g:-namespace) byggd ur
// V3-katalogen. READ-ONLY: rör ingenting i butiken — feeden blir "aktiv" först
// när dess URL lämnas in i Merchant Center / Prisjakt (vilket Leonard styr själv).
//
// Bara synliga produkter med pris + bild tas med — Merchant Center avvisar
// poster som saknar price/image/availability, och drafts ska aldrig annonseras.

import type { WixV3ProductSummary } from "../wix/v3-products";
import { productUrl, DEFAULT_URL_CONFIG, type UrlConfig } from "./urls";

export interface FeedConfig extends UrlConfig {
  title: string;
  currency: string;
  brand: string;
}

const DEFAULT_FEED_CONFIG: FeedConfig = {
  ...DEFAULT_URL_CONFIG,
  title: "Fyndplats",
  currency: "SEK",
  brand: "Fyndplats",
};

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** True om produkten är feed-duglig (synlig, har slug + pris + bild). */
export function isFeedEligible(p: WixV3ProductSummary): boolean {
  return Boolean(p.slug) && p.visible !== false && Boolean(p.priceMin) && Boolean(p.imageUrl);
}

/** Bygger ett Google Shopping-feed-XML (RSS 2.0) ur V3-produkter. */
export function buildShoppingFeedXml(
  products: WixV3ProductSummary[],
  config: Partial<FeedConfig> = {},
): string {
  const cfg = { ...DEFAULT_FEED_CONFIG, ...config };
  const items = products
    .filter(isFeedEligible)
    .map((p) => {
      const link = productUrl(p.slug, cfg);
      const desc = stripHtml(p.plainDescription || p.seoDescription || p.name).slice(0, 5000);
      const availability = p.inStock === false ? "out_of_stock" : "in_stock";
      const brand = p.brandName?.trim() || cfg.brand;
      return [
        "    <item>",
        `      <g:id>${esc(p.handle || p.id)}</g:id>`,
        `      <g:title>${esc(p.name)}</g:title>`,
        `      <g:description>${esc(desc)}</g:description>`,
        `      <g:link>${esc(link)}</g:link>`,
        `      <g:image_link>${esc(p.imageUrl!)}</g:image_link>`,
        `      <g:price>${esc(p.priceMin!)} ${esc(cfg.currency)}</g:price>`,
        `      <g:availability>${availability}</g:availability>`,
        "      <g:condition>new</g:condition>",
        `      <g:brand>${esc(brand)}</g:brand>`,
        // Vi saknar GTIN/MPN för importerade produkter → tala om det explicit,
        // annars varnar Merchant Center för "saknad identifierare".
        "      <g:identifier_exists>no</g:identifier_exists>",
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const base = cfg.baseUrl.replace(/\/+$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(cfg.title)}</title>
    <link>${esc(base)}/</link>
    <description>${esc(cfg.title)} produktfeed</description>
${items}
  </channel>
</rss>`;
}
