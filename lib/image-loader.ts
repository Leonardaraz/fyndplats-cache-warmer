"use client";
// lib/image-loader.ts
// Global next/image-loader (kopplas in via `images.loaderFile` i next.config.ts).
//
// Syfte: ta bort Vercels /_next/image-optimerare ur den kritiska vägen för HELA
// sajten. Optimeraren kallstartar per ny bild och lägger en extra hop. Våra
// bildkällor (Wix CDN, Unsplash) kan själva leverera exakt-storlek + modernt
// format direkt från sina globala CDN:er, så vi pekar next/image dit istället.
// Det ger fortfarande en responsiv `srcset` (loadern anropas per bredd), till
// skillnad från `unoptimized` som ger en enda fast storlek.
//
// Galleriets explicita `loader={wixMainLoader}` (Client Component) fortsätter
// att åsidosätta denna globala loader lokalt — identiskt beteende, så LCP-vägen
// rörs inte.
//
// En global loader gäller VARJE <Image>, så den måste hantera alla källor:
//   1. Wix (static.wixstatic.com)  → skala den befintliga fill/fit-transformens
//      w_/h_ proportionellt till begärd bredd. Detta BEVARAR varje bilds form
//      (kvadratiska produktkort vs breda blogg-/hero-banners), op (fill/fit),
//      gravity (al_c), kvalitet (q_*) och format som anroparen redan valt — vi
//      ändrar bara pixelstorleken för srcset:en. I crop-URL:er (/v1/crop/x,y,w,h)
//      är w_/h_ en beskärningsregion, inte utdatastorlek: bara en efterföljande
//      /fill/-del skalas (lib/wix-crop.ts). Sedan 2026-11-25 får fill- och
//      fit-delen dessutom Wix skärpning (usm), se medSkarpning i samma fil.
//      Saknas en transform (rå media-URL, t.ex. blogg-cover) använder vi `fit`
//      som bevarar bildens naturliga aspect — aldrig kvadratisk fill.
//   2. Unsplash (images.unsplash.com) → använd Unsplashs egen resizing/format-
//      CDN via query-params (w/q/auto=format), drop fast höjd så den skalar på
//      bredd och bevarar aspect (container-CSS:ens object-fit ramar in).
//   3. Lokala /public-assets + okända externa värdar → serveras orörda (kan inte
//      transformeras säkert). Den här grenen ÄR i bruk: bloggomslagen som bor i
//      /public (blog-*.jpg) pekas ut med absolut fyndplats.se-adress och faller
//      hit. Ta inte bort den som död kod.

import type { ImageLoaderProps } from "next/image";
import { wixMediaKey } from "./wix-image";
import { medSkarpning, skalaWixSvans, WIX_SKARPNING } from "./wix-crop";

// ☠️ BREDDERNA 530 OCH 542 ÄR KORTETS OCH HUVUDBILDENS, INTE ALLAS (2026-11-25).
//
// De står i srcset för att produktkortet (265 px, 530 i dubbel täthet) och
// produktsidans huvudbild (542 px) ska få en fil som är exakt så bred som
// rutan (lib/bild-sizes.ts). De två har sin egen laddare (lib/hjalte-loader.ts).
// Varje ANNAN bild går genom laddaren här, och för dem betyder 530w och 542w
// samma fil som förut, 640 px:
//
// - En bild som beskärs i sin ruta (object-fit:cover i en ruta med annan form)
//   behöver fler pixlar än `sizes` säger. Bloggkorten på /blogg och /kopguider
//   fick 530 × 231 i en ruta på 267 × 267 och förstorades 1,16 gånger, mot
//   640 × 279 förut (mätt mot ett lokalt bygge samma dag).
// - Unsplash-fotona har ingen skärpning att lägga på, och färre pixlar att
//   skala ned från gör dem mjukare.
//
// Bredden i srcset (530w) stämmer då inte med filen (640 px), men den styr
// bara VALET av fil. 265 och 1084 står inte här: de har tagit över efter
// Nexts 256 och 1080 och är aldrig mindre än dem.
const SOM_FORR: Record<number, number> = { 530: 640, 542: 640 };

export default function fyndImageLoader({ src, width: begard, quality }: ImageLoaderProps): string {
  const width = SOM_FORR[begard] ?? begard;
  // ── Wix CDN ────────────────────────────────────────────────────────────────
  if (src.includes("static.wixstatic.com")) {
    const i = src.indexOf("/v1/");
    if (i !== -1) {
      // Skala transformens utdatastorlek till `width` (lib/wix-crop). Scopat
      // till svansen efter /v1/, så media-nyckeln (b379ce_<hex>~mv2.ext) aldrig
      // råkar matchas. En crop-rektangel (/v1/crop/x_,y_,w_,h_) är
      // originalpixlar, inte utdatastorlek: följs den av /fill/ skalas bara
      // fill-delen, annars lämnas adressen orörd.
      // Skärpningen läggs på samtidigt (lib/wix-crop, medSkarpning): Wix lämnar
      // annars den förminskade bilden mjuk.
      const svans = skalaWixSvans(src.slice(i), width);
      return svans === null ? src : src.slice(0, i) + medSkarpning(svans);
    }
    // Rå Wix media-URL utan transform (t.ex. blogg-cover via wixImageToUrl i
    // lib/blog.ts) → använd `fit` (bevarar bildens naturliga aspect inom en
    // width×width-box), ALDRIG `fill` (som center-beskär till kvadrat och
    // förvränger banner-bilder som visas med object-fit:fill/cover).
    const key = wixMediaKey(src);
    if (key) {
      return `https://static.wixstatic.com/media/${key}/v1/fit/w_${width},h_${width},q_${quality || 72},${WIX_SKARPNING}/file.webp`;
    }
    return src;
  }

  // ── Unsplash (egen resizing/format-CDN) ──────────────────────────────────────
  if (src.includes("images.unsplash.com")) {
    try {
      const u = new URL(src);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality || 80));
      u.searchParams.set("auto", "format");
      u.searchParams.delete("h"); // skala på bredd, bevara aspect; object-fit ramar in
      return u.toString();
    } catch {
      return src;
    }
  }

  // ── Lokala assets / okända externa värdar → orört ────────────────────────────
  return src;
}
