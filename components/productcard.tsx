import Image from "next/image";
import type { Product } from "../lib/products";
import { WishlistHeart } from "./wishlist";
import { SHIMMER_BLUR } from "../lib/lqip";
import { getCropEntry, wixMediaKey } from "../lib/wix-image";

// Wraps en Wix-CDN-URL med /v1/crop/x_..,y_..,w_..,h_..  om vi har tight-crop-
// data. Returnerar originalet annars. Next/Image plockar upp den nya URL:en
// som `src` och optimerar den vidare via /_next/image.
function tightSrc(url: string): string {
  const key = wixMediaKey(url);
  if (!key) return url;
  const crop = getCropEntry(url);
  if (!crop) return url; // ingen detection-data → orört
  return `https://static.wixstatic.com/media/${key}/v1/crop/x_${crop.x},y_${crop.y},w_${crop.w},h_${crop.h}/file.webp`;
}

export function ProductCard({ p }: { p: Product }) {
  // Hover-alt-image: använd andra bilden i galleriet (om finns) som "swap"-bild
  const altImg = p.gallery.find((g) => g !== p.img);
  const mainSrc = tightSrc(p.img);
  const altSrc = altImg ? tightSrc(altImg) : undefined;
  const lowStock = p.inStock && typeof p.stockQuantity === "number" && p.stockQuantity > 0 && p.stockQuantity <= 5;
  return (
    <a className="prod" href={`/produkt/${p.slug}`}>
      <div className="pimg">
        {/* Slutsåld-badge: OOS-produkter göms inte från listningarna (default) utan
            visas med badge + dämpad bild så kunden ser dem och kan bevaka. */}
        {!p.inStock && <span className="oos-badge">Slutsåld</span>}
        {p.onSale && p.inStock && <span className="sale-badge">Rea</span>}
        {!p.onSale && p.inStock && p.ribbon === "Bestseller" && <span className="ribbon-badge ribbon-bestseller">Bästsäljare</span>}
        {lowStock && <span className="low-stock-badge">Endast {p.stockQuantity} kvar</span>}
        <WishlistHeart slug={p.slug} />
        {mainSrc && (
          <Image
            className="pimg-main"
            src={mainSrc}
            alt={p.name}
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            style={{ objectFit: "cover" }}
          />
        )}
        {altSrc && (
          <Image
            className="pimg-alt"
            src={altSrc}
            alt=""
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="pbody">
        <div clas