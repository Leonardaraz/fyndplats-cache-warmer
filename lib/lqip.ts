// LQIP / blur-up helpers för next/image.
//
// Två lägen:
//   1. SHIMMER_BLUR  — statisk varm-tonad data-URL. Noll nätverk. Används som
//      default blurDataURL på produktkort/grid (där en per-bild-fetch på 200+
//      bilder skulle sega ner SSR). Kombineras med CSS-skelettpulsen
//      (.skel i globals.css) som ger den "pulserande" känslan.
//   2. getBlurDataURL(url) — hämtar en 16×16 webp-miniatyr från Wix-CDN:n
//      server-side och base64-kodar den till en äkta blur-up. Endast för
//      above-the-fold-hjältar (hemmets 4 hero-bilder, kategori-hero) där
//      antalet bilder är litet och blur-up-effekten syns mest.
//
// Ingen node-only import på modulnivå → SHIMMER_BLUR kan importeras även i
// klientkomponenter (gallery.tsx). getBlurDataURL anropas bara server-side.

import { cache } from "react";

// 8×8 varm gradient (matchar --warm/#f6f1ec-tonen som bild-containrarna har).
// Statisk, så den kostar inget och kan delas i klient- och serverkod.
export const SHIMMER_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0nZycgeDE9JzAnIHkxPScwJyB4Mj0nMScgeTI9JzEnPjxzdG9wIG9mZnNldD0nMCcgc3RvcC1jb2xvcj0nI2Y3ZjJlZCcvPjxzdG9wIG9mZnNldD0nMScgc3RvcC1jb2xvcj0nI2VjZTJkNicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9J3VybCglMjNnKScvPjwvc3ZnPg==";

// Wix-CDN-URL → liten blur-transform av SAMMA fil. Returnerar null om URL:en
// inte är en wixstatic-media-URL (t.ex. Unsplash-hero → vi blur:ar inte den).
function wixTinyUrl(url: string, size = 16): string | null {
  const m = (url || "").match(/static\.wixstatic\.com\/media\/([^/]+)/);
  if (!m) return null;
  return `https://static.wixstatic.com/media/${m[1]}/v1/fill/w_${size},h_${size},al_c,q_30,blur_2/file.webp`;
}

// Module-level memo över requests — blur-URL:erna är stabila per produktbild.
const memo = new Map<string, string>();

// Hämtar en äkta base64-blur för en Wix-bild. Defensiv: timeout + fallback till
// SHIMMER_BLUR så SSR aldrig hänger eller kraschar om CDN:n strular. React
// cache() dedupar inom en request; `memo` håller resultatet mellan requests.
export const getBlurDataURL = cache(async (url: string): Promise<string> => {
  if (!url) return SHIMMER_BLUR;
  if (memo.has(url)) return memo.get(url)!;
  const tiny = wixTinyUrl(url);
  if (!tiny) return SHIMMER_BLUR;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(tiny, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return SHIMMER_BLUR;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return SHIMMER_BLUR;
    const dataUrl = `data:image/webp;base64,${buf.toString("base64")}`;
    memo.set(url, dataUrl);
    return dataUrl;
  } catch {
    return SHIMMER_BLUR;
  }
});

// Bekvämlighet: hämta blur för en lista bilder parallellt (hemmets hero-mosaik).
export async function getBlurDataURLs(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((u) => getBlurDataURL(u)));
}
