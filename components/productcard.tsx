import Image from "next/image";
import type { Product } from "../lib/products";

export function ProductCard({ p }: { p: Product }) {
  return (
    <a className="prod" href={`/produkt/${p.slug}`}>
      <div className="pimg">
        {p.onSale && <span className="sale-badge">Rea</span>}
        {p.img && (
          <Image
            src={p.img}
            alt={p.name}
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
            {p.price}
            {p.onSale && p.originalPrice && <span className="pprice-old">{p.originalPrice}</span>}
          </span>
          <span className="pbtn">Köp</span>
        </div>
      </div>
    </a>
  );
}
