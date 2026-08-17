import Image from "next/image";
import type { Product } from "../lib/products";
import { WishlistHeart } from "./wishlist";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import { Stars } from "./stars";

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
            // Dekorativ: samma länk visar redan huvudbilden med alt={p.name} och
            // produktnamnet som text. Med alt här läste skärmläsare namnet två
            // gånger per kort. Tom alt = hoppa över dubbletten.
            alt=""
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="pbody">
        <div className="pname">{p.name}</div>
        {/* Betyget sitter mellan namn och pris: kunden ser vad andra tyckt i
            samma ögonkast som priset, i stället för först efter ett klick in på
            produktsidan.

            Raden renderas ALLTID, men står tom för produkter utan omdömen. Runt
            hälften av katalogen saknar betyg, och utan reserverad höjd (min-height
            i .prating, samma grepp som .pname redan använder) hade priset och
            köpknappen hamnat på olika höjd i grannkorten. Tom rad = inget synligt
            innehåll, bara utrymmet. */}
        <div className="prating">
          {p.rating && (
            <>
              <Stars rating={p.rating.exact} className="prating-stars" />
              <span className="prating-val">{p.rating.value}</span>
              <span className="prating-count">({p.rating.count})</span>
            </>
          )}
        </div>
        <div className="prow">
          <span className="pprice">
            {/* pprice-now håller "Från X" / priset ihop på en rad (nowrap) så det
                aldrig bryts mitt itu; ett ev. överstruket gammalt pris radbryter
                i stället under, och "Köp"-knappen förblir alltid synlig. */}
            <span className="pprice-now">{p.hasRange ? `Från ${p.priceFrom}` : p.price}</span>
            {p.onSale && p.originalPrice && <span className="pprice-old">{p.originalPrice}</span>}
          </span>
          {/* Slutsålt kort får ALDRIG säga "Köp" — knappen är ett löfte, och på en
              vara som är slut spricker det vid första klicket. "Bevaka" är exakt
              vad produktsidan erbjuder (bevakningsformuläret), och dämpad grå så
              den aldrig konkurrerar med de köpbara korten. */}
          <span className="pbtn" style={{ background: p.inStock ? "#C2410C" : "#52606D" }}>
            {p.inStock ? "Köp" : "Bevaka"}
          </span>
        </div>
      </div>
    </a>
  );
}
