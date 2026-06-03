import Image from "next/image";
import type { Product } from "../lib/products";
import { WishlistHeart } from "./wishlist";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";

export function ProductCard({ p }: { p: Product }) {
  // Hover-alt-image: använd andra bilden i galleriet (om finns) som "swap"-bild
  const altImg = p.gallery.find((g) => g !== p.img);
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
        {/* Bilderna serveras via den globala loadern (lib/image-loader.ts) direkt
            från Wix CDN med responsiv srcset — ingen /_next/image-optimerare. */}
        {p.img && (
          <Image
            className="pimg-main"
            src={tightFillUrl(p.img, 600, 600)}
            alt={p.name}
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            style={{ objectFit: "cover" }}
          />
        )}
        {altImg && (
          <Image
            className="pimg-alt"
            src={tightFillUrl(altImg, 600, 600)}
            alt=""
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="pbody">
        <div className="pname">{p.name}</div>
        <div className="prow">
          <span className="pprice">
            {/* pprice-now håller "Från X" / priset ihop på en rad (nowrap) så det
                aldrig bryts mitt itu; ett ev. överstruket gammalt pris radbryter
                i stället under, och "Köp"-knappen förblir alltid synlig. */}
            <span className="pprice-now">{p.hasRange ? `Från ${p.priceFrom}` : p.price}</span>
            {p.onSale && p.originalPrice && <span className="pprice-old">{p.originalPrice}</span>}
          </span>
          <span className="pbtn" style={{ background: "#C2410C" }}>Köp</span>
        </div>
      </div>
    </a>
  );
}
