// Produktsidans huvudbild: laddaren som galleriet och förhämtningen delar.
//
// Galleriets huvudbild visas i aspect-ratio:1 med object-fit:cover, så en
// kvadratisk fill (w=h) matchar exakt utan dubbelbeskärning.
//
// q_72 i stället för 82: hjältebilden var en PNG-sourcad produktbild som
// komprimerade dåligt → 114 KB webp och ~6 s LCP på 4G (mätt på prod). Vid 72
// sparas ~25–30 % utan synlig kvalitetsförlust i webp → snabbare första paint.
// tightFillUrl: när crop-data finns i image-crops.json byggs en /v1/crop-URL
// (bbox i original-pixlar); annars samma fill-URL som tidigare. Säker fallback.
//
// ☠️ Laddaren står i en egen fil för att lib/hjaltebild-varm.ts ska bygga
// EXAKT samma adress som galleriet. Skiljer de sig åt hämtas bilden två
// gånger, och förhämtningen kostar i stället för att hjälpa.
import type { ImageLoaderProps } from "next/image";
import { tightFillUrl } from "./wix-image";

export function wixMainLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!(src || "").includes("static.wixstatic.com")) return src; // icke-Wix (ska inte hända för katalogbilder) → orört
  return tightFillUrl(src, width, width, quality || 72);
}
