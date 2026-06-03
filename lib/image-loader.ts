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
//      ändrar bara pixelstorleken för srcset:en. Crop-URL:er (/v1/crop/x,y,w,h)
//      lämnas ORÖRDA (deras w_/h_ är en beskärningsregion, inte utdatastorlek).
//      Saknas en transform (rå media-URL, t.ex. blogg-cover) använder vi `fit`
//      som bevarar bildens naturliga aspect — aldrig kvadratisk fill.
//   2. Unsplash (images.unsplash.com) → använd Unsplashs egen resizing/format-
//      CDN via query-params (w/q/auto=format), drop fast höjd så den skalar på
//      bredd och bevarar aspect (container-CSS:ens object-fit ramar in).
//   3. Lokala /public-assets + okända externa värdar → serveras orörda (kan inte
//      transformeras säkert). Inga lokala <Image> finns idag; ren skyddsnät.

import type { ImageLoaderProps } from "next/image";
import { wixMediaKey } from "./wix-image";

export default function fyndImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // ── Wix CDN ────────────────────────────────────────────────────────────────
  if (src.includes("static.wixstatic.com")) {
    const i = src.indexOf("/v1/");
    if (i !== -1) {
      const base = src.slice(0, i);
      const tail = src.slice(i);
      // Crop-URL:er (/v1/crop/x_,y_,w_,h_) definierar en beskärningsREGION i
      // originalpixlar — w_/h_ är INTE utdatastorlek. Skala dem inte; <Image>
      // sköter visningsskalningen i browsern (samma som galleriets wixMainLoader,
      // som returnerar crop-URL:en orörd). Annars manglas beskärningsgeometrin.
      if (tail.startsWith("/v1/crop/")) return src;
      // Skala den befintliga fill/fit-transformens w_/h_ proportionellt till
      // `width`. Scopar replace till svansen (efter /v1/) så media-nyckeln
      // (b379ce_<hex>~mv2.ext) aldrig råkar matchas.
      const wm = tail.match(/w_(\d+)/);
      const hm = tail.match(/h_(\d+)/);
      if (wm && hm) {
        const ow = Number(wm[1]);
        const oh = Number(hm[1]);
        const newH = ow > 0 ? Math.round((width * oh) / ow) : width;
        const newTail = tail
          .replace(/w_\d+/, `w_${width}`)
          .replace(/h_\d+/, `h_${newH}`);
        return base + newTail;
      }
      // Transform utan w_/h_ (ovanligt) → lämna orörd.
      return src;
    }
    // Rå Wix media-URL utan transform (t.ex. blogg-cover via wixImageToUrl i
    // lib/blog.ts) → använd `fit` (bevarar bildens naturliga aspect inom en
    // width×width-box), ALDRIG `fill` (som center-beskär till kvadrat och
    // förvränger banner-bilder som visas med object-fit:fill/cover).
    const key = wixMediaKey(src);
    if (key) {
      return `https://static.wixstatic.com/media/${key}/v1/fit/w_${width},h_${width},q_${quality || 72}/file.webp`;
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
