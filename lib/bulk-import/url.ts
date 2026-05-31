// Extraherar AliExpress-produkt-id ur en URL.
//
// Stödjer de vanligaste varianterna:
//   https://www.aliexpress.com/item/1005006789012345.html
//   https://www.aliexpress.com/item/1005006789012345.html?spm=...
//   https://aliexpress.com/i/1005006789012345.html
//   https://m.aliexpress.com/item/1005006789012345.html
//   https://a.aliexpress.com/_mN1tA2D       (kort-länk — kan inte lösas server-side utan följdrequest)
//
// Returnerar { productId } eller { error } med svensk anledning.

export interface UrlParseResult {
  productId?: string;
  /** Normaliserad URL utan spårningsparametrar. */
  normalizedUrl?: string;
  error?: string;
}

const PRODUCT_ID_RE = /(?:^|\/)(?:item|i)\/(\d{6,20})(?:\.html)?/i;
const ALIEXPRESS_HOST = /(^|\.)aliexpress\.(com|us|ru|es|fr|it|de|pl|nl|co\.kr)$/i;

export function parseAliExpressUrl(input: string): UrlParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { error: "URL saknas" };

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { error: "Ogiltig URL-syntax" };
  }

  if (!ALIEXPRESS_HOST.test(url.hostname)) {
    return { error: `Förväntade aliexpress-domän, fick "${url.hostname}"` };
  }

  // Kort-länkar (a.aliexpress.com/_xxxxxx) går inte att lösa utan att följa en
  // redirect. Bättre att tala om för användaren direkt än att tysta failas.
  if (url.hostname.toLowerCase().startsWith("a.aliexpress")) {
    return { error: "Kortlänk stöds inte — klistra in den fullständiga produkt-URL:en" };
  }

  const match = url.pathname.match(PRODUCT_ID_RE);
  if (!match) {
    return { error: "Hittade inget produkt-id i URL:en" };
  }

  const productId = match[1];
  const normalizedUrl = `https://www.aliexpress.com/item/${productId}.html`;
  return { productId, normalizedUrl };
}

/** Kanonisk URL för dedupe (samma produkt-id = samma normalizedUrl). */
export function canonicalizeAliExpressUrl(input: string): string | null {
  const parsed = parseAliExpressUrl(input);
  return parsed.normalizedUrl ?? null;
}
